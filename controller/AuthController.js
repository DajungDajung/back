const { StatusCodes } = require("http-status-codes"); //status code 모듈
const conn = require("../mariadb"); //db 연결
const jwt = require("jsonwebtoken"); //jwt 모듈
const crypto = require("crypto"); //node.js 내장 모듈 암호화 모듈
const dotenv = require("dotenv"); //dotenv 모듈
dotenv.config();

//salt 처라허가가
const signUp = (req, res) => {
  const { name, nickname, email, contact, password } = req.body;
  let sql =
    "INSERT INTO users (name, nickname, email, contact, password) VALUES (?,?,?,?,?)";

  const salt = crypto.randomBytes(64).toString("base64"); //-> 토큰에 넣어서 적용
  const hashPassword = crypto
    .pbkdf2Sync(password, salt, 10000, 64, "sha512")
    .toString("base64");

  let values = [name, nickname, email, contact, hashPassword];

  conn.query(sql, values, (err, results) => {
    if (err) {
      console.log(err);
      return res.status(StatusCodes.BAD_REQUEST).end();
    }
    return res.status(StatusCodes.CREATED).json(results);
  });
};

const signIn = (req, res) => {
  const { email, password } = req.body;
  let sql = "SELECT * FROM users WHERE email = ?";
  conn.query(sql, email, (err, results) => {
    if (err) {
      console.log(err);
      return res.status(StatusCodes.BAD_REQUEST).end();
    }

    const loginUser = results[0];

    const hashPassword = crypto
      .pbkdf2Sync(password, loginUser.salt, 10000, 64, "sha512")
      .toString("base64");

    if (loginUser && loginUser.password == hashPassword) {
      const token = jwt.sign(
        {
          email: loginUser.email,
        },
        process.env.PRIVATE_KEY,
        {
          expiresIn: "5m",
          issuer: "kim",
        }
      );
      //토큰 쿠키에 담기
      res.cookie("token", token, {
        httpOnly: true,
      });
      return res.status(StatusCodes.OK).json(results);
    } else {
      return res.status(StatusCodes.UNAUTHORIZED).end();
    }
  });
};

const findId = (req, res) => {};

const passwordResetRequest = (req, res) => {
  const { name, email, contact } = req.body;
  let sql = "SELECT * FROM users WHERE name = ? AND email = ? AND contact = ?";

  let values = [name, email, contact];
  conn.query(sql, values, (err, results) => {
    if (err) {
      console.log(err);
      return res.status(StatusCodes.BAD_REQUEST).end();
    }

    const user = results[0];

    if (user) {
      return res.status(StatusCodes.OK).json({
        name: name,
        email: email,
        contact: contact,
      });
    } else {
      return res.status(StatusCodes.UNAUTHORIZED).end();
    }
  });
};

const passwordReset = (req, res) => {};

module.exports = {
  signUp,
  signIn,
  findId,
  passwordResetRequest,
  passwordReset,
};
