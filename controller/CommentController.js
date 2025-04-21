// const ensureAuthorization = require('../auth');
// const jwt = require('jsonwebtoken');
const conn = require('../mariadb');
const {StatusCodes} = require('http-status-codes');

const addComment = (req, res) => {
    const item_id = req.params.id;
    const {user_id, contents} = req.body;

    let sql = `INSERT INTO comments (item_id, user_id, contents)
                VALUES (?, ?, ?)`;
    let values = [item_id, user_id, contents];
    conn.query(sql, values,
        (err, results) => {
            if(err) {
                console.log(err);
                return res.status(StatusCodes.BAD_REQUEST).end();
            }

            return res.status(StatusCodes.OK).json(results);
        }
    )
};

const removeComment = (req, res) => {
    const commentId = req.params.id;
    const {user_id} = req.body;

    let sql = `DELETE FROM comments
                WHERE id = ? AND user_id = ?`;
    let values = [commentId, user_id];
    conn.query(sql, values,
        (err, results) => {
            if(err) {
                console.log(err);
                return res.status(StatusCodes.BAD_REQUEST).end();
            }

            return res.status(StatusCodes.OK).json(results);
        }
    )
    
};

const commentList = (req, res) => {
    const item_id = req.params.id;

    let sql = `SELECT * FROM comments
                WHERE item_id = ?`;
    conn.query(sql, item_id,
        (err, results) => {
            if(err) {
                console.log(err);
                return res.status(StatusCodes.BAD_REQUEST).end();
            }
            if(results.length) {
                results.map(function(result) {
                    result.itemId = result.item_id;
                    delete result.item_id;
                    result.userId = result.user_id;
                    delete result.user_id;
                });
                return res.status(StatusCodes.OK).json(results);
            } else {
                return res.status(StatusCodes.NOT_FOUND).end();
            }
        }
    )
    
};

module.exports = {
    addComment,
    removeComment,
    commentList
};