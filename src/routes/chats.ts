const express = require("express");
const router = express.Router();

import { getChatRooms, getChats, sendChat } from "../controller/ChatController";

router.use(express.json());

router.get("/", getChatRooms);
router.get("/:room_id", getChats);
router.post("/:room_id", sendChat);
