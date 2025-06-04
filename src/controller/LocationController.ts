import { Request, Response } from "express";
import { Item } from "../types/ItemType";
import { FieldPacket, OkPacket, OkPacketParams, ResultSetHeader } from "mysql2";
import { StatusCodes } from "http-status-codes";
import { Location } from "../types/LocationType";
import { TokenPayload } from "../types/TokenType";
import { User } from "../types/UserType";
const ensureAuthorization = require("../modules/auth/ensureAuthorization");
const jwtErrorHandler = require("../modules/auth/jwtErrorHandler");
const mariadb = require("mysql2/promise");

export const getLocation = async (req: Request, res: Response) => {
  const conn = await mariadb.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    dateStrings: true,
  });

  const itemId: number = parseInt(req.params.id);
  if (!itemId) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "요청한 ID가 없습니다." });
  }

  let sql = "SELECT id FROM items WHERE id = ?";

  try {
    const [foundItem, foundItemFields]: [Item[], FieldPacket[]] = conn.query(
      sql,
      itemId
    );

    if (!foundItem?.length) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "해당 ID의 아이템을 찾을 수 없습니다." });
    }

    sql = "SELECT * FROM location WHERE item_id = ?";

    const [result, resultFields]: [Location[], FieldPacket] = conn.query(
      sql,
      itemId
    );

    if (!result?.length) {
      res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "location 정보를 불러올 수 없습니다." });
    }

    return res.status(StatusCodes.OK).json(result);
  } catch (err) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "location 데이터를 가져오는 동안 오류가 발생했습니다.",
    });
  } finally {
    if (conn) await conn.end();
  }
};

export const addLocation = async (req: Request, res: Response) => {
  const conn = await mariadb.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    dateStrings: true,
  });

  const authorization: TokenPayload | Error = ensureAuthorization(req, res);

  if (authorization instanceof ReferenceError) {
    return res.status(StatusCodes.BAD_REQUEST).send("로그인이 필요합니다.");
  }
  if (authorization instanceof Error) {
    return jwtErrorHandler(authorization, res);
  }

  const userId: number = authorization.user_id;
  let sql = "SELECT id FROM users WHERE id = ?";

  try{
    const [foundUser, foundUserFields]: [User[], FieldPacket[]] = await conn.query(sql, userId);

    if (!foundUser?.length) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "해당 ID의 사용자를 찾을 수 없습니다." });
    }

    const { item_id, title, coordinate, address } : Location = req.body;
    const values = [ userId, item_id, title, coordinate, address ];
    sql = "INSERT INTO location (user_id, item_id, title, coordinate, address) VALUES(?, ?, ?, ?, ?)";

    const [result, resultFields]: [ResultSetHeader, FieldPacket[]] = await conn.query(sql, values);

    if (result.affectedRows == 0){
      throw new Error("데이터 삽입 실패: affectedRows가 0입니다.");
    }

    return res.status(StatusCodes.OK).json(result);

  } catch (err) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "location 데이터를 저장하는 동안 오류가 발생했습니다.",
    });
  } finally {
    if (conn) await conn.end();
  }
}

export const updateLocation = async (req: Request, res: Response) => {

}