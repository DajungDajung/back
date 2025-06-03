import express = require("express");
const router = express.Router();
const { getUserInfo } = require("../controller/StoreController");

router.get("/:id", getUserInfo);

module.exports = router;
