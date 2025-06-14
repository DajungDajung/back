import { Request, Response } from "express";
import { OkPacketParams, RowDataPacket } from "mysql2";
const { StatusCodes } = require("http-status-codes"); //status code 모듈
const conn = require("../mariadb"); //db 연결
const jwt = require("jsonwebtoken"); //jwt 모듈
const crypto = require("crypto"); //node.js 내장 모듈 암호화 모듈
const dotenv = require("dotenv"); //dotenv 모듈

//const axios = require("axios");
//import { AxiosError } from "axios";
import axios, { AxiosError } from "axios";

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

  const salt = crypto.randomBytes(64).toString("base64"); //-> 토큰에 넣어서 적용
  const hashPassword = crypto
    .pbkdf2Sync(password, salt, 10000, 64, "sha512")
    .toString("base64");

  let values = [name, nickname, email, contact, hashPassword, salt];

  conn.query(sql, values, (err: Error, results: OkPacketParams) => {
    if (err) {
      console.log(err);
      return res.status(StatusCodes.BAD_REQUEST).end();
    }
    return res.status(StatusCodes.CREATED).json(results);
  });
};
export const kakao = async (req: Request, res: Response) => {
  const redirectUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${process.env.KAKAO_CLIENT_ID}&redirect_uri=${process.env.KAKAO_REDIRECT_URI}&response_type=code`;
  res.redirect(redirectUrl);
};
export const kakaoCallback = async (req: Request, res: Response) => {
  const { code } = req.query;
  if (!code) return res.status(400).send("인가코드 없음");

  try {
    //카카오 access_token 요청
    const tokenResponse = await axios.post(
      "https://kauth.kakao.com/oauth/token",
      null,
      {
        params: {
          grant_type: "authorization_code",
          client_id: process.env.KAKAO_CLIENT_ID,
          redirect_uri: process.env.KAKAO_REDIRECT_URI,
          code,
        },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const { access_token } = tokenResponse.data;

    //사용자 정보 요청
    const userResponse = await axios.get("https://kapi.kakao.com/v2/user/me", {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const kakaoUser = userResponse.data;
    const kakaoId = kakaoUser.id; // 고유 사용자 ID
    const nickname = kakaoUser.properties?.nickname || "kakao_user";

    //JWT access 발급
    const appAccessToken = jwt.sign(
      {
        kakao_id: kakaoId,
        nickname,
        provider: "kakao",
      },
      process.env.PRIVATE_KEY,
      {
        expiresIn: "30m",
        issuer: "kim",
      }
    );

    const appRefreshToken = jwt.sign(
      { kakao_id: kakaoId },
      process.env.PRIVATE_KEY,
      {
        expiresIn: "14d",
        issuer: "kim",
      }
    );

    res.cookie("token", appAccessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    return res.redirect(
      `http://3.34.9.40:3002/oauthcallback?token=${appAccessToken}&nickname=${encodeURIComponent(
        nickname
      )}`
    );
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      // Axios 에러
      console.error("카카오 로그인 오류:", err.response?.data || err.message);
    } else if (err instanceof Error) {
      // 일반 에러
      console.error("카카오 로그인 오류:", err.message);
    } else {
      // 어떤 에러인지 모름
      console.error("카카오 로그인 오류:", err);
    }

    return res.status(500).send("카카오 로그인 실패");
  }
};
export const google = async (req: Request, res: Response) => {
  const redirectUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${process.env.GOOGLE_REDIRECT_URI}&response_type=code&scope=email profile openid&access_type=offline`;

  res.redirect(redirectUrl);
};
export const googleCallback = async (req: Request, res: Response) => {
  const { code } = req.query;
  if (!code) return res.status(400).send("인가코드 없음");

  try {
    //구글 access_token 요청
    const tokenResponse = await axios.post(
      "https://oauth2.googleapis.com/token",
      {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const { access_token } = tokenResponse.data;

    //사용자 정보 요청
    const userResponse = await axios.get(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    const googleUser = userResponse.data;
    const googleId = googleUser.id;
    const nickname = googleUser.name || "google_user";

    //JWT 토큰 발급
    const appAccessToken = jwt.sign(
      {
        google_id: googleId,
        nickname,
        provider: "google",
      },
      process.env.PRIVATE_KEY,
      {
        expiresIn: "30m",
        issuer: "kim",
      }
    );

    const appRefreshToken = jwt.sign(
      { google_id: googleId },
      process.env.PRIVATE_KEY,
      {
        expiresIn: "14d",
        issuer: "kim",
      }
    );

    res.cookie("token", appAccessToken, {
      httpOnly: false,
      secure: true,
      sameSite: "none",
    });

    // return res.status(200).json({
    //   message: "구글 로그인 성공 (쿠키 저장)",
    //   accessToken: appAccessToken,
    // });
    return res.redirect(
      `http://ec2-3-34-9-40.ap-northeast-2.compute.amazonaws.com:3002/oauthcallback?token=${appAccessToken}&nickname=${encodeURIComponent(
        nickname
      )}`
    );
  } catch (err: unknown) {
    //catch (err) {
    //console.error("구글 로그인 오류:", err.response?.data || err.message);
    //return res.status(500).send("구글 로그인 실패");
    //}
    if (axios.isAxiosError(err)) {
      // Axios 에러
      console.error("구글 로그인 오류:", err.response?.data || err.message);
    } else if (err instanceof Error) {
      // 일반 에러
      console.error("구글 로그인 오류:", err.message);
    } else {
      // 어떤 에러인지 모름
      console.error("구글 로그인 오류:", err);
    }

    return res.status(500).send("구글 로그인 실패");
  }
};

export const naver = async (req: Request, res: Response) => {
  const redirectUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${process.env.NAVER_CLIENT_ID}&redirect_uri=${process.env.NAVER_REDIRECT_URI}&state=RANDOM_STATE_STRING`;

  res.redirect(redirectUrl);
};
export const naverCallback = async (req: Request, res: Response) => {
  const { code, state } = req.query;
  if (!code || !state) return res.status(400).send("인가 코드 또는 state 누락");

  try {
    const tokenResponse = await axios.get(
      "https://nid.naver.com/oauth2.0/token",
      {
        params: {
          grant_type: "authorization_code",
          client_id: process.env.NAVER_CLIENT_ID,
          client_secret: process.env.NAVER_CLIENT_SECRET,
          code,
          state,
        },
      }
    );

    const { access_token } = tokenResponse.data;

    const userResponse = await axios.get(
      "https://openapi.naver.com/v1/nid/me",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    const naverUser = userResponse.data.response;
    const email = naverUser.email;
    const contact = naverUser.mobile || "정보없음";
    const name = naverUser.name || "naver_user";
    const nickname = naverUser.nickname || "naver_user";

    const salt = crypto.randomBytes(64).toString("base64");
    const fakePassword = crypto.randomBytes(16).toString("hex");
    const hashedPassword = crypto
      .pbkdf2Sync(fakePassword, salt, 10000, 64, "sha512")
      .toString("base64");

    const checkSql = "SELECT * FROM users WHERE email = ?";
    conn.query(checkSql, [email], (err: Error, results: RowDataPacket[]) => {
      if (err) {
        console.error("유저 확인 오류:", err);
        return res.status(500).send("DB 조회 실패");
      }

      const proceed = (userId: number, userSalt: string) => {
        const accessToken = jwt.sign(
          {
            user_id: userId,
            nickname,
            provider: "naver",
          },
          process.env.PRIVATE_KEY,
          {
            expiresIn: "30m",
            issuer: "kim",
          }
        );

        const refreshToken = jwt.sign(
          {
            user_id: userId,
          },
          process.env.PRIVATE_KEY,
          {
            expiresIn: "14d",
            issuer: "kim",
          }
        );

        const tokenSql = `INSERT INTO tokens (user_id, refresh_token, salt, created_at, expires_at)
          VALUES (?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 14 DAY))
          ON DUPLICATE KEY UPDATE
            refresh_token = VALUES(refresh_token),
            salt = VALUES(salt),
            created_at = NOW(),
            expires_at = DATE_ADD(NOW(), INTERVAL 14 DAY)`;

        const tokenValues = [userId, refreshToken, userSalt];

        conn.query(tokenSql, tokenValues, (err2: Error) => {
          if (err2) {
            console.error("토큰 저장 실패:", err2);
            return res.status(500).send("토큰 저장 실패");
          }

          res.cookie("token", accessToken, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
          });

          return res.redirect(
            `http://3.34.9.40:3002/oauthcallback?token=${accessToken}&nickname=${encodeURIComponent(
              nickname
            )}`
          );
        });
      };

      if (results.length === 0) {
        const insertSql = `
          INSERT INTO users (name, nickname, email, contact, password, salt, created_at)
          VALUES (?, ?, ?, ?, ?, ?, NOW())
        `;
        const values = [name, nickname, email, contact, hashedPassword, salt];

        conn.query(
          insertSql,
          values,
          (insertErr: Error, insertResult: OkPacketParams) => {
            if (insertErr) {
              console.error("유저 저장 실패:", insertErr);
              return res.status(500).send("DB 저장 실패");
            }

            const newUserId = insertResult.insertId;
            if (typeof newUserId !== "number") {
              return res.status(500).send("insertId가 없습니다");
            }

            proceed(newUserId, salt);
          }
        );
      } else {
        const existingUser = results[0];
        proceed(existingUser.id, existingUser.salt);
      }
    });
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      console.error("네이버 로그인 오류:", err.response?.data || err.message);
    } else if (err instanceof Error) {
      console.error("네이버 로그인 오류:", err.message);
    } else {
      console.error("네이버 로그인 오류:", err);
    }

    return res.status(500).send("네이버 로그인 실패");
  }
};
export const signIn = (req: Request, res: Response) => {
  const { email, password } = req.body;
  let sql = "SELECT * FROM users WHERE email = ?";

  conn.query(sql, [email], (err: Error, results: RowDataPacket) => {
    if (err) {
      console.log(err);
      return res.status(StatusCodes.BAD_REQUEST).end();
    }

    const loginUser = results[0];
    if (!loginUser) {
      return res.status(StatusCodes.NOT_FOUND).end();
    }
    const hashPassword = crypto
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

    const tokenSql = `INSERT INTO tokens (user_id, refresh_token, salt, created_at, expires_at)
      VALUES (?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 14 DAY))
        ON DUPLICATE KEY UPDATE
        refresh_token = VALUES(refresh_token),
        salt = VALUES(salt),
        created_at = NOW(),
        expires_at = DATE_ADD(NOW(), INTERVAL 14 DAY)`;
    const tokenValues = [loginUser.id, refreshToken, loginUser.salt];

    conn.query(tokenSql, tokenValues, (err2: Error) => {
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
  conn.query(sql, values, (err: Error, results: RowDataPacket) => {
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
  conn.query(sql, values, (err: Error, results: RowDataPacket) => {
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

  const salt = crypto.randomBytes(64).toString("base64");
  const hashPassword = crypto
    .pbkdf2Sync(password, salt, 10000, 64, "sha512")
    .toString("base64");
  let sql = "UPDATE users SET password = ?, salt = ? WHERE email =?";
  let values = [hashPassword, salt, email];

  conn.query(sql, values, (err: Error, results: OkPacketParams) => {
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

  conn.query(sql, [user_id], (err: Error, results: OkPacketParams) => {
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
  kakao,
  kakaoCallback,
  google,
  googleCallback,
  naver,
  naverCallback,
};
