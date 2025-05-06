const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');  // dotenv 모듈
const parseCookies = require('./parseCookies');
dotenv.config();

const ensureAuthorization = (req, res) => {
    try {
        const cookies = parseCookies(req.headers.cookie);
        const receivedjwt = cookies.token;
        
        if(receivedjwt) {
            const decodedjwt = jwt.verify(receivedjwt, process.env.PRIVATE_KEY);
            return decodedjwt;
        }

        else {
            throw new ReferenceError('jwt must be provided');
        }
    }
    catch (err) {
        console.log(err.name);
        console.log(err.message);

        return err;
    }
}

module.exports = ensureAuthorization;