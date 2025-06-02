const connection = require("../mariadb");
const mariadb = require("mysql2/promise");
const { StatusCodes } = require("http-status-codes");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const crypto = require("crypto");
const ensureAuthorization = require("../modules/auth/ensureAuthorization");
const jwtErrorhandler = require("../modules/auth/jwtErrorhandler");
const { error } = require("console");

dotenv.config({ path: __dirname + "/../.env" });

const getMyPage = (req, res) => {
  const authorization = ensureAuthorization(req, res);

  if (authorization instanceof ReferenceError) {
    return res.status(StatusCodes.BAD_REQUEST).send("로그인이 필요합니다.");
  } else if (authorization instanceof Error) {
    return jwtErrorhandler(authorization, res);
  }

  const sql =
    "SELECT id, img_id, nickname, name, created_at, info, email, contact from users WHERE id = ?";
  const userId = authorization.user_id;

  connection.query(sql, userId, (err, results) => {
    if (err) {
      return res.status(StatusCodes.BAD_REQUEST).json(err);
    }

    return res.status(StatusCodes.OK).json(results);
  });
};

const updateMyPage = async (req, res) => {
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
    return jwtErrorhandler(authorization, res);
  }

  const newUserDatas = req.body;

  if (!newUserDatas) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .send("입력된 데이터가 없습니다.");
  }

  let sql = "SELECT * FROM users WHERE id = ? ";
  const userId = authorization.user_id;

  const [foundUser, foundUserFields] = await conn.query(sql, userId);

  if (!foundUser?.length) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .send("해당 ID의 사용자를 찾을 수 없습니다.");
  }

  sql =
    "UPDATE users SET nickname = ?, name = ?, email = ?, info = ?, contact = ?, password = ?, salt = ? WHERE id = ?";
  const values = [];

  Object.keys(newUserDatas)
    .filter((key) => key !== "password" && key !== "salt")
    .forEach((key) => {
      values.push(getNewValueOrDefault(newUserDatas[key], foundUser[0][key]));
    });

  const salt = crypto.randomBytes(64).toString("base64");
  let newPassword = crypto
    .pbkdf2Sync(newUserDatas.password, salt, 10000, 64, "sha512")
    .toString("base64");

  values.push(newPassword, salt, userId);

  try {
    const [results, resultFields] = await conn.query(sql, values);

    if (results.affectedRows == 0) {
      throw new Error("회원 수정 실패");
    }

    return res.status(StatusCodes.OK).json(results);
  } catch (err) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(err);
  }
};

const deleteUser = async (req, res) => {
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
    return jwtErrorhandler(authorization, res);
  }

  let sql = "SELECT * FROM users WHERE id = ? ";
  const userId = authorization.user_id;
  const imgId = authorization.img_id;

  const [foundUser, fields] = await conn.query(sql, userId);

  if (!foundUser?.length) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .send("해당 ID의 사용자를 찾을 수 없습니다.");
  }

  try {
    sql = "DELETE FROM users WHERE id = ?";
    const [deleteItems, itemfields] = await conn.query(sql, userId);

    if (imgId !== 1) {
      // 만약 해당 User의 프로필 이미지가 공용 이미지의 id일 경우 -> 추후 로직 개선
      try {
        sql = "DELETE FROM images WHERE image_id = ?";
        await conn.query(sql, imgId);
      } catch (err) {
        console.error("이미지 삭제 실패:", err);
      }
    }

    if (deleteItems.affectedRows == 0) {
      throw new Error("회원 탈퇴 실패");
    }

    return res.status(StatusCodes.OK).send("회원 탈퇴가 완료되었습니다.");
  } catch (err) {
    console.error(err);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send("회원 탈퇴에 실패하였습니다. ");
  }
};

const getNewValueOrDefault = (newValue, defaultValue) => {
  return newValue !== undefined && newValue !== null && newValue !== ""
    ? newValue
    : defaultValue;
};

module.exports = { getMyPage, updateMyPage, deleteUser };
