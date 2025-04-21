const express = require('express');
const router = express.Router();
const { getItems, getItemDetail, postItem, updateItem, deleteItem } = require('../controller/ItemContoller.js');

// 상품 전체 조회 및 상품 검색 && 상품 등록
router.route('/')
    .get(getItems)
    .post(postItem);

// 상품 상세 정보 조회 && 상품 수정 && 상품 삭제
router.route('/:id')
    .get(getItemDetail)
    .put(updateItem)
    .delete(deleteItem);

module.exports = router;