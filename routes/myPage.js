const express = require('express');
const router = express.Router();
const {getMyPage, updateMyPage, getUserInfo, getToken} = require('../controller/MyPageController');

router.use(express.json());

router.
    route('/mypage')
        .get(getMyPage)
        .put(updateMyPage);

router.get('/token', getToken);
router.get('/others', getUserInfo);

module.exports = router;