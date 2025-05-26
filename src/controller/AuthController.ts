import { Request, Response } from "express";
const { StatusCodes } = require("http-status-codes"); //status code 모듈
const conn = require("../mariadb"); //db 연결
const jwt = require("jsonwebtoken"); //jwt 모듈
const crypto_auth = require("crypto"); //node.js 내장 모듈 암호화 모듈
const dotenv = require("dotenv"); //dotenv 모듈
const ensureAuthorization = require("../modules/auth/ensureAuthorization");
dotenv.config();

interface SignUpBody {
  name: string;
  nickname: string;
  email: string;
  contact: string;
  password: string;
}

//salt 처라허가
export const signUp = (req: Request, res: Response) => {
  const { name, nickname, email, contact, password }: SignUpBody = req.body;
  let sql =
    "INSERT INTO users (name, nickname, email, contact, password, salt) VALUES (?,?,?,?,?,?)";

  const salt = crypto_auth.randomBytes(64).toString("base64"); //-> 토큰에 넣어서 적용
  const hashPassword = crypto_auth
    .pbkdf2Sync(password, salt, 10000, 64, "sha512")
    .toString("base64");

  let values = [name, nickname, email, contact, hashPassword, salt];

  conn.query(sql, values, (err: any, results: any) => {
    if (err) {
      console.log(err);
      return res.status(StatusCodes.BAD_REQUEST).end();
    }
    return res.status(StatusCodes.CREATED).json(results);
  });
};

export const signIn = (req: Request, res: Response) => {
  const { email, password } = req.body;
  let sql = "SELECT * FROM users WHERE email = ?";

  conn.query(sql, [email], (err: any, results: any) => {
    if (err) {
      console.log(err);
      return res.status(StatusCodes.BAD_REQUEST).end();
    }

    const loginUser = results[0];
    if (!loginUser) {
      return res.status(StatusCodes.NOT_FOUND).end();
    }
    const hashPassword = crypto_auth
      .pbkdf2Sync(password, loginUser.salt, 10000, 64, "sha512")
      .toString("base64");

    if (loginUser.password !== hashPassword) {
      return res.status(StatusCodes.UNAUTHORIZED).end();
    }

    const accessToken = jwt.sign(
      { email: loginUser.email, user_id: loginUser.id },
      process.env.PRIVATE_KEY,
      {
        expiresIn: "30m",
        issuer: "kim",
      }
    );

    const refreshToken = jwt.sign(
      { user_id: loginUser.id },
      process.env.PRIVATE_KEY,
      {
        expiresIn: "14d",
        issuer: "kim",
      }
    );

    const tokenSql = `
      INSERT INTO tokens (user_id, refresh_token, salt, created_at, expires_at)
      VALUES (?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 14 DAY))
        ON DUPLICATE KEY UPDATE
        refresh_token = VALUES(refresh_token),
        salt = VALUES(salt),
        created_at = NOW(),
        expires_at = DATE_ADD(NOW(), INTERVAL 14 DAY)
    `;
    const tokenValues = [loginUser.id, refreshToken, loginUser.salt];

    conn.query(tokenSql, tokenValues, (err2: any) => {
      if (err2) {
        console.log(err2);
        return res.status(StatusCodes.BAD_REQUEST).end(); //BAD REQUEST
      }

      res.cookie("token", accessToken, {
        httpOnly: false,
        secure: true,
        sameSite: "none",
      });

      return res.status(StatusCodes.OK).json(results);
    });
  });
};

export const findId = (req: Request, res: Response) => {
  const { name, contact } = req.body;
  const sql = "SELECT email FROM users WHERE name = ? AND contact = ?";
  const values = [name, contact];
  conn.query(sql, values, (err: any, results: any) => {
    if (err) {
      console.log(err);
      return res.status(StatusCodes.BAD_REQUEST).end();
    }

    const user = results[0];
    if (user) {
      return res.status(StatusCodes.OK).json({
        email: user.email,
      });
    } else {
      return res.status(StatusCodes.NOT_FOUND).end();
    }
  });
};

export const passwordResetRequest = (req: Request, res: Response) => {
  const { name, email, contact } = req.body;
  let sql = "SELECT * FROM users WHERE name = ? AND email = ? AND contact = ?";

  let values = [name, email, contact];
  conn.query(sql, values, (err: any, results: any) => {
    if (err) {
      console.log(err);
      return res.status(StatusCodes.BAD_REQUEST).end();
    }

    const user = results[0];

    if (user) {
      return res.status(StatusCodes.OK).json({
        email: email,
      });
    } else {
      return res.status(StatusCodes.UNAUTHORIZED).end();
    }
  });
};

export const passwordReset = (req: Request, res: Response): void => {
  const { password, passwordConfirm, email } = req.body;

  if (password !== passwordConfirm) {
    res.status(StatusCodes.BAD_REQUEST).json({
      message: "비밀번호와 비밀번호 확인이 일치하지 않습니다.",
    });
    return;
  }

  const salt = crypto_auth.randomBytes(64).toString("base64");
  const hashPassword = crypto_auth
    .pbkdf2Sync(password, salt, 10000, 64, "sha512")
    .toString("base64");
  let sql = "UPDATE users SET password = ?, salt = ? WHERE email =?";
  let values = [hashPassword, salt, email];

  conn.query(sql, values, (err: any, results: any) => {
    if (err) {
      console.log(err);
      return res.status(StatusCodes.BAD_REQUEST).end();
    }
    if (results.affectedRows == 0) {
      return res.status(StatusCodes.BAD_REQUEST).end();
    } else {
      return res.status(StatusCodes.OK).json(results);
    }
  });
};

export const logout = (req: Request, res: Response): void => {
  const jwt = ensureAuthorization(req, res);
  const user_id = jwt.user_id;

  const sql = "DELETE FROM tokens WHERE user_id = ?";

  conn.query(sql, [user_id], (err: any, results: any) => {
    if (err) {
      console.log(err);
      return res.status(StatusCodes.BAD_GATEWAY).end();
    }
    if (results.affectedRows == 0) {
      return res.status(StatusCodes.BAD_REQUEST).end();
    }
  });

  res.clearCookie("token", {
    httpOnly: false,
    secure: true,
    sameSite: "none",
  });

  res.status(StatusCodes.OK).end();
};

module.exports = {
  signUp,
  signIn,
  findId,
  passwordResetRequest,
  passwordReset,
  logout,
};