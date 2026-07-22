import { Request, Response } from 'express';
import { sendSuccess } from '../../utils/api-response';
import { BadRequestError } from '../../utils/errors';
import { supportService } from './support.service';

export class SupportController {
  async listConcerns(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as {
      page: number;
      limit: number;
      activeOnly: boolean;
    };
    const result = await supportService.listConcerns(query.page, query.limit, query.activeOnly);
    sendSuccess(res, 'Concerns fetched', result);
  }

  async getConcern(req: Request, res: Response): Promise<void> {
    const concern = await supportService.getConcernById(req.params.id);
    sendSuccess(res, 'Concern fetched', { concern });
  }

  async createConcern(req: Request, res: Response): Promise<void> {
    const concern = await supportService.createConcern(req.user!.id, req.body);
    sendSuccess(res, 'Concern created', { concern }, 201);
  }

  async updateConcern(req: Request, res: Response): Promise<void> {
    const concern = await supportService.updateConcern(req.params.id, req.body);
    sendSuccess(res, 'Concern updated', { concern });
  }

  async deleteConcern(req: Request, res: Response): Promise<void> {
    const concern = await supportService.deleteConcern(req.params.id);
    sendSuccess(res, 'Concern deactivated', { concern });
  }

  async createTicket(req: Request, res: Response): Promise<void> {
    const ticket = await supportService.createTicket(req.user!.id, req.body);
    sendSuccess(res, 'Support ticket created', { ticket }, 201);
  }

  async uploadImage(req: Request, res: Response): Promise<void> {
    if (!req.file) {
      throw new BadRequestError('file is required (multipart field name: file)');
    }
    const result = await supportService.uploadImage(req.user!.id, req.file);
    sendSuccess(res, 'Image uploaded', result, 201);
  }

  async listTickets(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as {
      page: number;
      limit: number;
      status?: 'open' | 'in_progress' | 'resolved' | 'closed';
      mineOnly: boolean;
    };
    const result = await supportService.listTickets(
      req.user!.id,
      query.page,
      query.limit,
      query.status,
      query.mineOnly,
    );
    sendSuccess(res, 'Tickets fetched', result);
  }

  async getTicket(req: Request, res: Response): Promise<void> {
    const ticket = await supportService.getTicketById(req.params.id, req.user!.id);
    sendSuccess(res, 'Ticket fetched', { ticket });
  }

  async getTicketByNumber(req: Request, res: Response): Promise<void> {
    const ticket = await supportService.getTicketByNumber(
      req.params.ticketNumber,
      req.user!.id,
    );
    sendSuccess(res, 'Ticket fetched', { ticket });
  }

  async updateTicketStatus(req: Request, res: Response): Promise<void> {
    const ticket = await supportService.updateTicketStatus(
      req.params.id,
      req.user!.id,
      req.body,
    );
    sendSuccess(res, 'Ticket status updated', { ticket });
  }

  async getTicketImage(req: Request, res: Response): Promise<void> {
    const result = await supportService.getTicketImage(
      req.params.id,
      req.params.imageId,
      req.user!.id,
    );
    if ('redirectUrl' in result) {
      res.redirect(302, result.redirectUrl);
      return;
    }
    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.status(200).send(result.buffer);
  }
}

export const supportController = new SupportController();
