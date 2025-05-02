const {StatusCodes} = require('http-status-codes');
const db = require('../../mariadb');

const checkItemOwner = (req, res, next)=>{
    const item_id = req.params.id;
    const user_Id = req.user.user_id;
    
    let sql = 'SELECT user_id FROM items WHERE id = ?';
    let values = [item_id];
    db.query(sql, values, (err, results) => {
        if (err) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: "DB 오류가 발생했습니다." });
        }
        if (results.length === 0) {
            return res.status(StatusCodes.NOT_FOUND).json({message:"해당 상품이 존재하지 않습니다."});
        }
        if (results[0].user_id !== user_Id) {
            return res.status(StatusCodes.UNAUTHORIZED).json({ message: "해당 상품에 대한 권한이 없습니다." });
        }
        next();
    });
}

module.exports = checkItemOwner;