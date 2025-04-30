const express = require("express");
const app = express();
const cors = require("cors");

app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

const dotenv = require("dotenv");
const connection = require("./src/mariadb");
const { getRecentItems } = require("./src/controller/ItemContoller");
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

app.get("/", getRecentItems);
