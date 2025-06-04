const jwt = require("jsonwebtoken");
const { StatusCodes } = require("http-status-codes");

const jwtErrorHandler = (err, res) => {
  if (err instanceof jwt.TokenExpiredError) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .send("토큰이 만료되었습니다. 토큰 재발급이 필요합니다.");
  } else if (err instanceof jwt.JsonWebTokenError) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .send("잘못된 토큰입니다. 토큰 재발급이 필요합니다.");
  } else {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send("알 수 없는 토큰 오류가 발생했습니다.");
  }
};

module.exports = jwtErrorHandler;
