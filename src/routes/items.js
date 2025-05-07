const express = require('express');
const router = express.Router();
const { getItems, getItemDetail, postItem, updateItem, deleteItem, getMyItems, getLikedItems } = require('../controller/ItemController.js');
const checkAuthorization = require('../modules/auth/checkAuthorization.js');
const checkItemOwner = require('../modules/auth/checkItemOwner.js');
const passAuthorization = require('../modules/auth/passAuthorization.js');

// 상품 전체 조회 및 상품 검색 && 상품 등록
router.route('/')
    .get(getItems)
    .post(checkAuthorization, postItem);

router.route('/myitem')
    .get(checkAuthorization, getMyItems);

// 상품 상세 정보 조회 && 상품 수정 && 상품 삭제
router.route(`/:id(\\d+)`)
    .get(passAuthorization, getItemDetail)
    .put(checkAuthorization, checkItemOwner, updateItem)
    .delete(checkAuthorization, checkItemOwner, deleteItem);


module.exports = router;