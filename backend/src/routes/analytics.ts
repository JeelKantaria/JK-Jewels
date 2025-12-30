import express, { Request, Response, RequestHandler } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = express.Router();

// Middleware to ensure user is admin
router.use(authenticate as unknown as RequestHandler, requireAdmin as RequestHandler);

// GET /api/admin/analytics/overview
// Returns monthly data for the last 6 months
router.get('/overview', asyncHandler(async (req: Request, res: Response) => {
    // changing logic to handle date manipulation in a way that minimizes timezone issues
    // Just taking the last 6 months based on current date
    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - 5);
    sixMonthsAgo.setDate(1); // Start of the month
    sixMonthsAgo.setHours(0, 0, 0, 0);

    // Using raw query for efficient date grouping (PostgreSQL specific)
    const monthlyStats = await prisma.$queryRaw<Array<{
        month: Date;
        orderCount: bigint;
        revenue: number | null;
    }>>`
        SELECT 
            DATE_TRUNC('month', "createdAt") as month,
            COUNT(id) as "orderCount",
            SUM("totalAmount") as revenue
        FROM "orders"
        WHERE "created_at" >= ${sixMonthsAgo}
        AND "payment_status" = 'COMPLETED'
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY month ASC
    `;
    // WAIT! Table names in Prisma raw query must match DB table names.
    // The schema says @@map("orders"). So table is "orders".
    // Columns are mapped too: createdAt -> created_at, totalAmount -> total_amount, paymentStatus -> payment_status
    // I need to use correct DB column names in raw query.
    // Let me re-write the raw query carefully.

    const monthlyStatsCorrected = await prisma.$queryRaw<Array<{
        month: Date;
        orderCount: bigint;
        revenue: number | null;
    }>>`
        SELECT 
            DATE_TRUNC('month', created_at) as month,
            COUNT(id) as "orderCount",
            SUM(total_amount) as revenue
        FROM orders
        WHERE created_at >= ${sixMonthsAgo}
        AND payment_status = 'COMPLETED'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month ASC
    `;

    // Also get order status breakdown
    const statusBreakdown = await prisma.order.groupBy({
        by: ['status'],
        _count: {
            id: true
        }
    });

    // Format the data for the frontend
    const formattedMonthlyData = [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    for (let i = 0; i < 6; i++) {
        const d = new Date(sixMonthsAgo);
        d.setMonth(d.getMonth() + i);
        const monthKey = d.toISOString().slice(0, 7); // YYYY-MM

        // Find matching data
        const stat = monthlyStatsCorrected.find((s: any) => {
            const statDate = new Date(s.month);
            return statDate.toISOString().slice(0, 7) === monthKey;
        });

        formattedMonthlyData.push({
            month: monthNames[d.getMonth()],
            fullDate: monthKey,
            orders: stat ? Number(stat.orderCount) : 0,
            revenue: stat ? Number(stat.revenue || 0) : 0
        });
    }

    res.json({
        success: true,
        data: {
            monthlyData: formattedMonthlyData,
            statusBreakdown: statusBreakdown.map(s => ({
                status: s.status,
                count: s._count.id
            }))
        }
    });
}));

