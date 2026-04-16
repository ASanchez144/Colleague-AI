/**
 * Logger centralizado con Winston
 */

import winston from 'winston';
import path from 'path';

const logDir = path.resolve(import.meta.dirname, '../../logs');

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'tu-socia' },
  transports: [
    // Console con colores
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length > 1
            ? ` ${JSON.stringify(meta, null, 0)}`
            : '';
          return `${timestamp} [${level}] ${message}${metaStr}`;
        })
      )
    }),
    // Archivo para todos los logs
    new winston.transports.File({
      filename: path.join(logDir, 'pipeline.log'),
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 5
    }),
    // Archivo solo para errores
    new winston.transports.File({
      filename: path.join(logDir, 'errors.log'),
      level: 'error',
      maxsize: 5 * 1024 * 1024,
      maxFiles: 3
    })
  ]
});
