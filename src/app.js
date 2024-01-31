import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: `${process.env.CORS_DOMAIN}`,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true, // Allow credentials (cookies, HTTP authentication, etc.)
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

//routes import
import userRouter from "./routes/user.routes.js";
import blogRouter from "./routes/blog.routes.js";

//routes declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/blog", blogRouter);

export { app };
