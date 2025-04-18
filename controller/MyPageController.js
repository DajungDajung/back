const connection = require('../mariadb');
const mariadb = require('mysql2/promise');
const { StatusCodes } = require('http-status-codes');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const ensureAuthorization = require('../modules/auth/ensureAuthorization');
const jwtErrorhandler = require('../modules/auth/jwtErrorhandler');

dotenv.config({path: __dirname + '/../.env'})

// DELETE (URL 미정) → 좋아요 취소
// GET /users/info/likes → 좋아요 조회
// PUT /users/myPage → 유저 정보 수정
// GET /users/myPage → 유저 정보 조회

// 토큰을 발급받기 위한 임시 api 입니다
const getToken = (req, res) => {
    const token = jwt.sign({
        id: 2,
        mesesage:"임시 토큰입니다"
    }, process.env.PRIVATE_KEY);

    res.json({'token' : token});
}


const getMyPage = (req, res) => {
    const authorization = ensureAuthorization(req, res)
    
    if (authorization instanceof ReferenceError) {
        return res.status(StatusCodes.BAD_REQUEST).send("로그인이 필요합니다.");
    }
    else if (authorization instanceof Error){
        return jwtErrorhandler(authorization, res); 
    }
    
    const sql = 'SELECT id, img_id, nickname, created_at, info, email, contact from users WHERE id = ?';
    const userId = authorization.id;

    connection.query(sql, userId, (err, results) => {
        if (err) {
            return res.status(StatusCodes.BAD_REQUEST).json(err);
        }

        return res.status(StatusCodes.OK).json(results);
    })
}

const updateMyPage = async (req, res) => {
    const conn = await mariadb.createConnection({
        host:'127.0.0.1',
        user: 'root',
        password: 'root',
        database: 'dajungdajung_project',
        dateStrings: true
    });

    // 프로필 이미지 변경하면 어떡해야 할까? 1. 이미지 api를 따로 만들 것인지? 아님 이미지 먼저 저장한 후 update를 할 건지 2. 후자의 경우 url은?
    const authorization = ensureAuthorization(req, res)

    if (authorization instanceof ReferenceError) {
        return res.status(StatusCodes.BAD_REQUEST).send("로그인이 필요합니다.");
    }
    if (authorization instanceof Error){
        return jwtErrorhandler(authorization, res); 
    }

    const newUserData = req.body;

    if (!newUserData) {
        return res.status(StatusCodes.BAD_REQUEST).send("입력된 데이터가 없습니다.");
    }

    let sql = 'SELECT * FROM users WHERE id = ? ';
    const userId = authorization.id;

    const [foundUser, fields] = await conn.query(sql, userId);

    if(!foundUser?.length)  {
        return res.status(StatusCodes.NOT_FOUND).send("해당 ID의 사용자를 찾을 수 없습니다.");
    }

    sql = 'UPDATE users SET img_id = ?, nickname = ?, email = ?, info = ?, contact = ?, password = ? WHERE id = ?';
    const values = [
        getNewValueOrDefault(newUserData.img_id, foundUser[0].img_id),
        getNewValueOrDefault(newUserData.nickname, foundUser[0].nickname),
        getNewValueOrDefault(newUserData.email, foundUser[0].email),
        getNewValueOrDefault(newUserData.info, foundUser[0].info),
        getNewValueOrDefault(newUserData.contact, foundUser[0].contact),
        getNewValueOrDefault(newUserData.password, foundUser[0].password),
        userId
    ];

    connection.query(sql, values, (err, results) => {
        if (err) {
            return res.status(StatusCodes.BAD_REQUEST).json(err);
        }

        if (results.affectedRows == 0){
            res.send("업데이트 실패");
        }

        return res.status(StatusCodes.OK).json(results);
    })
}

const getUserInfo = (req, res) => {
    res.send("사용자 정보 조회입니다");
}

const getNewValueOrDefault = (newValue, defaultValue) => {
    return newValue !== undefined && newValue !== null && newValue !== '' ? newValue : defaultValue;
}

module.exports = {getMyPage, updateMyPage, getUserInfo, getToken};