const Redis = require("ioredis");

const redisUri = process.env.REDIS_URL || "redis://127.0.0.1:6379";

const redisOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

if (redisUri.startsWith("rediss://")) {
  redisOptions.tls = {
    rejectUnauthorized: false,
  };
}

const redisClient = new Redis(redisUri, redisOptions);

redisClient.on("error", (err) => {
  console.error("Redis connection error:", err);
});

module.exports = redisClient;