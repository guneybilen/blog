var mongoose = require("mongoose");
const crypto = require("crypto");
var moment = require("moment");
const jwt = require("jsonwebtoken");
var validator = require("validator");
const { cookieMiddleware } = require("../middleWare/");
const UserModel = require("../models/user");
const BlogModel = require("../models/blog");
const { user } = require("./authController");
const SendEmail = require("../service/nodemailer");
const { use } = require("passport");
var assert = require("assert");
moment().format();

const userController = {
  ////////////////////////////////////////////////////////////////////////////////
  //
  //
  //
  // AFTER REACT.JS
  //
  //
  ////////////////////////////////////////////////////////////////////////////////

  sign_in: async (req, res, next) => {
    // console.log(req.body);
    let user = await UserModel.findOne({ email: req.body.email }).exec();

    // console.log("user ", user);
    // .then((user) => {
    if (!user) {
      return res.status(401).json({ message: "could not find user" });
    }

    // Function defined at bottom of app.js
    let isValid = user.comparePassword(req.body.password);

    if (!isValid) {
      return res.status(403).json({ message: "incorrect password" });
    }
    const expiresIn = 86400000;

    if (isValid) {
      const payload = {
        sub: user._id,
        iat: Date.now(),
      };
      // console.log(process.env.SECRETORKEY);
      const token = jwt.sign(payload, process.env.SECRETORKEY, {
        expiresIn: expiresIn,
      });

      const expiration = Date.now() + 86400000;

      res.status(200).json({
        token: "Bearer " + token,
        expires: expiration,
        userName: user.userName,
        error: "",
        logged: true,
      });
    } else {
      res.status(401).json({ message: "you entered the wrong password" });
    }
  },

  sign_up: async (req, res, next) => {
    let { email } = req.body;
    let { password } = req.body;
    let { passwordConfirm } = req.body;
    let { userName } = req.body;

    // console.log(req.body);
    if (!validator.isEmail(email)) {
      return res.status(411).send();
    }

    let userForEmail = await UserModel.findOne({ email }).exec();

    if (userForEmail) {
      return res.status(409).send();
    }

    if (userName.length < 3 || userName.length > 30) {
      return res.status(411).send();
    }

    if (password !== passwordConfirm) {
      return res.status(403).send();
    }

    if (password.length < 8 || password.length > 30) {
      return res.status(422).send();
    }

    let userForUserName = await UserModel.findOne({ userName }).exec();

    if (userForUserName) {
      return res.status(400).send();
    }

    try {
      let userCreated = new UserModel({
        _id: mongoose.Types.ObjectId(),
        email: email,
        password: password,
        userName: userName,
      });

      userCreated.save(function (error) {
        if (error) return console.log(error);
        else console.log("registraion of the user is successfull");
      });
      const expiresIn = 86400000;

      const payload = {
        sub: userCreated._id,
        iat: Date.now(),
      };
      // console.log(process.env.SECRETORKEY);
      const token = jwt.sign(payload, process.env.SECRETORKEY, {
        expiresIn: expiresIn,
      });
      const expiration = Date.now() + 86400000;
      return res.status(200).json({
        token: "Bearer " + token,
        expires: expiration,
        userName: userCreated.userName,
        logged: true,
      });
    } catch (error) {
      console.log(error.message);
      return res.status(500).send();
    }
  },

  forgotPassword: async (req, res, next) => {
    // console.log(req.body);
    let user = await UserModel.findOne({ email: req.body.email }).exec();

    // console.log("user ", user);
    // .then((user) => {
    if (!user) {
      return res.status(401).json({ message: "could not find user" });
    }

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });
    // const resetURL = `${req.protocol}://${req.get(
    //   "host"
    // )}/resetPassword/${resetToken}`;

    const resetURL = `${process.env.CLIENT_URL}/resetPassword/${resetToken}`;
    const message = `basak's blog\nşifrenizi mi unuttunuz? lütfen\n${resetURL}\nlinkini kopyalıp tarayıcınıza yapıstırın.\n\nGönderdiğimiz link 10 dakika sonra geçersiz olacaktır.\nEğer bu emaili hata sonucu aldıysanız veya şifrenizi hatırlarsanız\nbu emaili dikkate almayınız`;

    const messageHTML =
      "<br /><br /><h2>basak's blog</h2><h3>şifrenizi mi unuttunuz? \
      lütfen <br /><a href=\"" +
      resetURL +
      `\">${resetURL}</a> linkine tıklayın...</h3><h3><br />Gönderdiğimiz link 10 dakika sonra geçersiz olacaktır.
      <br /> Eğer bu emaili hata sonucu aldıysanız veya şifrenizi hatırlarsanız <br /> bu emaili dikkate almayınız</h3>`;

    // options.html =
    //   "To reset your password, click this <a href='" +
    //   resetUrl +
    //   "'><span>link</span></a>.<br>This is a <b>test</b> email.";

    try {
      await SendEmail({
        email: user.email,
        subject: "şifre sıfırlama maili 10 dakika geçerlidir",
        message: message,
        messageHTML: messageHTML,
      });

      return res.status(200).json({
        message: "password reset token has been sent to your email address",
      });
    } catch (error) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({
        message: "there was an error sending password reset token email",
      });
    }
  },

  resetPassword: async (req, res, next) => {
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await UserModel.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    }).exec();
    if (!user) {
      return res.status(401).json({ message: "token is invalid or expired" });
    }
    let password = req.body.password;
    let passwordConfirm = req.body.passwordConfirm;

    if (password.length < 8 || password.length > 30) {
      return res.status(422).json({
        message:
          "password can not be less than 8 characters or longer than 30 characters",
      });
    }

    if (password !== passwordConfirm) {
      return res.status(403).json({
        message: "password and password confirmation must be equal",
      });
    }

    try {
      // console.log("user", user.email);
      const expiresIn = 86400000;
      user.password = password;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
      const payload = {
        sub: user._id,
        iat: Date.now(),
      };
      // console.log(process.env.SECRETORKEY);
      const token = jwt.sign(payload, process.env.SECRETORKEY, {
        expiresIn: expiresIn,
      });
      const expiration = Date.now() + 86400000;

      res.status(200).json({
        token: "Bearer " + token,
        expires: expiration,
        userName: user.userName,
        error: "",
        logged: true,
      });
    } catch (error) {
      console.log("resetPassword error in userController: ", error.message);
      res.status(500).json({
        message: "a problem occurred and we could log you in",
      });
    }
  },

  sign_out: (req, res, next) => {
    console.log("signing out - message from userController, sign_out method");
    req.logout();
    res.json({
      token: "",
      loggedOut: true,
    });
  },

  changeUsername: async (req, res, next) => {
    let { changedName } = req.body;
    let { changedNameConfirm } = req.body;

    if (changedName.length < 3 || changedName.length > 30) {
      return res.status(411).send();
    }

    if (changedName !== changedNameConfirm) {
      return res.status(403).json({
        error: "changedName and changedNameConfirm must be equal",
      });
    }

    let userForSearch = await UserModel.findById(req.userId).exec();

    if (userForSearch.userName === changedName) {
      return res.status(422).send();
    }

    let userForUserName = await UserModel.findOne({
      userName: changedName,
    }).exec();

    if (userForUserName) {
      return res.status(400).send();
    }

    let user;
    let blog;
    try {
      const session1 = await mongoose.startSession();
      await session1.withTransaction(async () => {
        user = await UserModel.findOne({
          userName: userForSearch.userName,
        }).session(session1);
        assert.ok(user.$session());
        user.userName = changedName;

        blog = await BlogModel.findOne({
          author: userForSearch.userName,
        }).session(session1);
        assert.ok(blog.$session());
        blog.author = changedName;
        assert.strictEqual(user.userName, blog.author);
        await user.save({ validateBeforeSave: false });
        await blog.save();
        assert.strictEqual(user.userName, blog.author);
      });

      session1.endSession();
      return res.status(200).json({
        message: "username succseesfully changed",
        userName: changedName,
      });
    } catch (e) {
      console.log(e.message);
      return res.status(500).json({
        error: e.message,
      });
    }
  },
};

module.exports = userController;
