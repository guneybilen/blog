var express = require("express");
// var app = express();

// const parseForm = express.urlencoded({ extended: false });
// express.urlencoded({ extended: false });
// var csrf = require("csurf");
// var csrfProtection = csrf({ cookie: true });
const UserModel = require("../models/user");
const UserController = require("../controllers/userController");
const authorized = require("../authentication/authorized");

module.exports = function (router) {
  router.get("/sign_out", authorized, UserController.sign_out);

  /* GET users listing. */
  router.get("/", function (req, res, next) {
    res.send("respond with a resource");
  });

  router.post("/sign_in", UserController.sign_in);
  router.post("/sign_up", UserController.sign_up);
  router.post("/forgotPassword", UserController.forgotPassword);
  router.post("/resetPassword/:token", UserController.resetPassword);

  router.get("/protected", authorized, (req, res, next) => {
    res.status(200).json({
      logged: true,
      userName: req.userName,
    });
  });
};
