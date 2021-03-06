var mongoose = require("mongoose");
const crypto = require("crypto");
var moment = require("moment");
var validator = require("validator");
const { cookieMiddleware } = require("../middleware/");
const UserModel = require("../models/user");
const BlogModel = require("../models/blog");
const { sendEmailService } = require("../service");
const { forgotPasswordMailService } = require("../service");
const { signupMailService } = require("../service");
const { cookieService } = require("../service");
const { use } = require("passport");
var assert = require("assert");
moment().format();

const USERNAME_LENGTH_MIN = 3;
const USERNAME_LENGTH_MAX = 30;
const PASSWORD_LENGTH_MIN = 8;
const PASSWORD_LENGTH_MAX = 70;

const userController = {
  sign_in: async (req, res, next) => {
    let user = await UserModel.findOne({ email: req.body.email }).exec();

    if (user.status != "Active") {
      return res.status(422).send({
        message: "pending account",
      });
    }

    if (!user) {
      return res.status(401).json({ message: "could not find user" });
    }

    let isValid = user.comparePassword(req.body.password);

    if (!isValid) {
      return res.status(403).json({ message: "incorrect password" });
    }

    if (isValid) {
      const payload = {
        sub: user._id,
        iat: Date.now(),
      };

      cookieService(res, payload);

      res.status(200).json({
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
    let { userName: userNameTemp } = req.body;

    const token = crypto.randomBytes(32).toString("hex");

    let signupConfirmToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    userName = userNameTemp.trimLeft().trimRight().toLowerCase();

    // console.log(req.body);
    if (!validator.isEmail(email)) {
      return res.status(411).send();
    }

    let userForEmail = await UserModel.findOne({ email }).exec();

    if (userForEmail) {
      return res.status(409).send();
    }

    if (
      userName.length < USERNAME_LENGTH_MIN ||
      userName.length > USERNAME_LENGTH_MAX
    ) {
      return res.status(411).send();
    }

    if (password !== passwordConfirm) {
      return res.status(403).send();
    }

    if (
      password.length < PASSWORD_LENGTH_MIN ||
      password.length > PASSWORD_LENGTH_MAX
    ) {
      return res.status(422).send();
    }

    let userForUserName = await UserModel.findOne({ userName }).exec();

    if (userForUserName) {
      return res.status(400).send();
    }

    let userCreated;
    // try {
    userCreated = new UserModel({
      _id: mongoose.Types.ObjectId(),
      email: email,
      password: password,
      userName: userName,
      confirmationCode: signupConfirmToken,
    });

    userCreated.save(function (error) {
      if (error) return console.log(error);
      else console.log("registraion of the user is successfull");
    });

    signupMailService(res, userCreated, signupConfirmToken);
    //   const resetURL = `${process.env.CLIENT_URL}/confirmAccount/${signupConfirmToken}`;
    //   const message = `basak's blog\nTe??ekk??r ederiz.? l??tfen\n${resetURL}\nlinkini kopyal??p taray??c??n??za yap??st??r??n.`;

    //   const messageHTML =
    //     "<br /><br /><h2>basak's blog</h2><h3>Te??ekk??r ederiz. Kay??t i??leminizi tamamlayabilmemiz i??in \
    //   l??tfen <br /><a href=\"" +
    //     resetURL +
    //     `\">${process.env.CLIENT_URL}/confirmAccount/${signupConfirmToken}</a> linkine t??klay??n...</h3>`;

    //   await SendEmail({
    //     email: userCreated.email,
    //     subject: "kay??t i??lemi tamamlama emaili",
    //     message: message,
    //     messageHTML: messageHTML,
    //   });

    //   return res.status(200).json({
    //     logged: false,
    //     message: "pending",
    //   });
    // } catch (error) {
    //   console.log(error.message);
    //   userCreated.confirmationCode = undefined;
    //   userCreated.status = "Pending";
    //   return res.status(500).send();
    // }
  },

  forgotPassword: async (req, res, next) => {
    let user = await UserModel.findOne({ email: req.body.email }).exec();

    if (!user) {
      return res.status(401).json({ message: "could not find user" });
    }

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    forgotPasswordMailService(res, user, resetToken);
    // const resetURL = `${process.env.CLIENT_URL}/resetPassword/${resetToken}`;
    // const message = `basak's blog\n??ifrenizi mi unuttunuz? l??tfen\n${resetURL}\nlinkini kopyal??p taray??c??n??za yap??st??r??n.\n\nG??nderdi??imiz link 10 dakika sonra ge??ersiz olacakt??r.\nE??er bu emaili hata sonucu ald??ysan??z veya ??ifrenizi hat??rlarsan??z\nbu emaili dikkate almay??n??z`;

    // const messageHTML =
    //   "<br /><br /><h2>basak's blog</h2><h3>??ifrenizi mi unuttunuz? \
    //   l??tfen <br /><a href=\"" +
    //   resetURL +
    //   `\">${resetURL}</a> linkine t??klay??n...</h3><h3><br />G??nderdi??imiz link 10 dakika sonra ge??ersiz olacakt??r.
    //   <br /> E??er bu emaili hata sonucu ald??ysan??z veya ??ifrenizi hat??rlarsan??z <br /> bu emaili dikkate almay??n??z</h3>`;

    // try {
    //   await sendEmailService({
    //     email: user.email,
    //     subject: "??ifre s??f??rlama maili 10 dakika ge??erlidir",
    //     message: message,
    //     messageHTML: messageHTML,
    //   });

    //   return res.status(200).json({
    //     message: "password reset token has been sent to your email address",
    //   });
    // } catch (error) {
    //   user.passwordResetToken = undefined;
    //   user.passwordResetExpires = undefined;
    //   await user.save({ validateBeforeSave: false });
    //   return res.status(500).json({
    //     message: "there was an error sending password reset token email",
    //   });
    // }
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

    if (
      password.length < PASSWORD_LENGTH_MIN ||
      password.length > PASSWORD_LENGTH_MAX
    ) {
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
      const expiresIn = 86400000;
      user.password = password;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
      const payload = {
        sub: user._id,
        iat: Date.now(),
      };

      cookieService(res, payload);

      res.status(200).json({
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
    // console.log("signing out - message from userController, sign_out method");
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production" ? true : false,
      sameSite: "lax",
      path: "/",
    });
    req.logout();
    res.json({
      token: "",
      loggedOut: true,
    });
  },

  changeUsername: async (req, res, next) => {
    let { changedName: changedNameTemp } = req.body;
    let { changedNameConfirm: changedNameConfirmTemp } = req.body;

    changedName = changedNameTemp.trimLeft().trimRight().toLowerCase();
    changedNameConfirm = changedNameConfirmTemp
      .trimLeft()
      .trimRight()
      .toLowerCase();

    if (
      changedName.length < USERNAME_LENGTH_MIN ||
      changedName.length > USERNAME_LENGTH_MAX
    ) {
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

    try {
      const filter = { _id: req.userId };
      const update = { userName: changedName };

      // `doc` is the document _before_ `update` was applied
      let doc = await UserModel.findOneAndUpdate(filter, update);

      //retrieve the updated document
      doc = await UserModel.findOne(filter);

      return res.status(200).json({
        message: "username succseesfully changed",
        userName: doc.userName,
      });
    } catch (e) {
      console.log(e.message);
      return res.status(500).json({
        error: e.message,
      });
    }
  },

  ////////////////////////////////////////////////////////////////////////////////////
  //
  //
  // BELOW IS AN EXAMPLE FOR TRANSACTION USAGE FOR MONGODB
  //
  //
  ////////////////////////////////////////////////////////////////////////////////////
  // blog model changed. there is no need for transactions like the one below anymore.
  // changeUsername: async (req, res, next) => {
  //   let { changedName: changedNameTemp } = req.body;
  //   let { changedNameConfirm: changedNameConfirmTemp } = req.body;

  //   changedName = changedNameTemp.trimLeft().trimRight().toLowerCase();
  //   changedNameConfirm = changedNameConfirmTemp
  //     .trimLeft()
  //     .trimRight()
  //     .toLowerCase();

  //   if (
  //     changedName.length < USERNAME_LENGTH_MIN ||
  //     changedName.length > USERNAME_LENGTH_MAX
  //   ) {
  //     return res.status(411).send();
  //   }

  //   if (changedName !== changedNameConfirm) {
  //     return res.status(403).json({
  //       error: "changedName and changedNameConfirm must be equal",
  //     });
  //   }

  //   let userForSearch = await UserModel.findById(req.userId).exec();

  //   if (userForSearch.userName === changedName) {
  //     return res.status(422).send();
  //   }

  //   let userForUserName = await UserModel.findOne({
  //     userName: changedName,
  //   }).exec();

  //   if (userForUserName) {
  //     return res.status(400).send();
  //   }

  //   let user;
  //   let blog;
  //   try {
  //     const session1 = await mongoose.startSession();
  //     await session1.withTransaction(async () => {
  //       user = await UserModel.findOne({
  //         userName: userForSearch.userName,
  //       }).session(session1);
  //       console.log("user ", user);
  //       assert.ok(user.$session());
  //       user.userName = changedName;

  //       blog = await BlogModel.findOne({
  //         blogAuthorId: userForSearch.userName,
  //       }).session(session1);
  //       console.log("blog ", blog);
  //       assert.ok(blog.$session());
  //       blog.author = changedName;
  //       assert.strictEqual(user.userName, blog.author);
  //       await user.save({ validateBeforeSave: false });
  //       await blog.save();
  //       assert.strictEqual(user.userName, blog.author);
  //     });

  //     session1.endSession();
  //     return res.status(200).json({
  //       message: "username succseesfully changed",
  //       userName: changedName,
  //     });
  //   } catch (e) {
  //     console.log(e.message);
  //     return res.status(500).json({
  //       error: e.message,
  //     });
  //   }
  // },

  changePassword: async (req, res, next) => {
    let { password } = req.body;
    let { passwordConfirm } = req.body;

    // console.log("password ", password);

    if (
      password.length < PASSWORD_LENGTH_MIN ||
      password.length > PASSWORD_LENGTH_MAX
    ) {
      return res.status(411).send();
    }

    if (password !== passwordConfirm) {
      return res.status(403).json({
        error: "password and passwordConfirm must be equal",
      });
    }

    try {
      const session = await UserModel.startSession();
      await session.withTransaction(async () => {
        const user = await UserModel.findById(req.userId).session(session);
        assert.ok(user.$session());
        user.passwword = password;
        assert.strictEqual(password, passwordConfirm);
        await user.save();
      });

      session.endSession();
      return res.status(200).json({
        message: "password succseesfully changed",
      });
    } catch (e) {
      console.log(e.message);
      return res.status(500).json({
        error: e.message,
      });
    }
  },

  confirmAccount: async (req, res, next) => {
    //console.log("req.params.token", req.params.token);

    let user = await UserModel.findOne({
      confirmationCode: req.params.token,
    }).exec();
    if (!user) {
      return res.status(404).send();
    }

    try {
      user.status = "Active";
      await user.save();

      const payload = {
        sub: user._id,
        iat: Date.now(),
      };

      cookieService(res, payload);

      res.redirect("/");

      // return res.status(201).json({
      //   userName: user.userName,
      //   logged: true,
      //   message: "success",
      // });
    } catch (error) {
      res.status(500).send({ message: error.message });
    }
  },
};

module.exports = userController;
