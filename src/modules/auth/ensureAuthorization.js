const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');  // dotenv 모듈
dotenv.config();

const ensureAuthorization = (req, res) => {
    try {
        const receivedjwt = req.headers['authorization'];
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