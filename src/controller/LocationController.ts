import { Request, Response } from "express";
import { FieldPacket, ResultSetHeader } from "mysql2";
import { StatusCodes } from "http-status-codes";
import { Location } from "../types/LocationType";
import { TokenPayload } from "../types/TokenType";
import { User } from "../types/UserType";
import { getNewValueOrDefault } from "./MyPageController";
const ensureAuthorization = require("../modules/auth/ensureAuthorization");
const jwtErrorHandler = require("../modules/auth/jwtErrorHandler");
const mariadb = require("mysql2/promise");

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

  try {
    const [foundUser, foundUserFields]: [User[], FieldPacket[]] =
      await conn.query(sql, userId);

    if (!foundUser?.length) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "해당 ID의 사용자를 찾을 수 없습니다." });
    }

    const newLocationDatas: Location = req.body;
    const values = [
      userId,
      newLocationDatas.title,
      newLocationDatas.coordinate_x,
      newLocationDatas.coordinate_y,
      newLocationDatas.address,
    ]; 

    sql =
      "INSERT INTO location (user_id, title, coordinate_x, coordinate_y, address) VALUES(?, ?, ?, ?, ?)";

    const [result, resultFields]: [ResultSetHeader, FieldPacket[]] =
      await conn.query(sql, values);

    if (result.affectedRows == 0) {
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
};

export const updateLocation = async (req: Request, res: Response) => {
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
  let sql = "SELECT * FROM location WHERE user_id = ?";

  try {
    const [foundUserLocation, foundUserFields]: [Location[], FieldPacket[]] =
      await conn.query(sql, userId);

    if (!foundUserLocation?.length) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "해당 ID의 사용자를 찾을 수 없습니다." });
    }

    const newLocationDatas: Location = req.body;
    const locationId: number = req.body.location_id;

    const values = [
      getNewValueOrDefault(newLocationDatas.title, foundUserLocation[0].title),
      getNewValueOrDefault(
        newLocationDatas.coordinate_x,
        foundUserLocation[0].coordinate_x
      ),
      getNewValueOrDefault(
        newLocationDatas.coordinate_y,
        foundUserLocation[0].coordinate_y
      ),
      getNewValueOrDefault(
        newLocationDatas.address,
        foundUserLocation[0].address
      ),
      locationId
    ];

    sql =
      "UPDATE location SET title = ?, coordinate_x = ?, coordinate_y = ?, address = ? WHERE id = ?";

    const [result, resultFields]: [ResultSetHeader, FieldPacket] =
      await conn.query(sql, values);

    if (result.affectedRows == 0) {
      throw new Error("데이터 삽입 실패: affectedRows가 0입니다.");
    }

    return res.status(StatusCodes.CREATED).json(result);
  } catch (err) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "location 데이터를 업데이트 하는 동안 오류가 발생했습니다."
    });
  } finally {
    if (conn) await conn.end();
  }
};
