import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";
import redisClient from "./db/redis.js";
dotenv.config({
  path: "./.env",
});
connectDB()
.then(() => {
  console.log("✅ MongoDB connected successfully!");

  return redisClient.connect();   // Chain Redis connection
})
  .then(() => {
    console.log("✅ Redis connected successfully!");
    app.listen(process.env.PORT || 8000, () => {
      console.log(`⚙️ Server is running at port : ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
  });