// GET /api/admin/analytics/comparison
// Returns percentage changes vs previous period and current period totals
router.get('/comparison', asyncHandler(async (req: Request, res: Response) => {
    const { period = 'month', from, to } = req.query;
    const now = new Date();

    let currentStart = new Date();
    let currentEnd: Date | undefined;
    let prevStart = new Date();
    let prevEnd = new Date();

    // If custom date range is provided
    if (from && to) {
        currentStart = new Date(from as string);
        currentStart.setHours(0, 0, 0, 0);

        currentEnd = new Date(to as string);
        currentEnd.setHours(23, 59, 59, 999);

        // Calculate duration for previous period comparison
        const duration = currentEnd.getTime() - currentStart.getTime();
        prevEnd = new Date(currentStart.getTime() - 1);
        prevStart = new Date(prevEnd.getTime() - duration);
        prevStart.setHours(0, 0, 0, 0);
    }

    // Calculate date ranges based on period (only if no custom range)
    if (!from || !to) {
        switch (period) {
            case 'day':
                currentStart.setHours(0, 0, 0, 0);
                prevStart = new Date(currentStart);
                prevStart.setDate(prevStart.getDate() - 1);
                prevEnd = new Date(currentStart);
                prevEnd.setMilliseconds(-1);
                break;
            case 'week':
                // Start of current week (assuming Monday start)
                const day = currentStart.getDay();
                const diff = currentStart.getDate() - day + (day === 0 ? -6 : 1);
                currentStart.setDate(diff);
                currentStart.setHours(0, 0, 0, 0);

                prevStart = new Date(currentStart);
                prevStart.setDate(prevStart.getDate() - 7);
                prevEnd = new Date(currentStart);
                prevEnd.setMilliseconds(-1);
                break;
            case 'quarter':
                const currentQuarter = Math.floor(now.getMonth() / 3);
                currentStart = new Date(now.getFullYear(), currentQuarter * 3, 1);

                prevStart = new Date(currentStart);
                prevStart.setMonth(prevStart.getMonth() - 3);
                prevEnd = new Date(currentStart);
                prevEnd.setMilliseconds(-1);
                break;
            case 'year':
                currentStart = new Date(now.getFullYear(), 0, 1);

                prevStart = new Date(now.getFullYear() - 1, 0, 1);
                prevEnd = new Date(currentStart);
                prevEnd.setMilliseconds(-1);
                break;
            case 'month':
            default:
                currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
                prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                prevEnd = new Date(currentStart);
                prevEnd.setMilliseconds(-1);
                break;
        }
    } // end if (!from || !to)

    // Current period stats
    const currentStats = await prisma.order.aggregate({
        where: {
            createdAt: currentEnd
                ? { gte: currentStart, lte: currentEnd }
                : { gte: currentStart }
        },
        _sum: { totalAmount: true },
        _count: { id: true }
    });

    // Previous period stats
    const prevStats = await prisma.order.aggregate({
        where: {
            createdAt: {
                gte: prevStart,
                lte: prevEnd
            }
        },
        _sum: { totalAmount: true },
        _count: { id: true }
    });

    // Customer growth
    const currentCustomers = await prisma.user.count({
        where: {
            role: 'CUSTOMER',
            createdAt: currentEnd
                ? { gte: currentStart, lte: currentEnd }
                : { gte: currentStart }
        }
    });

    const prevCustomers = await prisma.user.count({
        where: {
            role: 'CUSTOMER',
            createdAt: {
                gte: prevStart,
                lte: prevEnd
            }
        }
    });

    const calculateGrowth = (current: number, prev: number) => {
        if (prev === 0) return current > 0 ? 100 : 0;
        return Number(((current - prev) / prev * 100).toFixed(1));
    };

    res.json({
        success: true,
        data: {
            totals: {
                revenue: Number(currentStats._sum.totalAmount || 0),
                orders: currentStats._count.id,
                customers: currentCustomers
            },
            growth: {
                revenue: calculateGrowth(
                    Number(currentStats._sum.totalAmount || 0),
                    Number(prevStats._sum.totalAmount || 0)
                ),
                orders: calculateGrowth(
                    currentStats._count.id,
                    prevStats._count.id
                ),
                customers: calculateGrowth(
                    currentCustomers,
                    prevCustomers
                )
            }
        }
    });
}));

// GET /api/admin/analytics/top-products
router.get('/top-products', asyncHandler(async (req: Request, res: Response) => {
    const topProducts = await prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: {
            quantity: true,
            totalPrice: true // Changed from price to totalPrice
        },
        orderBy: {
            _sum: {
                totalPrice: 'desc' // Changed from price to totalPrice
            }
        },
        take: 5
    });

    // Fetch product details
    const productDetails = await Promise.all(
        topProducts.map(async (item) => {
            const product = await prisma.product.findUnique({
                where: { id: item.productId },
                select: { name: true, images: true }
            });
            return {
                id: item.productId,
                name: product?.name || 'Unknown Product',
                image: product?.images[0]?.url || null,
                sold: item._sum.quantity || 0,
                revenue: Number(item._sum.totalPrice || 0)
            };
        })
    );

    res.json({
        success: true,
        data: productDetails
    });
}));

export default router;
