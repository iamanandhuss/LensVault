import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.code === 11000 ? 409 : err.name === 'ValidationError' || err.name === 'CastError' ? 400 : err.statusCode || err.status || 500;
  
  // Log the error internally
  console.error(`[Error] ${req.method} ${req.path} >> StatusCode: ${statusCode} >> Message: ${err.message}`);

  // Do not expose stack traces to the client in production
  res.status(statusCode).json({
    error: statusCode >= 500 && process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};
