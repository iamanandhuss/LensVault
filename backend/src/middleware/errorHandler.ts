import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  
  // Log the error internally
  console.error(`[Error] ${req.method} ${req.path} >> StatusCode: ${statusCode} >> Message: ${err.message}`);

  // Do not expose stack traces to the client in production
  res.status(statusCode).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};
