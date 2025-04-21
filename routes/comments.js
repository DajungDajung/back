const express = require('express');
const router = express.Router();
const {addComment, removeComment, commentList} = require('../controller/CommentController');

router.use(express.json());

router.post('/:id', addComment);
router.delete('/:id', removeComment);
router.get('/:id', commentList);

module.exports = router;