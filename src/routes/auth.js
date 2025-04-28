const express = require("express");
const router = express.Router();

const {
  signUp,
  signIn,
  findId,
  passwordResetRequest,
  passwordReset,
} = require("../../controller/AuthController");

router.use(express.json());

router.post("/signup", signUp);
router.post("/signin", signIn);
router.post("/findid", findId);
router.post("/reset", passwordResetRequest);
router.put("/reset", passwordReset);

module.exports = router;
