const express = require("express");
const http = require("http");
const app = express();
const cors = require("cors");
const { Server } = require("socket.io");
require("dotenv").config();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

const {
  getRecentItems,
  getCategory,
} = require("./src/controller/ItemController");

app.use(express.json());

app.listen(process.env.PORT);

const itemRouter = require("./src/routes/items");
const likeRouter = require("./src/routes/likes");
const commentRouter = require("./src/routes/comments");
const authRouter = require("./src/routes/auth");
const MyPageRouter = require("./src/routes/myPage");
const StoreRouter = require("./src/routes/store");
const ChatRouter = require("./src/routes/chats");

app.use("/items", itemRouter);
app.use("/users/likes", likeRouter);
app.use("/comments", commentRouter);
app.use("/auth", authRouter);
app.use("/users", MyPageRouter);
app.use("/store", StoreRouter);
app.use("/category", getCategory);
app.use("/chats", ChatRouter);

app.get("/", getRecentItems);
app.get("/favicon.ico", (req, res) => res.sendStatus(204));

const chatSocket = require("./src/modules/chatSocket");

io.on("connection", (socket) => {
  console.log("소켓 연결 완료 :", socket.id);
  chatSocket(socket, io);
});
