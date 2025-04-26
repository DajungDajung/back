// const ensureAuthorization = require('../auth');
// const jwt = require('jsonwebtoken');
const conn = require("../mariadb");
const { StatusCodes } = require("http-status-codes");

const addLike = (req, res) => {
  const item_id = req.params.id;
  const { user_id } = req.body;

  let sql = `INSERT INTO likes (item_id, user_id)
                VALUES (?, ?)`;
  let values = [item_id, user_id];
  conn.query(sql, values, (err, results) => {
    if (err) {
      console.log(err);
      return res.status(StatusCodes.BAD_REQUEST).end();
    }

    return res.status(StatusCodes.OK).json(results);
  });
};

const removeLike = (req, res) => {
  const item_id = req.params.id;
  const { user_id } = req.body;

  let sql = `DELETE FROM likes
                WHERE item_id = ? AND user_id = ?`;
  let values = [item_id, user_id];
  conn.query(sql, values, (err, results) => {
    if (err) {
      console.log(err);
      return res.status(StatusCodes.BAD_REQUEST).end();
    }

    return res.status(StatusCodes.OK).json(results);
  });
};

const myLikeList = (req, res) => {
  const { user_id } = req.body;

  let sql = `SELECT img_id, title, price, created_at FROM likes
                LEFT JOIN items ON likes.item_id = items.id
                WHERE likes.user_id = ?`;
  conn.query(sql, user_id, (err, results) => {
    if (err) {
      console.log(err);
      return res.status(StatusCodes.BAD_REQUEST).end();
    }
    return res.status(StatusCodes.OK).json(results);
  });
};

module.exports = {
  addLike,
  removeLike,
  myLikeList,
};
