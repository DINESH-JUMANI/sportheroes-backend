import { Prisma, SupportTicketStatusType } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../../utils/errors';
import { Logger } from '../../utils/logger';
import { buildPaginationMeta, getPagination } from '../../utils/pagination';
import { decodeImageBase64, toPublicConcern, toPublicTicket } from './support.types';
import type {
  CreateConcernInput,
  CreateTicketInput,
  UpdateConcernInput,
  UpdateTicketStatusInput,
} from './support.validators';

const ticketInclude = {
  concern: true,
  images: {
    orderBy: { sortOrder: 'asc' as const },
    select: {
      id: true,
      ticketId: true,
      mimeType: true,
      sortOrder: true,
      createdAt: true,
      imageBlob: true,
    },
  },
  statusLogs: { orderBy: { createdAt: 'asc' as const } },
  creator: true,
} satisfies Prisma.SupportTicketInclude;

export class SupportService {
  async listConcerns(page: number, limit: number, activeOnly = true) {
    const { skip, take } = getPagination({ page, limit });
    const where = activeOnly ? { isActive: true } : {};

    const [concerns, total] = await Promise.all([
      prisma.supportConcern.findMany({
        where,
        skip,
        take,
        orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
      }),
      prisma.supportConcern.count({ where }),
    ]);

    return {
      concerns: concerns.map(toPublicConcern),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async getConcernById(id: string) {
    const concern = await prisma.supportConcern.findUnique({ where: { id } });
    if (!concern || !concern.isActive) throw new NotFoundError('Concern not found');
    return toPublicConcern(concern);
  }

  async createConcern(userId: string, input: CreateConcernInput) {
    const existing = await prisma.supportConcern.findUnique({ where: { code: input.code } });
    if (existing) throw new ConflictError('Concern code already exists');

    if (input.isOther) {
      const other = await prisma.supportConcern.findFirst({
        where: { isOther: true, isActive: true },
      });
      if (other) {
        throw new BadRequestError('An active "Other" concern already exists');
      }
    }

    const concern = await prisma.supportConcern.create({
      data: {
        code: input.code,
        label: input.label,
        description: input.description ?? null,
        sortOrder: input.sortOrder ?? 0,
        isOther: input.isOther ?? false,
        createdBy: userId,
      },
    });

    Logger.info('Support concern created', { concernId: concern.id, code: concern.code });
    return toPublicConcern(concern);
  }

  async updateConcern(id: string, input: UpdateConcernInput) {
    const existing = await prisma.supportConcern.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Concern not found');

    if (input.isOther === true && !existing.isOther) {
      const other = await prisma.supportConcern.findFirst({
        where: { isOther: true, isActive: true, NOT: { id } },
      });
      if (other) {
        throw new BadRequestError('An active "Other" concern already exists');
      }
    }

    const concern = await prisma.supportConcern.update({
      where: { id },
      data: {
        ...(input.label !== undefined ? { label: input.label } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
        ...(input.isOther !== undefined ? { isOther: input.isOther } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
    });

    Logger.info('Support concern updated', { concernId: id });
    return toPublicConcern(concern);
  }

  async deleteConcern(id: string) {
    const existing = await prisma.supportConcern.findUnique({ where: { id } });
    if (!existing || !existing.isActive) throw new NotFoundError('Concern not found');

    const concern = await prisma.supportConcern.update({
      where: { id },
      data: { isActive: false },
    });
    Logger.info('Support concern deactivated', { concernId: id });
    return toPublicConcern(concern);
  }

  private async nextTicketNumber(tx: Prisma.TransactionClient): Promise<string> {
    const rows = await tx.$queryRaw<{ n: bigint }[]>`
      SELECT nextval('support_ticket_number_seq') AS n
    `;
    const n = Number(rows[0]?.n ?? 1);
    return `SH-${String(n).padStart(6, '0')}`;
  }

  async createTicket(userId: string, input: CreateTicketInput) {
    const concern = await prisma.supportConcern.findUnique({ where: { id: input.concernId } });
    if (!concern || !concern.isActive) throw new NotFoundError('Concern not found');

    if (concern.isOther && !input.otherConcernText?.trim()) {
      throw new BadRequestError('otherConcernText is required when concern is "Other"');
    }

    const images = input.images ?? [];
    for (const img of images) {
      const bytes = decodeImageBase64(img.imageBase64);
      if (bytes.length === 0) throw new BadRequestError('Invalid image data');
      if (bytes.length > 5 * 1024 * 1024) {
        throw new BadRequestError('Each image must be under 5MB');
      }
    }

    const ticket = await prisma.$transaction(async (tx) => {
      const ticketNumber = await this.nextTicketNumber(tx);

      return tx.supportTicket.create({
        data: {
          ticketNumber,
          concernId: concern.id,
          otherConcernText: concern.isOther ? input.otherConcernText!.trim() : null,
          description: input.description,
          status: 'open',
          createdBy: userId,
          images: {
            create: images.map((img, index) => ({
              imageBlob: Buffer.from(decodeImageBase64(img.imageBase64)),
              mimeType: img.mimeType,
              sortOrder: index,
            })),
          },
          statusLogs: {
            create: {
              previousStatus: null,
              newStatus: 'open',
              changedBy: userId,
              note: 'Ticket created',
            },
          },
        },
        include: ticketInclude,
      });
    });

    Logger.info('Support ticket created', {
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
      userId,
    });
    return toPublicTicket(ticket);
  }

  async listTickets(
    userId: string,
    page: number,
    limit: number,
    status?: SupportTicketStatusType,
    mineOnly = true,
  ) {
    const { skip, take } = getPagination({ page, limit });
    const where = {
      ...(mineOnly ? { createdBy: userId } : {}),
      ...(status ? { status } : {}),
    };

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          concern: true,
          images: {
            orderBy: { sortOrder: 'asc' },
            select: {
              id: true,
              ticketId: true,
              mimeType: true,
              sortOrder: true,
              createdAt: true,
              imageBlob: true,
            },
          },
        },
      }),
      prisma.supportTicket.count({ where }),
    ]);

    return {
      tickets: tickets.map(toPublicTicket),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async getTicketById(ticketId: string, userId: string) {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: ticketInclude,
    });
    if (!ticket) throw new NotFoundError('Ticket not found');
    if (ticket.createdBy !== userId) {
      throw new ForbiddenError('You can only view your own tickets');
    }
    return toPublicTicket(ticket);
  }

