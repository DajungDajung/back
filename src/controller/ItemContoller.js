const {StatusCodes} = require('http-status-codes');
const db = require('../mariadb.js');
const ensureAuthorization = require('../modules/auth/ensureAuthorization.js');
const jwtErrorhandler = require('../modules/auth/jwtErrorhandler.js');

const checkItemOwner = (req, res, callback)=>{
    const item_id = req.params.id;
    const authorization = ensureAuthorization(req);
    const user_id = authorization.user_id;
    if (authorization instanceof ReferenceError) {
        return res.status(StatusCodes.BAD_REQUEST).send("로그인이 필요합니다.");
    }
    else if (authorization instanceof Error){
        return jwtErrorhandler(authorization, res); 
    }

    let sql = 'SELECT user_id FROM items WHERE id = ?';
    let values = [item_id];
    db.query(sql, values, (err, results) => {
        if (err) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: "상품 삭제에 실패했습니다." });
        }
        if (results.length === 0) {
            return res.status(StatusCodes.NOT_FOUND).json({message:"해당 상품이 존재하지 않습니다."});
        }
        const ownerId = results[0].user_id;
        if (parseInt(user_id) !== ownerId) {
            return res.status(StatusCodes.UNAUTHORIZED).json({ message: "해당 상품에 대한 삭제 권한이 없습니다." });
        }
        callback();
    });
}

const getRecentItems = (req,res)=>{
    let startDate = new Date();
    startDate.setMonth(startDate.getMonth()-1);

    const sql = `SELECT 
        id,
        title,
        price,
        created_at
    FROM items 
    WHERE created_at BETWEEN ? AND NOW()
    ORDER BY created_at DESC
    LIMIT 0,10;`
    const values = [startDate.toISOString().split('T')[0]];

    db.query(sql, values, (err, results)=>{
        if (err){
            console.log(err);
            return res.status(StatusCodes.BAD_REQUEST).end();
        }
        if(results[0])
            return res.status(StatusCodes.OK).json(results);
        else
            return res.status(StatusCodes.NOT_FOUND).end();
    })
}

const getItems = (req, res) =>{
    const {q, category, startDate, endDate} = req.query;
    let {limit=10, currentPage=1} = req.query;

    let sql = "SELECT id, title, price, created_at FROM items"
    let values = [];
    let filters = [];

    if(q) {
        filters.push("title LIKE (?)");
        values.push('%'+q+'%');
    }

    if(category){
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

    let offset = limit * (currentPage -1);
    sql += " LIMIT ?,?";
    values.push(offset, parseInt(limit));

    db.query(sql, values, (err, results)=>{
        if (err){
            console.log(err);
            return res.status(StatusCodes.BAD_REQUEST).end();
        }
        if(results[0])
            return res.status(StatusCodes.OK).json(results);
        else
            return res.status(StatusCodes.NOT_FOUND).end();
    })
}

const getItemDetail = (req, res) =>{
    const item_id = req.params.id;

    // 쿠키 확인 후 user_id 빼오기, 나중에 이걸로 판매자 | 구매자를 구분해달라하면 그때 넣기
    const authorization = ensureAuthorization(req);
    let user_id = authorization.user_id ?? 0;

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
    let values = [user_id,user_id,item_id];

    db.query(sql, values, (err, results)=>{
        if (err){
            console.log(err);
            return res.status(StatusCodes.BAD_REQUEST).end();
        }
        if(results.length && results[0] ){
            const row = results[0];
            const item_init = {
                item: {
                    id : row.id,
                    category_id: row.category_id,
                    category: row.category,
                    title: row.title,
                    price: row.price,
                    create_at: row.created_at,
                    contents: row.contents,
                    like: row.likes,
                    liked: row.liked === 0 ? "false": "true",
                    seller: row.is_seller === 0? "false":"ture",
                    img_id: row.img_id
                }, user: {
                    seller: row.user_name,
                    image: row.user_image
                }
            };
            return res.status(StatusCodes.OK).json(item_init);
        } else {
            return res.status(StatusCodes.NOT_FOUND).end();
        }
    });
}

const postItem = (req, res) =>{
    const {title, category, price, contents} = req.body;

    // 쿠키 확인 후 user_id 빼오기
    const user_Jwt = ensureAuthorization(req);
    const user_id = user_Jwt.user_id;

    let sql = 'INSERT INTO items (img_id, category_id, user_id, title, price, contents) VALUES(?, ?, ?, ?, ?, ?)';
    let values = [category, category, user_id, title, price, contents];
    db.query(sql,values,(err, results)=>{
        if (err) {
            console.log(err)
            return res.status(StatusCodes.BAD_REQUEST).json({message:"상품 등록에 실패했습니다."})
        }
        
        if (results.affectedRows){
            console.log("상품 등록에 성공했습니다.");
            return res.status(StatusCodes.CREATED).json(results);
        }else
            return res.status(StatusCodes.BAD_REQUEST).json({ message: "상품 등록에 실패했습니다. 입력 값을 확인하세요." });
    })
}

const updateItem = (req,res) =>{

    checkItemOwner(req,res, ()=>{
        const itme_id = req.params.id;
        const {title, category, price, contents} = req.body;
        let sql = 'UPDATE items SET category_id = ?, title = ?, price = ?, contents = ? WHERE id = ?';
        let values = [category, title, price, contents, itme_id];

        db.query(sql,values,(err, results)=>{
            if (err) {
                console.log(err)
                return res.status(StatusCodes.BAD_REQUEST).json({message:"상품 수정에 실패했습니다."})
            }
            
            if (results.affectedRows){
                console.log("상품 수정에 성공했습니다.");
                return res.status(StatusCodes.CREATED).json(results);
            }else
                return res.status(StatusCodes.NOT_FOUND).json({ message: "상품 수정에 실패했습니다.." });
        })
    })
}

const deleteItem = (req, res) =>{

    checkItemOwner(req, res, ()=>{
        const item_id = req.params.id;
        const sql = 'DELETE FROM items WHERE id = ?';
        const values = [item_id];

        db.query(sql, values, (err, results) => {
            if (err) {
                console.log(err);
                return res.status(StatusCodes.BAD_REQUEST).json({ message: "상품 삭제에 실패했습니다." });
            }
            
            if (results.affectedRows > 0) {
                console.log("상품 삭제에 성공했습니다.");
                return res.status(StatusCodes.OK).json({ message: "상품 삭제에 성공했습니다." });
            } else {
                return res.status(StatusCodes.BAD_REQUEST).json({ message: "상품 삭제에 실패했습니다." });
            }
        });
    });
}

module.exports = {
    getItems,
    getRecentItems,
    getItemDetail,
    postItem,
    updateItem,
    deleteItem
}