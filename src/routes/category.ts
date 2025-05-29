const express = require("express");
const router = express.Router();
import { getCategory } from "../controller/ItemController";

router.get('/',getCategory)

module.exports = router;
