const {StatusCodes} = require('http-status-codes');
const db = require('../mariadb.js');

const checkItemSeller = (req, res, callback)=>{
    const item_id = req.params.id;
    const user_id = checkCookies(req);
    if (!user_id){
        return res.status(StatusCodes.UNAUTHORIZED).json({ message: "다시 로그인 해주세요"});
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

const checkCookies = (req) =>{
    if (req.cookies && req.cookies.user_id){
        return parseInt(req.cookies.user_id);
    }
    return null
}

const getItems = (req, res) =>{
    const {q, category, limit, startDate, endDate, currentPage} = req.query;

    let sql = "SELECT id, title, price, created_at FROM items"
    let values = [];
    let filters = [];

    // q, category=> 상품 검색, news => 몇일
    if(q) {
        filters.push("title LIKE ?");
        values.push(`%${q}%`);
    }

    if(category){
        filters.push("category = ?");
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

    let offset = limit * (currentPage - 1);
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
    // const user_id = checkCookies(req);

    let sql = `
        SELECT 
            i.*,
            u.name AS user_name,
            u.image AS user_image,
            (SELECT COUNT(*) FROM likes l WHERE l.item_id = i.id) AS like
        FROM items i
        JOIN users u ON i.user_id = u.id
        WHERE i.id=?`;
    let values = [item_id];

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
                    title: row.title,
                    price: row.price,
                    create_at: row.created_at,
                    contents: row.contents,
                    like: row.like,
                    seller: row.user_name,
                    img_id: row.img_id
                }, user: {
                    name: row.user_name,
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
    const user_id = checkCookies(req);

    let sql = 'INSERT INTO items (category_id, user_id, title, price, contents, img_id) VALUES(?, ?, ?, ?, ?)';
    let values = [category, user_id, title, price, contents, category];
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

    checkItemSeller(req,res, ()=>{
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

    checkItemSeller(req, res, ()=>{
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
    getItemDetail,
    postItem,
    updateItem,
    deleteItem
}