const express = require("express");
const router = express.Router();

import {
  getChatRooms,
  getChats,
  createChatRoom,
} from "../controller/ChatController";

router.use(express.json());

router.post("/", createChatRoom);
router.get("/", getChatRooms);
router.get("/:room_id", getChats);

module.exports = router;
