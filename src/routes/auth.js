const express = require("express");
const router = express.Router();

const {
  signUp,
  signIn,
  findId,
  passwordResetRequest,
  passwordReset,
  logout,
} = require("../controller/AuthController");
const checkAuthorization = require("../modules/auth/checkAuthorization");

router.use(express.json());

router.post("/signup", signUp);
router.post("/signin", signIn);
router.post("/findid", findId);
router.post("/reset", passwordResetRequest);
router.put("/reset", passwordReset);
router.delete("/logout", checkAuthorization, logout);

module.exports = router;
<<<<<<< HEAD:src/routes/auth.ts
// export default router;
=======
>>>>>>> b08e083 (fix : 오류를 발견하여 잠시 js로 롤백합니다):src/routes/auth.js
