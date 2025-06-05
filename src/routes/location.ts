import express from "express";
const router = express.Router();

const {
  getLocation,
  addLocation,
  updateLocation,
} = require("../controller/LocationController");

router.route("/").post(addLocation).put(updateLocation);

router.route("/:id").get(getLocation);

module.exports = router;