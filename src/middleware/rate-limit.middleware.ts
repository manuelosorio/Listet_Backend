import type { Request, Response } from 'express';
import { rateLimit, ipKeyGenerator } from 'express-rate-limit';
import {
  AUTH_RATE_LIMIT,
  EMAIL_RATE_LIMIT,
  GLOBAL_RATE_LIMIT,
  GLOBAL_REGISTRATION_RATE_LIMIT,
  IP_RATE_LIMIT,
  MUTATION_RATE_LIMIT,
  PASSWORD_RESET_RATE_LIMIT,
  REGISTRATION_DAILY_RATE_LIMIT,
  REGISTRATION_RATE_LIMIT,
  VERIFICATION_RATE_LIMIT,
} from '#environments/variables';
import { tooManyRequests } from '#utilities/response';

import { RedisStore } from 'rate-limit-redis';
import { redisClient } from '#utilities/redis-client';

const createRedisStore = (prefix: string) =>
  new RedisStore({
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
    prefix,
  });

const rateLimitHandler = (_req: Request, res: Response) => tooManyRequests(res);

export const globalApiLimiter = rateLimit({
  windowMs: GLOBAL_RATE_LIMIT.windowMs,
  max: GLOBAL_RATE_LIMIT.max,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('ratelimit:global:'),
  handler: rateLimitHandler,
});

export const globalRegistrationApiLimiter = rateLimit({
  windowMs: GLOBAL_REGISTRATION_RATE_LIMIT.windowMs,
  max: GLOBAL_REGISTRATION_RATE_LIMIT.max,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: () => 'registration-global',
  store: createRedisStore('ratelimit:registration-global:'),
  handler: rateLimitHandler,
});

export const ipApiLimiter = rateLimit({
  windowMs: IP_RATE_LIMIT.windowMs,
  max: IP_RATE_LIMIT.max,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('ratelimit:ip:'),
  handler: rateLimitHandler,
});

export const emailApiLimiter = rateLimit({
  windowMs: EMAIL_RATE_LIMIT.windowMs,
  max: EMAIL_RATE_LIMIT.max,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: req => {
    const email = String(req.body?.email ?? '')
      .trim()
      .toLowerCase();
    return email || ipKeyGenerator(req.ip);
  },
  store: createRedisStore('ratelimit:email:'),
  handler: rateLimitHandler,
});

export const authApiLimiter = rateLimit({
  windowMs: AUTH_RATE_LIMIT.windowMs,
  max: AUTH_RATE_LIMIT.max,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  store: createRedisStore('ratelimit:auth:'),
  handler: rateLimitHandler,
});

export const registrationApiLimiter = rateLimit({
  windowMs: REGISTRATION_RATE_LIMIT.windowMs,
  max: REGISTRATION_RATE_LIMIT.max,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('ratelimit:registration:'),
  handler: rateLimitHandler,
});

export const registrationDailyApiLimiter = rateLimit({
  windowMs: REGISTRATION_DAILY_RATE_LIMIT.windowMs,
  max: REGISTRATION_DAILY_RATE_LIMIT.max,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('ratelimit:registration-daily:'),
  handler: rateLimitHandler,
});

export const passwordResetApiLimiter = rateLimit({
  windowMs: PASSWORD_RESET_RATE_LIMIT.windowMs,
  max: PASSWORD_RESET_RATE_LIMIT.max,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('ratelimit:password-reset:'),
  handler: rateLimitHandler,
});

export const verificationApiLimiter = rateLimit({
  windowMs: VERIFICATION_RATE_LIMIT.windowMs,
  max: VERIFICATION_RATE_LIMIT.max,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('ratelimit:verification:'),
  handler: rateLimitHandler,
});

export const mutationApiLimiter = rateLimit({
  windowMs: MUTATION_RATE_LIMIT.windowMs,
  max: MUTATION_RATE_LIMIT.max,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('ratelimit:mutation:'),
  handler: rateLimitHandler,
});
