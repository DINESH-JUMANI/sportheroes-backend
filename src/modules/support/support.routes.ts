import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { imageUpload } from '../../middleware/upload.middleware';
import { validate } from '../../middleware/validate.middleware';
import { asyncHandler } from '../../utils/async-handler';
import { uuidParamSchema } from '../../utils/pagination';
import { supportController } from './support.controller';
import {
  createConcernSchema,
  createTicketSchema,
  listConcernsQuerySchema,
  listTicketsQuerySchema,
  ticketNumberParamSchema,
  updateConcernSchema,
  updateTicketStatusSchema,
} from './support.validators';
import { z } from 'zod';

const router = Router();

const ticketImageParamsSchema = z.object({
  id: z.string().uuid(),
  imageId: z.string().uuid(),
});

// Concerns — public list for dropdown; mutations require auth
router.get(
  '/concerns',
  validate(listConcernsQuerySchema, 'query'),
  asyncHandler(supportController.listConcerns.bind(supportController)),
);
router.get(
  '/concerns/:id',
  validate(uuidParamSchema, 'params'),
  asyncHandler(supportController.getConcern.bind(supportController)),
);

router.use(authenticate);

router.post(
  '/upload-image',
  imageUpload.single('file'),
  asyncHandler(supportController.uploadImage.bind(supportController)),
);

router.post(
  '/concerns',
  validate(createConcernSchema),
  asyncHandler(supportController.createConcern.bind(supportController)),
);
router.patch(
  '/concerns/:id',
  validate(uuidParamSchema, 'params'),
  validate(updateConcernSchema),
  asyncHandler(supportController.updateConcern.bind(supportController)),
);
router.delete(
  '/concerns/:id',
  validate(uuidParamSchema, 'params'),
  asyncHandler(supportController.deleteConcern.bind(supportController)),
);

// Tickets
router.post(
  '/tickets',
  validate(createTicketSchema),
  asyncHandler(supportController.createTicket.bind(supportController)),
);
router.get(
  '/tickets',
  validate(listTicketsQuerySchema, 'query'),
  asyncHandler(supportController.listTickets.bind(supportController)),
);
router.get(
  '/tickets/by-number/:ticketNumber',
  validate(ticketNumberParamSchema, 'params'),
  asyncHandler(supportController.getTicketByNumber.bind(supportController)),
);
router.get(
  '/tickets/:id',
  validate(uuidParamSchema, 'params'),
  asyncHandler(supportController.getTicket.bind(supportController)),
);
router.patch(
  '/tickets/:id/status',
  validate(uuidParamSchema, 'params'),
  validate(updateTicketStatusSchema),
  asyncHandler(supportController.updateTicketStatus.bind(supportController)),
);
router.get(
  '/tickets/:id/images/:imageId',
  validate(ticketImageParamsSchema, 'params'),
  asyncHandler(supportController.getTicketImage.bind(supportController)),
);

export default router;
