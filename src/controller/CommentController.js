const ensureAuthorization = require("../modules/auth/ensureAuthorization");
const jwt = require("jsonwebtoken");
const conn = require("../mariadb");
const { StatusCodes } = require("http-status-codes");

const addComment = (req, res) => {
  const item_id = req.params.id;
  const { contents } = req.body;

  console.log(item_id, contents);

  let authorization = ensureAuthorization(req, res);

  if (authorization instanceof jwt.TokenExpiredError) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      message: "로그인 세션이 만료되었습니다. 다시 로그인하세요.",
    });
  } else if (authorization instanceof jwt.JsonWebTokenError) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "잘못된 토큰입니다.",
    });
  } else {
    let sql = `INSERT INTO comments (item_id, user_id, contents)
      VALUES (?, ?, ?)`;
    let values = [item_id, authorization.user_id, contents];

    console.log(values)
    
    conn.query(sql, values, (err, results) => {
      if (err) {
        console.log(err);
        return res.status(StatusCodes.BAD_REQUEST).end();
      }

      return res.status(StatusCodes.OK).json(results);
    });
  }
};

const removeComment = (req, res) => {
  const commentId = req.params.id;

  let authorization = ensureAuthorization(req, res);

  if (authorization instanceof jwt.TokenExpiredError) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      message: "로그인 세션이 만료되었습니다. 다시 로그인하세요.",
    });
  } else if (authorization instanceof jwt.JsonWebTokenError) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "잘못된 토큰입니다.",
    });
  } else {
    let sql = `DELETE FROM comments
                WHERE id = ? AND user_id = ?`;
    let values = [commentId, authorization.user_id];
    conn.query(sql, values, (err, results) => {
      if (err) {
        console.log(err);
        return res.status(StatusCodes.BAD_REQUEST).end();
      }

      return res.status(StatusCodes.OK).json(results);
    });
  }
};

const commentList = (req, res) => {
  const item_id = req.params.id;

  let sql = `SELECT img_id, nickname, contents FROM comments
                LEFT JOIN users ON comments.user_id = users.id
                WHERE item_id = ?`;
  conn.query(sql, item_id, (err, results) => {
    if (err) {
      console.log(err);
      return res.status(StatusCodes.BAD_REQUEST).end();
    }

    return res.status(StatusCodes.OK).json(results);
  });
};

module.exports = {
  addComment,
  removeComment,
  commentList,
};
