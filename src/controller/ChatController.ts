import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { AppDataSource } from "../data-source";
import jwt from "jsonwebtoken";
import { ChatRoom } from "../entity/ChatRoom";
const ensureAuthorization = require("../modules/auth/ensureAuthorization");
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);

// 채팅방 생성
export const createChatRoom = async (req: Request, res: Response) => {
  const authorization = ensureAuthorization(req, res);

  if (authorization instanceof jwt.TokenExpiredError) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      message: "로그인 세션이 만료되었습니다. 다시 로그인하세요.",
    });
  } else if (authorization instanceof jwt.JsonWebTokenError) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "잘못된 토큰입니다.",
    });
  } else {
    const current_id = Number(authorization.user_id);
    const opponent_id = Number(req.body.opponent_id);
    const { item_id } = req.body;

    if (current_id === opponent_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "자기 자신과는 채팅할 수 없습니다.",
      });
    }

    try {
      const chatRoomRepo = AppDataSource.getRepository(ChatRoom);

      let room = await chatRoomRepo.findOne({
        where: [
          { user1_id: current_id, user2_id: opponent_id, item_id },
          { user1_id: opponent_id, user2_id: current_id, item_id },
        ],
      });

      if (!room) {
        room = chatRoomRepo.create({
          user1_id: current_id,
          user2_id: opponent_id,
          item_id,
        });
        await chatRoomRepo.save(room);
      }

      return res.status(StatusCodes.CREATED).json(room);
    } catch (err) {
      console.error(err);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: "채팅방 생성 실패",
      });
    }
  }
};

// 채팅방 목록 조회
export const getChatRooms = async (req: Request, res: Response) => {
  const authorization = ensureAuthorization(req, res);

  if (authorization instanceof jwt.TokenExpiredError) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      message: "로그인 세션이 만료되었습니다. 다시 로그인하세요.",
    });
  } else if (authorization instanceof jwt.JsonWebTokenError) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "잘못된 토큰입니다.",
    });
  } else {
    const userId = authorization.user_id;

    try {
      const rooms = await AppDataSource.query(
        `
          SELECT 
            r.id AS room_id,
            r.user1_id,
            r.user2_id,
            r.item_id,
            r.last_message,
            r.updated_at,
            u.id AS user_id,
            u.nickname,
            u.img_id,
            (
              SELECT COUNT(*) 
              FROM chats c 
              WHERE 
                c.room_id = r.id 
                AND c.receiver_id = ? 
                AND c.is_read = false
            ) AS unread_count
          FROM chat_rooms r
          JOIN users u 
            ON (
              (r.user1_id = ? AND u.id = r.user2_id)
              OR
              (r.user2_id = ? AND u.id = r.user1_id)
            )
          WHERE r.user1_id = ? OR r.user2_id = ?
          ORDER BY r.updated_at DESC
      `,
        [userId, userId, userId, userId, userId]
      );

      const convertedRooms = rooms.map((room: any) => ({
        ...room,
        updated_at: dayjs(room.updated_at)
          .tz("Asia/Seoul")
          .format("YYYY-MM-DD HH:mm:ss"),
      }));

      return res.status(StatusCodes.OK).json(convertedRooms);
    } catch (err) {
      console.error(err);
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: "채팅방 목록 조회 실패" });
    }
  }
};

// 채팅 조회
export const getChats = async (req: Request, res: Response) => {
  const { room_id } = req.params;
  const authorization = ensureAuthorization(req, res);

  if (authorization instanceof jwt.TokenExpiredError) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      message: "로그인 세션이 만료되었습니다. 다시 로그인하세요.",
    });
  } else if (authorization instanceof jwt.JsonWebTokenError) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "잘못된 토큰입니다.",
    });
  } else {
    try {
      const userId = authorization.user_id;

      const chats = await AppDataSource.query(
        `
          SELECT 
            c.id,
            c.room_id,
            c.sender_id,
            c.receiver_id,
            c.contents,
            c.created_at,
            c.is_read,
            u.id AS opponent_id,
            u.nickname AS opponent_nickname,
            u.img_id AS opponent_img,
            i.id AS item_id,
            i.title AS item_title,
            i.price AS item_price,
            i.img_id AS item_img
          FROM chats c
          JOIN chat_rooms r ON c.room_id = r.id
          JOIN items i ON r.item_id = i.id
          JOIN users u 
            ON (
              (c.sender_id = u.id AND c.receiver_id = ?) OR
              (c.receiver_id = u.id AND c.sender_id = ?)
            )
          WHERE c.room_id = ?
          ORDER BY c.created_at ASC
        `,
        [userId, userId, parseInt(room_id, 10)]
      );

      const convertedChats = chats.map((chat: any) => ({
        ...chat,
        created_at: dayjs(chat.created_at)
          .tz("Asia/Seoul")
          .format("YYYY-MM-DD HH:mm:ss"),
      }));

      return res.status(StatusCodes.OK).json(convertedChats);
    } catch (err) {
      console.error(err);
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: "채팅 조회 실패" });
    }
  }
};
