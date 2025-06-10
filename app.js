const express = require("express");
const http = require("http");
const app = express();
const cors = require("cors");
const { Server } = require("socket.io");
require("dotenv").config();
const { AppDataSource } = require("./dist/src/data-source");

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5174",
    credentials: true,
  },
});

app.use(
  cors({
    origin: "http://localhost:5174",
    credentials: true,
  })
);

const { getRecentItems } = require("./src/controller/ItemController");

app.use(express.json());

server.listen(process.env.PORT);

const itemRouter = require("./src/routes/items");
const likeRouter = require("./src/routes/likes");
const commentRouter = require("./src/routes/comments");
const authRouter = require("./src/routes/auth");
const MyPageRouter = require("./src/routes/myPage");
const StoreRouter = require("./src/routes/store");
const ChatRouter = require("./src/routes/chats");
const CategoryRouter = require("./src/routes/category");
const LocationRouter = require("./src/routes/location");

app.use("/items", itemRouter);
app.use("/users/likes", likeRouter);
app.use("/comments", commentRouter);
app.use("/auth", authRouter);
app.use("/users", MyPageRouter);
app.use("/store", StoreRouter);
app.use("/categories", CategoryRouter);
app.use("/chats", ChatRouter);
app.use("/location", LocationRouter);

app.get("/", getRecentItems);
app.get("/favicon.ico", (req, res) => res.sendStatus(204));

const chatSocket = require("./src/modules/chatSocket");

AppDataSource.initialize()
  .then(() => {
    // 소켓 연결
    io.on("connection", (socket) => {
      try {
        chatSocket(socket, io);
      } catch (error) {
        console.error("[Socket] 채팅 소켓 처리 중 오류 발생:", error);
        socket.emit("error", "채팅 처리 중 오류가 발생했습니다.");
      }
    });

    io.on("error", (error) => {
      console.error("[Socket] Socket.IO 에러:", error);
    });
  })
  .catch((error) => {
    console.error("TypeORM 연결 실패:", error);
  });
