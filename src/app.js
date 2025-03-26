import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from 'express-rate-limit'

const app = express();

app.use(
  cors({
    origin: [process.env.CORS_ORIGIN, process.env.CORS_ORIGIN2],
    credentials: true,
    methods: ["GET", "PUT", "POST", "DELETE"],
  })
);



app.use(rateLimit({
  windowMs: 1 * 60 * 1000, 
  max: 20, 
  message: "Too many requests from this IP, please try again after 1 minutes",
  standardHeaders: true, 
  legacyHeaders: false, 
}))



app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.redirect(process.env.CORS_ORIGIN2);
});
import userRouter from "./routes/user.routes.js";
import blogRouter from "./routes/blog.routes.js";
import adminRouter from "./routes/admin.routes.js"
import { verifyadmin } from "./middlewares/admin.middleware.js";
app.use("/api/v1/users", userRouter);
app.use("/api/v1/blog", blogRouter);
app.use("/api/v1/admin",verifyadmin,adminRouter);
export { app };