  async getTicketByNumber(ticketNumber: string, userId: string) {
    const ticket = await prisma.supportTicket.findUnique({
      where: { ticketNumber: ticketNumber.toUpperCase() },
      include: ticketInclude,
    });
    if (!ticket) throw new NotFoundError('Ticket not found');
    if (ticket.createdBy !== userId) {
      throw new ForbiddenError('You can only view your own tickets');
    }
    return toPublicTicket(ticket);
  }

  async updateTicketStatus(ticketId: string, userId: string, input: UpdateTicketStatusInput) {
    const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundError('Ticket not found');
    if (ticket.createdBy !== userId) {
      throw new ForbiddenError('You can only update your own tickets');
    }
    if (ticket.status === input.status) {
      throw new BadRequestError(`Ticket is already ${input.status}`);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.supportTicket.update({
        where: { id: ticketId },
        data: { status: input.status },
        include: ticketInclude,
      });

      await tx.supportTicketStatusLog.create({
        data: {
          ticketId,
          previousStatus: ticket.status,
          newStatus: input.status,
          changedBy: userId,
          note: input.note ?? null,
        },
      });

      return result;
    });

    Logger.info('Support ticket status updated', {
      ticketId,
      from: ticket.status,
      to: input.status,
    });
    return toPublicTicket(updated);
  }

  async getTicketImage(ticketId: string, imageId: string, userId: string) {
    const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundError('Ticket not found');
    if (ticket.createdBy !== userId) {
      throw new ForbiddenError('You can only view images on your own tickets');
    }

    const image = await prisma.supportTicketImage.findFirst({
      where: { id: imageId, ticketId },
    });
    if (!image) throw new NotFoundError('Image not found');

    return {
      buffer: Buffer.from(image.imageBlob),
      mimeType: image.mimeType,
    };
  }
}

export const supportService = new SupportService();
