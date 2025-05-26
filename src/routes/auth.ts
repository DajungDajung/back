import express from "express";

import {
  signUp,
  signIn,
  findId,
  passwordResetRequest,
  passwordReset,
  logout,
} from "../controller/AuthController";
const checkAuthorization = require("../modules/auth/checkAuthorization");

const router = express.Router();

router.use(express.json());

router.post("/signup", signUp);
router.post("/signin", signIn);
router.post("/findid", findId);
router.post("/reset", passwordResetRequest);
router.put("/reset", passwordReset);
router.delete("/logout", checkAuthorization, logout);

module.exports = router;
// export default router;