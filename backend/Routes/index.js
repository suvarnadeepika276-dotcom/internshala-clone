const express = require("express");
const router = express.Router();
const admin = require("./admin");
const intern = require("./internship");
const job = require("./job");
const application=require("./application")
const resume = require("./resume");
const language = require("./language");
const forgotPassword = require("./forgotPassword");
const posts = require("./posts");
const friends = require("./friends");

router.use("/admin", admin);
router.use("/internship", intern);
router.use("/job", job);
router.use("/application", application);
router.use("/resume", resume);
router.use("/language", language);
router.use("/auth/forgot-password", forgotPassword);
router.use("/posts", posts);
router.use("/friends", friends);


module.exports = router;