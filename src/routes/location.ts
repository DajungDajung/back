import express from "express";
const router = express.Router();

const {
  getLocation,
  addLocation,
  updateLocation,
} = require("../controller/LocationController");

router.route("/").get(getLocation).post(addLocation).put(updateLocation);

module.exports = router;