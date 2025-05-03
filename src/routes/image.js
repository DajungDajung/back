const express = require('express');
const router = express.Router();
const multer  = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const { uploadImage } = require('../controller/ImageController');

router.use(express.json());

router.route("/")
    .post(upload.single('file'),uploadImage)

module.exports = router;