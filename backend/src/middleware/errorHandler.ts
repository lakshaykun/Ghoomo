/**
 * Error Handler Middleware
 */

import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: true,
      message: err.message,
      status: err.statusCode,
      timestamp: new Date().toISOString()
    });
  }

  // Default error
  res.status(500).json({
    error: true,
    message: err.message || 'Internal Server Error',
    status: 500,
    timestamp: new Date().toISOString()
  });
};

export default errorHandler;
