const express = require('express');
const router = express.Router();
const {addLike, removeLike, myLikeList} = require('../controller/LikeController');

router.use(express.json());

router.post('/:id', addLike);
router.delete('/:id', removeLike);
router.get('/', myLikeList);

module.exports = router;