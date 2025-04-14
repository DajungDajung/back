const { StatusCodes } = require("http-status-codes"); //status code 모듈
const conn = require("../mariadb"); //db 연결
const jwt = require("jsonwebtoken"); //jwt 모듈
const crypto = require("crypto"); //node.js 내장 모듈 암호화 모듈
const dotenv = require("dotenv"); //dotenv 모듈
dotenv.config();

//salt 처라허가가
const signUp = (res, req) => {
  const { name, nickname, email, contact, password } = req.body;
  let sql =
    "INSERT INTO users (name, nickname, email, contact, password) VALUES (?,?,?,?,?)";

  const salt = crypto.randomBytes(64).toString("base64"); //-> 토큰에 넣어서 적용
  const hashPassword = crypto
    .pbkdf2Sync(password, salt, 10000, 64, "sha512")
    .toString("base64");

  let values = [name, nickname, email, contact, password];

  conn.query(sql, values, (err, results) => {
    if (err) {
      console.log(err);
      return res.status(StatusCodes.BAD_REQUEST).end(); //BAD REQUEST
    }
    return res.status(StatusCodes.CREATED).json(results);
  });
};

const signIn = (res, req) => {};

const findId = (res, req) => {};

const passwordResetRequest = (res, req) => {};

const passwordReset = (res, req) => {};

module.exports = {
  signUp,
  signIn,
  findId,
  passwordResetRequest,
  passwordReset,
};
