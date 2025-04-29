const connection = require('../mariadb');
const mariadb = require('mysql2/promise');
const { StatusCodes } = require('http-status-codes');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const ensureAuthorization = require('../modules/auth/ensureAuthorization');
const jwtErrorhandler = require('../modules/auth/jwtErrorhandler');

dotenv.config({path: __dirname + '/../.env'})

const getMyPage = (req, res) => {
    const authorization = ensureAuthorization(req, res)
    
    if (authorization instanceof ReferenceError) {
        return res.status(StatusCodes.BAD_REQUEST).send("로그인이 필요합니다.");
    }
    else if (authorization instanceof Error){
        return jwtErrorhandler(authorization, res); 
    }
    
    const sql = 'SELECT id, img_id, nickname, created_at, info, email, contact from users WHERE id = ?';
    const userId = authorization.user_id;

    connection.query(sql, userId, (err, results) => {
        if (err) {
            return res.status(StatusCodes.BAD_REQUEST).json(err);
        }

        return res.status(StatusCodes.OK).json(results);
    })
}

const updateMyPage = async (req, res) => {
    const conn = await mariadb.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password : process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        dateStrings : true
    });

    // 프로필 이미지 변경하면 어떡해야 할까? 1. 이미지 api를 따로 만들 것인지? 아님 이미지 먼저 저장한 후 update를 할 건지 2. 후자의 경우 url은?
    const authorization = ensureAuthorization(req, res)

    if (authorization instanceof ReferenceError) {
        return res.status(StatusCodes.BAD_REQUEST).send("로그인이 필요합니다.");
    }
    if (authorization instanceof Error){
        return jwtErrorhandler(authorization, res); 
    }

    const newUserDatas = req.body;

    if (!newUserDatas) {
        return res.status(StatusCodes.BAD_REQUEST).send("입력된 데이터가 없습니다.");
    }

    let sql = 'SELECT * FROM users WHERE id = ? ';
    const userId = authorization.user_id;

    const [foundUser, fields] = await conn.query(sql, userId);

    if(!foundUser?.length)  {
        return res.status(StatusCodes.NOT_FOUND).send("해당 ID의 사용자를 찾을 수 없습니다.");
    }

    sql = 'UPDATE users SET nickname = ?, email = ?, info = ?, contact = ?, password = ? WHERE id = ?';
    const values = [];

    Object.keys(newUserDatas).forEach((key) => {
        values.push(getNewValueOrDefault(newUserDatas[key], foundUser[0][key]))
    });

    values.push(userId);

    connection.query(sql, values, (err, results) => {
        if (err) {
            return res.status(StatusCodes.BAD_REQUEST).json(err);
        }

        if (results.affectedRows == 0){
            return res.send("업데이트 실패");
        }

        return res.status(StatusCodes.OK).json(results);
    })
}

const getNewValueOrDefault = (newValue, defaultValue) => {
    return newValue !== undefined && newValue !== null && newValue !== '' ? newValue : defaultValue;
}

module.exports = {getMyPage, updateMyPage};