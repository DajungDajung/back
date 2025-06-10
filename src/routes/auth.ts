const express = require("express");
const router = express.Router();

const {
  signUp,
  signIn,
  findId,
  passwordResetRequest,
  passwordReset,
  logout,
  kakao,
  kakaoCallback,
  google,
  googleCallback,
  naver,
  naverCallback,
} = require("../controller/AuthController");
const checkAuthorization = require("../modules/auth/checkAuthorization");

router.use(express.json());

router.post("/signup", signUp);
router.post("/signin", signIn);
router.post("/findid", findId);
router.post("/reset", passwordResetRequest);
router.put("/reset", passwordReset);
router.delete("/logout", checkAuthorization, logout);
router.get("/kakao", kakao);
router.get("/kakao/callback", kakaoCallback);
router.get("/google", google);
router.get("/google/callback", googleCallback);
router.get("/naver", naver);
router.get("/naver/callback", naverCallback);
module.exports = router;
