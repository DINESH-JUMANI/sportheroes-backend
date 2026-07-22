import type {
  SupportConcern,
  SupportTicket,
  SupportTicketImage,
  SupportTicketStatusLog,
  User,
} from '@prisma/client';

export interface PublicSupportConcern {
  id: string;
  code: string;
  label: string;
  description: string | null;
  sortOrder: number;
  isOther: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PublicTicketImageMeta {
  id: string;
  imageUrl: string | null;
  mimeType: string;
  sortOrder: number;
  createdAt: string;
}

export interface PublicSupportTicket {
  id: string;
  ticketNumber: string;
  concernId: string;
  otherConcernText: string | null;
  description: string;
  status: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  concern?: PublicSupportConcern;
  images?: PublicTicketImageMeta[];
  statusLogs?: {
    id: string;
    previousStatus: string | null;
    newStatus: string;
    changedBy: string;
    note: string | null;
    createdAt: string;
  }[];
  creator?: {
    id: string;
    fullName: string;
    phoneNumber: string | null;
  };
}

export function toPublicConcern(c: SupportConcern): PublicSupportConcern {
  return {
    id: c.id,
    code: c.code,
    label: c.label,
    description: c.description,
    sortOrder: c.sortOrder,
    isOther: c.isOther,
    isActive: c.isActive,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

export function toPublicTicketImageMeta(img: SupportTicketImage): PublicTicketImageMeta {
  return {
    id: img.id,
    imageUrl: img.imageUrl,
    mimeType: img.mimeType,
    sortOrder: img.sortOrder,
    createdAt: img.createdAt.toISOString(),
  };
}

type TicketWithRelations = SupportTicket & {
  concern?: SupportConcern;
  images?: SupportTicketImage[];
  statusLogs?: SupportTicketStatusLog[];
  creator?: User;
};

export function toPublicTicket(ticket: TicketWithRelations): PublicSupportTicket {
  return {
    id: ticket.id,
    ticketNumber: ticket.ticketNumber,
    concernId: ticket.concernId,
    otherConcernText: ticket.otherConcernText,
    description: ticket.description,
    status: ticket.status,
    createdBy: ticket.createdBy,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    concern: ticket.concern ? toPublicConcern(ticket.concern) : undefined,
    images: ticket.images?.map(toPublicTicketImageMeta),
    statusLogs: ticket.statusLogs?.map((log) => ({
      id: log.id,
      previousStatus: log.previousStatus,
      newStatus: log.newStatus,
      changedBy: log.changedBy,
      note: log.note,
      createdAt: log.createdAt.toISOString(),
    })),
    creator: ticket.creator
      ? {
          id: ticket.creator.id,
          fullName: ticket.creator.fullName,
          phoneNumber: ticket.creator.phoneNumber,
        }
      : undefined,
  };
}

export function decodeImageBase64(base64: string): Uint8Array {
  const data = base64.includes(',') ? base64.split(',')[1]! : base64;
  return new Uint8Array(Buffer.from(data, 'base64'));
}
