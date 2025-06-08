import express from "express";
const router = express.Router();

const {
  addLocation,
  updateLocation,
} = require("../controller/LocationController");

router.route("/").post(addLocation).put(updateLocation);

module.exports = router;