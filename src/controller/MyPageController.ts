import { Request, Response } from "express";
import { FieldPacket } from "mysql2";
import { User } from "../types/UserType";
import { TokenPayload } from "../types/TokenType";
const connection = require("../mariadb");
const mariadb = require("mysql2/promise");
const { StatusCodes } = require("http-status-codes");
const dotenv = require("dotenv");
const crypto = require("crypto");
const ensureAuthorization = require("../modules/auth/ensureAuthorization");
const jwtErrorHandler = require("../modules/auth/jwtErrorHandler");

dotenv.config({ path: __dirname + "/../.env" });

type UserKey = keyof User;

export const getMyPage = (req: Request, res: Response) => {
  const authorization = ensureAuthorization(req, res);

  if (authorization instanceof ReferenceError) {
    return res.status(StatusCodes.BAD_REQUEST).send("로그인이 필요합니다.");
  } else if (authorization instanceof Error) {
    return jwtErrorHandler(authorization, res);
  }

  const sql =
    "SELECT id, img_id, nickname, name, created_at, info, email, contact from users WHERE id = ?";
  const userId: number = authorization.user_id;

  connection.query(sql, userId, (err: Error, results: User[]) => {
    if (err) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: '사용자 데이터를 가져오는 동안 오류가 발생했습니다.' });
    }

    if(!results.length) {
      return res
      .status(StatusCodes.NOT_FOUND)
      .send("해당 ID의 사용자를 찾을 수 없습니다.");
    }

    return res.status(StatusCodes.OK).json(results[0]);
  });
};

export const updateMyPage = async (req: Request, res: Response) => {
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

  const newUserDatas = req.body;

  if (!newUserDatas) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .send("입력된 데이터가 없습니다.");
  }

  let sql = "SELECT * FROM users WHERE id = ? ";
  const userId: number = authorization.user_id;

  const [foundUser, foundUserFields]: [User[], FieldPacket[]] =
    await conn.query(sql, userId);

  if (!foundUser?.length) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .send("해당 ID의 사용자를 찾을 수 없습니다.");
  }

  sql =
    "UPDATE users SET nickname = ?, name = ?, email = ?, info = ?, contact = ?, password = ?, salt = ? WHERE id = ?";
  const values = [
    getNewValueOrDefault(newUserDatas.nickname, foundUser[0].nickname),
    getNewValueOrDefault(newUserDatas.name, foundUser[0].name),
    getNewValueOrDefault(newUserDatas.email, foundUser[0].email),
    getNewValueOrDefault(newUserDatas.info, foundUser[0].info),
    getNewValueOrDefault(newUserDatas.contact, foundUser[0].contact)
  ];

  let salt, newPassword;
  if (newUserDatas.password && newUserDatas.password.trim()) {
    salt = crypto.randomBytes(64).toString("base64");
    newPassword = crypto
      .pbkdf2Sync(newUserDatas.password, salt, 10000, 64, "sha512")
      .toString("base64");
  } else {
    salt = foundUser[0].salt;
    newPassword = foundUser[0].password;
  }

  values.push(newPassword, salt, userId);

  try {
    const [results, resultFields] = await conn.query(sql, values);

    if (results.affectedRows == 0) {
      throw new Error("회원 수정 실패");
    }

    return res.status(StatusCodes.OK).json(results);
  } catch (err) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(err);
  } finally {
    if (conn) await conn.end();
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  const conn = await mariadb.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    dateStrings: true,
  });

  const authorization = ensureAuthorization(req, res);

  if (authorization instanceof ReferenceError) {
    return res.status(StatusCodes.BAD_REQUEST).send("로그인이 필요합니다.");
  }
  if (authorization instanceof Error) {
    return jwtErrorHandler(authorization, res);
  }

  let sql = "SELECT * FROM users WHERE id = ? ";
  const userId = authorization.user_id;

  const [foundUser, fields] = await conn.query(sql, userId);

  if (!foundUser?.length) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .send("해당 ID의 사용자를 찾을 수 없습니다.");
  }

  try {
    sql = "DELETE FROM users WHERE id = ?";
    const [deleteItems, itemfields] = await conn.query(sql, userId);

    if (deleteItems.affectedRows == 0) {
      throw new Error("회원 탈퇴 실패");
    }

    return res.status(StatusCodes.OK).send("회원 탈퇴가 완료되었습니다.");
  } catch (err) {
    console.error(err);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send("회원 탈퇴에 실패하였습니다. ");
  } finally {
    if (conn) await conn.end();
  }
};

const getNewValueOrDefault = (
  newValue: string | number,
  defaultValue: string | number
) => {
  return newValue !== undefined && newValue !== null && newValue !== ""
    ? newValue
    : defaultValue;
};
