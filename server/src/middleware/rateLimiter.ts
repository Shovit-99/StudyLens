import rateLimit from 'express-rate-limit';

// Authentication Limiter: 8 requests per 15 minutes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  message: { message: 'Too many authentication attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Upload Limiter: 20 requests per hour
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { message: 'Upload limit exceeded. Please try again after an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Search Limiter: 60 requests per minute
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { message: 'Too many searches. Please wait a minute before searching again.' },
  standardHeaders: true,
  legacyHeaders: false,
});
