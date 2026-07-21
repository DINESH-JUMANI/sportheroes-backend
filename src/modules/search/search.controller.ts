import { Request, Response } from 'express';
import { sendSuccess } from '../../utils/api-response';
import { searchService } from './search.service';

export class SearchController {
  async search(req: Request, res: Response): Promise<void> {
    const result = await searchService.search(req.query as never);
    sendSuccess(res, 'Search completed', result);
  }
}

export const searchController = new SearchController();
