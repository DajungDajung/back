const { StatusCodes } = require("http-status-codes");
const db = require("../mariadb.js");
const mariadb = require("mysql2/promise");
const ensureAuthorization = require("../modules/auth/ensureAuthorization.js");

const getCategory = (req, res) => {
  const sql =
    "SELECT category_id AS id, category_name AS category FROM categories";
  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "카테고리 조회에 실패했습니다." });
    }
    return res.status(StatusCodes.OK).json(results);
  });
};

const getRecentItems = (req, res) => {
  let startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 1);

  const sql = `SELECT 
        id,
        img_id,
        title,
        price,
        created_at
    FROM items 
    WHERE created_at BETWEEN ? AND NOW()
    ORDER BY created_at DESC
    LIMIT 0,30;`;
  const values = [startDate.toISOString().split("T")[0]];

  db.query(sql, values, (err, results) => {
    if (err) {
      console.log(err);
      return res.status(StatusCodes.BAD_REQUEST).end();
    }
    if (results[0]) return res.status(StatusCodes.OK).json(results);
    else return res.status(StatusCodes.NO_CONTENT).end();
  });
};

const getItems = (req, res) => {
  const { q, category, startDate, endDate } = req.query;
  const limit = parseInt(req.query.limit ?? 10, 10);
  const currentPage = parseInt(req.query.currentPage ?? 1, 10);
  const offset = limit * (currentPage - 1);

  let sql = "SELECT id, img_id, title, price, created_at FROM items";
  let values = [];
  let filters = [];

  if (q) {
    filters.push("title LIKE (?)");
    values.push("%" + q + "%");
  }

  if (category) {
    filters.push("category_id = ?");
    values.push(category);
  }

  if (startDate && endDate) {
    filters.push("created_at BETWEEN ? AND ?");
    values.push(startDate, endDate);
  } else if (startDate) {
    filters.push("created_at BETWEEN ? AND NOW()");
    values.push(startDate);
  }

  if (filters.length > 0) {
    sql += " WHERE " + filters.join(" AND ");
  }

  sql += " LIMIT ?,?";
  values.push(offset, limit);

  db.query(sql, values, (err, results) => {
    if (err) {
      console.log(err);
      return res.status(StatusCodes.BAD_REQUEST).end();
    }
    if (results[0]) return res.status(StatusCodes.OK).json(results);
    else return res.status(StatusCodes.NO_CONTENT).end();
  });
};

const getMyItems = (req, res) => {
  const user_id = req.user.user_id;
  const limit = parseInt(req.query.limit ?? 10, 10);
  const currentPage = parseInt(req.query.currentPage ?? 1, 10);
  const offset = limit * (currentPage - 1);

  const sql =
    "SELECT id, img_id, title, price, created_at FROM items WHERE items.user_id = ?  LIMIT ?,?";
  const values = [user_id, offset, limit];

  db.query(sql, values, (err, results) => {
    if (err) {
      console.log(err);
      return res.status(StatusCodes.BAD_REQUEST).end();
    }
    if (results[0]) return res.status(StatusCodes.OK).json(results);
    else return res.status(StatusCodes.NO_CONTENT).end();
  });
};

const getItemDetail = async (req, res) => {

  const item_id = req.params.id;
  const user_id = req.user?.user_id ?? 0;

  let sql = `
        SELECT
            i.*,
            c.category_name     AS category,
            ( SELECT COUNT(*) FROM likes l WHERE l.item_id = i.id) AS likes,
            IF(
                EXISTS(
                    SELECT 1
                    FROM likes l2
                    WHERE l2.item_id = i.id
                    AND l2.user_id = ?
                ),
                TRUE,
                FALSE
            )   AS liked,
            IF(
                    i.user_id = ?,
                    TRUE,
                    FALSE
                ) AS is_seller,
            u.nickname AS user_name,
            u.img_id AS user_image
            FROM items i
            JOIN users u
            ON u.id = i.user_id
            LEFT JOIN categories c
            ON c.category_id = i.category_id
            WHERE i.id = ?;
`;
  let values = [user_id, user_id, item_id];

  db.query(sql, values, (err, results) => {
    if (err) {
      console.log(err);
      return res.status(StatusCodes.BAD_REQUEST).end();
    }
    if (results.length && results[0]) {
      const row = results[0];
      const item_init = {
        item: {
          id: row.id,
          img_id: row.img_id,
          category_id: row.category_id,
          category: row.category,
          title: row.title,
          price: row.price,
          create_at: row.created_at,
          contents: row.contents,
          like: row.likes,
          liked: row.liked === 0 ? "false" : "true",
          seller: row.is_seller === 0 ? "false" : "true",
        },
        user: {
          id: row.user_id,
          seller: row.user_name,
          image: row.user_image,
        },
      };
      return res.status(StatusCodes.OK).json(item_init);
    } else {
      return res.status(StatusCodes.NOT_FOUND).end();
    }
  });
};

const postItem = (req, res) => {
  const { img_id, title, category, price, contents } = req.body;
  const user_id = req.user.user_id;

  let sql =
    "INSERT INTO items (img_id, category_id, user_id, title, price, contents) VALUES(?, ?, ?, ?, ?, ?)";
  let values = [img_id, category, user_id, title, price, contents];
  db.query(sql, values, (err, results) => {
    if (err) {
      console.log(err);
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "상품 등록에 실패했습니다." });
    }

    if (results.affectedRows) {
      return res.status(StatusCodes.CREATED).json(results);
    } else
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "상품 등록에 실패했습니다. 입력 값을 확인하세요." });
  });
};

const updateItem = (req, res) => {
  const itme_id = req.params.id;
  const { img_id, title, category, price, contents } = req.body;
  let sql =
    "UPDATE items SET img_id=?, category_id = ?, title = ?, price = ?, contents = ? WHERE id = ?";
  let values = [img_id, category, title, price, contents, itme_id];

  db.query(sql, values, (err, results) => {
    if (err) {
      console.log(err);
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "상품 수정에 실패했습니다." });
    }

    if (results.affectedRows) {
      return res.status(StatusCodes.CREATED).json(results);
    } else
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "상품 수정에 실패했습니다.." });
  });
};

const deleteItem = (req, res) => {
  const item_id = req.params.id;
  let sql = "DELETE FROM items WHERE id = ?";
  let values = [item_id];

  db.query(sql, values, (err, results) => {
    if (err) {
      console.log(err);
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "상품 삭제에 실패했습니다." });
    }

    if (results.affectedRows > 0) {
      return res
        .status(StatusCodes.OK)
        .json({ message: "상품 삭제에 성공했습니다." });
    } else {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "상품 삭제에 실패했습니다." });
    }
  });
};

module.exports = {
  getItems,
  getRecentItems,
  getItemDetail,
  getMyItems,
  postItem,
  updateItem,
  deleteItem,
  getCategory,
};
