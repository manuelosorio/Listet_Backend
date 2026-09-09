import { createClient } from 'redis';
import { REDIS } from '#environments/variables';

export const redisClient = createClient({
  url: REDIS.url,
});

redisClient.on('error', err => {
  console.error('Redis Client Error', err);
});

export const connectRedis = async (): Promise<void> => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
};
