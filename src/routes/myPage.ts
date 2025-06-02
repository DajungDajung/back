import express = require("express");
const router = express.Router();
const {
  getMyPage,
  updateMyPage,
  deleteUser,
} = require("../controller/MyPageController");

router.use(express.json());

router.route("/mypage").get(getMyPage).put(updateMyPage).delete(deleteUser);

module.exports = router;
