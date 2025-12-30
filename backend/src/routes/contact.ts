import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { AppError, ErrorCodes } from '../middleware/error.js';
import { z } from 'zod';

const router = Router();

// Contact form validation schema
const contactSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email'),
    phone: z.string().optional(),
    subject: z.string().min(3, 'Subject must be at least 3 characters'),
    message: z.string().min(10, 'Message must be at least 10 characters'),
});

// POST /api/contact - Submit contact form
router.post('/', asyncHandler(async (req: Request, res: Response) => {
    const validation = contactSchema.safeParse(req.body);

    if (!validation.success) {
        throw new AppError(
            validation.error.errors[0].message,
            400,
            ErrorCodes.VALIDATION_ERROR
        );
    }

    const { name, email, phone, subject, message } = validation.data;

    const contactMessage = await prisma.contactMessage.create({
        data: {
            name,
            email,
            phone,
            subject,
            message,
        },
    });

    res.status(201).json({
        success: true,
        message: 'Your message has been received. We will get back to you soon.',
        data: {
            id: contactMessage.id,
        },
    });
}));

// GET /api/contact - Get all contact messages (Admin only - to be protected later)
router.get('/', asyncHandler(async (req: Request, res: Response) => {
    const { page = '1', limit = '20', unreadOnly = 'false' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where = unreadOnly === 'true' ? { isRead: false } : {};

    const [messages, total] = await Promise.all([
        prisma.contactMessage.findMany({
            where,
            skip,
            take: limitNum,
            orderBy: { createdAt: 'desc' },
        }),
        prisma.contactMessage.count({ where }),
    ]);

    res.json({
        success: true,
        data: {
            messages,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        },
    });
}));

// PUT /api/contact/:id/read - Mark message as read
router.put('/:id/read', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const message = await prisma.contactMessage.update({
        where: { id },
        data: { isRead: true },
    });

    res.json({
        success: true,
        data: message,
    });
}));

// DELETE /api/contact/:id - Delete a message
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    await prisma.contactMessage.delete({
        where: { id },
    });

    res.json({
        success: true,
        message: 'Message deleted successfully',
    });
}));

export default router;
