import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: [
      "https://oreo-34320.web.app/",
      "https://oreo-34320.web.app/login",
      "https://oreo-34320.web.app/logout",
      "localhost:3000",
    ],
    origin: "*",
    credentials: true,
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
