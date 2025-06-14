const jwt = require("jsonwebtoken");
const dotenv = require("dotenv"); // dotenv 모듈
const parseCookies = require("./parseCookies");
dotenv.config();

const ensureAuthorization = (req, res) => {
  try {
    const cookies = parseCookies(req.headers.cookie);
    const receivedjwt = cookies.token;

    if (receivedjwt) {
      const decodedjwt = jwt.verify(receivedjwt, process.env.PRIVATE_KEY);
      return decodedjwt;
    } else {
      throw new ReferenceError("jwt must be provided");
    }
  } catch (err) {
    if (err instanceof Error) {
      console.log(err.name);
      console.log(err.message);

      return err;
    }

    console.log("Unknown error", err);
    return new Error("알 수 없는 에러가 발생했습니다.");
  }
};

module.exports = ensureAuthorization;
