import redis from "redis";


const redisClient = redis.createClient({
  url: process.env.REDIS_URL,
  password:process.env.REDIS_PASS
});


redisClient.on("connect", () => {
  console.log("🔌 Redis client connected...");
});

redisClient.on("error", (err) => {
  console.error("❌ Redis error: ", err);
});

export default redisClient;