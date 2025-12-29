import { Request, Response, NextFunction } from 'express';

/**
 * Async Handler Wrapper
 * 
 * Wraps async route handlers to automatically catch errors and pass them
 * to Express's error handling middleware. This eliminates the need for
 * try-catch blocks in every route handler.
 * 
 * @example
 * // Before:
 * router.get('/', async (req, res) => {
 *     try {
 *         const data = await fetchData();
 *         res.json(data);
 *     } catch (error) {
 *         next(error);
 *     }
 * });
 * 
 * // After:
 * router.get('/', asyncHandler(async (req, res) => {
 *     const data = await fetchData();
 *     res.json(data);
 * }));
 */

// Generic async request handler type that accepts any Request type
type AsyncRequestHandler<T extends Request = Request> = (
    req: T,
    res: Response,
    next: NextFunction
) => Promise<void> | void;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const asyncHandler = <T extends Request = Request>(fn: AsyncRequestHandler<T>) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        Promise.resolve(fn(req as T, res, next)).catch(next);
    };
};

export default asyncHandler;
