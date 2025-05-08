const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config()

const allowedOrigins = [
  "http://localhost:5173",
  process.env.NGROK,
  "http://localhost:3000",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true );
      if (allowedOrigins.includes(origin)) {
        return callback(null, origin);
      }
      return callback(new Error("Not allowed by CORS: " + origin));
    },
    credentials: true,
  })
);

const dotenv = require("dotenv");
const {
  getRecentItems,
  getCategory,
} = require("./src/controller/ItemController");
dotenv.config();

app.use(express.json());

app.listen(process.env.PORT);

const itemRouter = require("./src/routes/items");
const likeRouter = require("./src/routes/likes");
const commentRouter = require("./src/routes/comments");
const authRouter = require("./src/routes/auth");
const MyPageRouter = require("./src/routes/myPage");
const StoreRouter = require("./src/routes/store");

app.use("/items", itemRouter);
app.use("/users/likes", likeRouter);
app.use("/comments", commentRouter);
app.use("/auth", authRouter);
app.use("/users", MyPageRouter);
app.use("/store", StoreRouter);
app.use("/category", getCategory);

app.get("/", getRecentItems);
app.get("/favicon.ico", (req, res) => res.sendStatus(204));
