import { Request, Response } from "express";
import { User } from "../types/UserType";
import { FieldPacket } from "mysql2";
import { Item } from "../types/ItemType";
const mariadb = require("mysql2/promise");
const { StatusCodes } = require("http-status-codes");
const env = require("dotenv");
env.config();

interface FoundUserResult {
  userData?: User[];
  itemData?: Item[];
}

export const getUserInfo = async (req: Request, res: Response) => {
  const conn = await mariadb.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    dateStrings: true,
  });

  const userId: number = parseInt(req.params.id);
  let result: FoundUserResult = {};

  let sql =
    "SELECT id, img_id, nickname, created_at, info, email, contact FROM users WHERE id = ?";

  try {
    const [foundUser, foundUserFields]: [User[], FieldPacket[]] =
      await conn.query(sql, userId);

    if (!foundUser?.length) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .send("해당 ID의 사용자를 찾을 수 없습니다.");
    }

    result.userData = foundUser;

    sql =
      "SELECT id, img_id, title, price, created_at FROM items WHERE user_id = ?";

    const [items]: [Item[]] = await conn.query(sql, userId);

    result.itemData = items;
    return res.status(StatusCodes.OK).json(result);
  } catch (err) {
    return res.status(StatusCodes.BAD_REQUEST).json(err);
  }
};
