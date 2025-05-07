const jwt = require('jsonwebtoken');
const { StatusCodes } = require('http-status-codes');
const dotenv = require('dotenv');
const handleTokenError = require('./jwtErrorhandler');
const parseCookies = require('./parseCookies');
dotenv.config();

const passAuthorization = (req, res, next)=>{
    try {
        const token = parseCookies(req.headers.cookie).token;
        const decoded = jwt.verify(token, process.env.PRIVATE_KEY);
        req.user = decoded;
        next();
    } catch (err) {
        next();
    }
}

module.exports = passAuthorization;