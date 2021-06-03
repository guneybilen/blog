const { authMiddleware: middleware } = require("../middleware");
const { userValidator: validator } = require("../validator");
const { authController: auth } = require("../controllers");
var express = require("express");
var app = express();
// var csrf = require("csurf");
// var csrfProtection = csrf({ cookie: true });
// var parseForm = express.urlencoded({ extended: false });

module.exports = function (router) {
  // router.get("/", csrfProtection, function (req, res, next) {
  //   console.log(req.csrfToken());
  //   res.render("/", { csrfToken: req.csrfToken() });
  // });

  router.get("/userError", async function (req, res, next) {
    res.render("pages/user-error", {
      title: "yetenek.club",
      message:
        "Either you are not a member or there is a connection problem with the database.",
    });
  });

  router.get("/sign-up", function (req, res, next) {
    res.render("sign-up", { title: "yetenek.club" });
  });

  router.get("/users", auth.user);
  router.post("/sign-in", middleware.isGuest, validator.signIn, auth.signIn);
  router.post("/sign-up", middleware.isGuest, validator.signUp, auth.signUp);
  router.post("/logout", auth.logout);
  router.post("/verify-request", middleware.isUnverfied, auth.verifyRequest);
  router.post("/verify", validator.verify, auth.verify);
  router.post(
    "/reset-password",
    middleware.isGuest,
    validator.resetPassword,
    auth.resetPassword
  );
  router.post(
    "/new-password",
    middleware.isGuest,
    validator.newPassword,
    auth.newPassword
  );
  router.post(
    "/change-password",
    validator.changePassword,
    auth.changePassword
  );
  router.post("/update-user", validator.updateUser, auth.updateUser);
  router.post("/switch-locale", validator.switchLocale, auth.switchLocale);
};
