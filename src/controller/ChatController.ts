import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { AppDataSource } from "../data-source";
import jwt from "jsonwebtoken";
import { ChatRoom } from "../entity/ChatRoom";
const ensureAuthorization = require("../modules/auth/ensureAuthorization");
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { Chat } from "../entity/Chat";
import { ChatRoomUser } from "../entity/ChatRoomUser";
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
    const currentId = Number(authorization.user_id);
    const opponentId = Number(req.body.opponent_id);
    const { item_id } = req.body;

    if (currentId === opponentId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "자기 자신과는 채팅할 수 없습니다.",
      });
    }

    try {
      const chatRoomRepo = AppDataSource.getRepository(ChatRoom);
      const chatRoomUserRepo = AppDataSource.getRepository(ChatRoomUser);

      const existingRoom = await chatRoomRepo
        .createQueryBuilder("chat_room")
        .innerJoin("chat_room.participants", "u1", "u1.user_id = :currentId", {
          currentId,
        })
        .innerJoin("chat_room.participants", "u2", "u2.user_id = :opponentId", {
          opponentId,
        })
        .where("chat_room.item_id = :item_id", { item_id })
        .getOne();

      if (existingRoom) {
        return res.status(StatusCodes.OK).json(existingRoom);
      }

      const newRoom = chatRoomRepo.create({ item_id });
      await chatRoomRepo.save(newRoom);

      const user1 = chatRoomUserRepo.create({
        room_id: newRoom.id,
        user_id: currentId,
      });
      const user2 = chatRoomUserRepo.create({
        room_id: newRoom.id,
        user_id: opponentId,
      });
      await chatRoomUserRepo.save([user1, user2]);

      return res.status(StatusCodes.CREATED).json(newRoom);
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
            r.item_id,
            r.last_message,
            r.updated_at,
            u.id AS user_id,
            u.nickname,
            u.img_id,
            ? AS me_id,
            (
              SELECT COUNT(*)
              FROM chats c
              WHERE c.room_id = r.id AND c.receiver_id = ? AND c.is_read = false
            ) AS unread_count
          FROM chat_rooms r
          JOIN chat_room_users cru ON cru.room_id = r.id
          JOIN users u ON u.id = cru.user_id
          WHERE r.id IN (
            SELECT cru2.room_id
            FROM chat_room_users cru2
            WHERE cru2.user_id = ?
          ) AND u.id != ?
          ORDER BY r.updated_at DESC
      `,
        [userId, userId, userId, userId]
      );

      const convertedRooms = rooms.map((room: ChatRoom) => ({
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

      const convertedChats = chats.map((chat: Chat) => ({
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
