const jwt = require('jsonwebtoken');
const { StatusCodes } = require('http-status-codes');
const dotenv = require('dotenv');
const handleTokenError = require('./jwtErrorHandler');
const parseCookies = require('./parseCookies');
dotenv.config();

const checkAuthorization = (req, res, next)=>{
    const token = parseCookies(req.headers.cookie).token;
    if (!token) {
        return res.status(StatusCodes.UNAUTHORIZED).send("로그인이 필요합니다.");
    }

    try {
        const decoded = jwt.verify(token, process.env.PRIVATE_KEY);
        req.user = decoded;
        next();
    } catch (err) {
        handleTokenError(err,res)
    }
}

module.exports = checkAuthorization;