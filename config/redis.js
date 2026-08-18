const Redis = require("ioredis");

// const redisUri ="redis://127.0.0.1:6379";
const redisUri = process.env.REDIS_URL;

const redisClient = new Redis(redisUri, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

redisClient.on("error", (err) => {
  console.error("Redis connection error:", err);
});

module.exports = redisClient;