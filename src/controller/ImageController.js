const fs   = require('fs');
const path = require('path');
const { StatusCodes } = require('http-status-codes');
const db   = require('../mariadb.js');

const uploadImage = (req, res) => {
    try {
        if (!req.file || !req.file.buffer) {
            return res.status(400).json({ message: '이미지 파일이 필요합니다.' });
        }
        const uploadDir = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
        const filename = `${Date.now()}_${req.file.originalname}`;
        const filepath = path.join(uploadDir, filename);
        fs.writeFileSync(filepath, req.file.buffer);

        const sql = 'INSERT INTO images (url) VALUES (?)';
        const value = `${req.protocol}://${req.get('host')}/uploads/${filename}`;

        db.query(sql, value,(err, results) => {
            if (err) {
                console.error(err);
                return res.status(StatusCodes.BAD_REQUEST).json({ message: "DB 오류가 발생했습니다." });
            }
            return res.status(StatusCodes.CREATED).json({ id: results.insertId, url: value });
            });

    } catch (err) {
        console.error(err);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: '이미지 업로드 실패' });
    }
}

module.exports = { uploadImage };
