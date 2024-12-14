import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: "https://" + process.env.UPSTASH_REDIS_REST_URL, // Ensure this is a valid URL
  token: process.env.UPSTASH_REDIS_REST_TOKEN, // Ensure the token is correct
});

export const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, "10 s"),
  analytics: true,
  timeout: 10000,
});
