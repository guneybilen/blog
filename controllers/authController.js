const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto-random-string");
const moment = require("moment");
const { StatusCodes: HttpStatus } = require("http-status-codes");
const mongoose = require("mongoose");
// const redis = require("@app/redis");
const { userMail } = require("../mail");
const { userService } = require("../service");
const UserModel = require("../models/user");
const signRefreshToken = require("../signRefreshToken");
const { cookieMiddleware } = require("../middleWare/");
var colors = require("colors");

const authController = {
  user: (req, res) => {
    const {
      context: { user, refreshToken },
    } = req;
    // console.log(user);
    return res.status(HttpStatus.OK).json({ user });
  },

  index: async (req, res, next) => {
    try {
      const user = await UserModel.emailExist(req.user.email);
      if (!user) {
        res.flash("warn", `kullanici bulunamadi`);
        return res.redirect("/");
      }

      const comparePassword = await user.comparePassword(req.user.password);
      if (!comparePassword) {
        res.flash("warn", "sifre yanlis");
        return res.redirect("/");
      }

      const decoded = jwt.verify(
        req.cookies.refreshToken,
        process.env.REFRESH_TOKEN_SECRET
      );

      // console.log("decoded ", decoded._id);

      let answer = await cookieMiddleware(req, res, user);
      console.log("answer ", answer);
      if (answer) {
        return next();
      } else {
        throw "continue in authController.index because answer from cookie service was not true";
      }
    } catch (e) {
      res.clearCookie("refreshToken");

      console.log(
        colors.cyan(
          "authController#index - smthg wrong in cookieMiddleware.js",
          e.message
        )
      );
      return res.render("index", {
        title: "yetenek.club",
      });
    }
  },

  signIn: async (req, res) => {
    console.log("req.body ", req.body);
    try {
      const {
        body: { email, password },
      } = req;

      const user = await UserModel.emailExist(email);
      if (!user) {
        res.flash("warn", `kullanici bulunamadi`);
        return res.redirect("/");
      }

      const comparePassword = await user.comparePassword(password);
      if (!comparePassword) {
        res.flash("warn", "sifre yanlis");
        return res.redirect("/");
      }

      // console.log(user);
      let answer = await cookieMiddleware(req, res, user);
      // console.log("answer ", answer);

      if (answer) {
        res.redirect("/getBlogs/1");
      } else {
        console.log(
          "authController#signin - smthg wrong in cookieMiddleware.js"
        );
        throw "continue in authController.index because answer from cookie service was not true";
      }
    } catch (error) {
      return Promise.reject(error).catch((error) => {
        // Will not execute
        console.log("caught in signIn", error.message);
      });
    }
  },

  signUp: async (req, res, next) => {
    // console.log('req ', req);
    try {
      const {
        body: { email, name, password, confirmPassword },
        i18n,
      } = req;

      if (password !== confirmPassword) {
        res.flash("warn", "iki sifre kutusundaki sifreler ayni olmali");
        return res.redirect("/sign-up");
      }
      let user = await UserModel.emailExist(email);
      if (user) {
        res.flash("warn", `${email} sistemde kayitli`);
        return res.redirect("/sign-up");
      }

      let nickName = await UserModel.userNameExist(name);
      if (nickName) {
        res.flash("warn", `${name} kullanici adi kullaniliyor`);
        return res.redirect("/sign-up");
      }

      if (name.length < 3) {
        res.flash("warn", `${name} kod ismi 3 karaterden uzun olmali`);
        return res.redirect("/sign-up");
      }

      const hash = bcrypt.hashSync(password, 10);

      user = await new UserModel({
        _id: new mongoose.Types.ObjectId(),
        email: email,
        password: hash,
        userName: name,
        locale: i18n.language,
      }).save();

      const token = await userService.verifyRequest(user);

      userMail.verifyRequest(user, token);

      cookieMiddleware(req, res, user);

      res.redirect("http://localhost:3000");
    } catch (error) {
      console.log(error);
      return Promise.reject(error).catch((error) => {
        // Will not execute
        console.log("caught in signup", error.message);
      });
    }
  },

  logout: async (req, res) => {
    try {
      res.cookie("refreshToken", "", { maxAge: 1 });
      res.redirect("/");

      //return res.status(HttpStatus.OK).json({ succeed: true });
      return res.render("index");
    } catch (error) {
      return Promise.reject(error).catch((error) => {
        // Will not execute
        console.log("caught in logout", error.message);
      });
    }
  },

  verifyRequest: async (req, res) => {
    try {
      const {
        context: { user },
      } = req;

      const token = await userService.verifyRequest(user);

      userMail.verifyRequest(user, token);

      return res.status(HttpStatus.OK).json({ succeed: true });
    } catch (error) {
      return Promise.reject(error).catch((error) => {
        // Will not execute
        console.log("caught in verifyRequest", error.message);
      });
    }
  },

  verify: async (req, res) => {
    try {
      const {
        body: { token },
      } = req;

      const user = await UserModel.findOne({
        "account.verification.token": token,
      });
      if (!user) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ error: "Access Token is not valid or has expired." });
      }

      user.set({
        account: {
          verification: {
            verified: true,
            token: null,
            expiresIn: null,
          },
        },
      });

      await user.save();

      const accessToken = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        {
          expiresIn: process.env.JWT_EXPIRATION,
        }
      );

      userMail.verify(user);

      return res.status(HttpStatus.OK).json({ accessToken });
    } catch (error) {
      return Promise.reject(error).catch((error) => {
        // Will not execute
        console.log("caught in verify", error.message);
      });
    }
  },

  resetPassword: async (req, res) => {
    try {
      const {
        body: { email },
      } = req;

      const user = await UserModel.findOne({ email });
      if (!user) {
        // return res
        //   .status(HttpStatus.BAD_REQUEST)
        //   .json({ error: 'User not found.' });
        res.flash("warn", `kullanici bulunamadi`);
        return res.redirect("/");
      }

      const token = crypto({ length: 48, type: "url-safe" });
      const expiresIn = moment().add(7, "days");

      user.set({
        account: {
          resetPassword: {
            token,
            expiresIn,
          },
        },
      });

      await user.save();

      userMail.resetPassword(user, token);

      return res.status(HttpStatus.OK).json({ succeed: true });
    } catch (error) {
      return Promise.reject(error).catch((error) => {
        // Will not execute
        console.log("caught in resetPassword", error.message);
      });
    }
  },

  newPassword: async (req, res) => {
    try {
      const {
        body: { token, newPassword },
      } = req;

      const user = await UserModel.findOne({
        "account.resetPassword.token": token,
      });
      if (!user) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ error: "Access Token is not valid or has expired." });
      }

      const hash = bcrypt.hashSync(newPassword, 10);

      user.set({
        password: hash,
        account: {
          resetPassword: {
            token: null,
            expiresIn: null,
          },
        },
      });

      await user.save();

      const accessToken = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        {
          expiresIn: process.env.JWT_EXPIRATION,
        }
      );

      return res.status(HttpStatus.OK).json({ accessToken });
    } catch (error) {
      return Promise.reject(error).catch((error) => {
        // Will not execute
        console.log("caught in newPassword", error.message);
      });
    }
  },

  changePassword: async (req, res) => {
    try {
      const {
        body: { currentPassword, newPassword },
        context: { user },
      } = req;

      const comparePassword = await user.comparePassword(currentPassword);
      if (!comparePassword) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ error: "Current password is incorrect." });
      }

      const hash = bcrypt.hashSync(newPassword, 10);

      user.set({ password: hash });

      await user.save();

      return res.status(HttpStatus.OK).json({ succeed: true });
    } catch (error) {
      return Promise.reject(error).catch((error) => {
        // Will not execute
        console.log("caught in changePassword", error.message);
      });
    }
  },

  updateUser: async (req, res) => {
    try {
      const {
        body: { email, firstName, lastName },
        context: { user },
      } = req;

      let {
          account: {
            verification: { verified },
          },
        } = user,
        verifyRequest = false;

      if (user.email !== email) {
        const userExist = await UserModel.findOne({ email });
        if (userExist) {
          return res
            .status(HttpStatus.BAD_REQUEST)
            .json({ error: "Email has already been taken." });
        }
        verified = false;
        verifyRequest = true;
      }

      user.set({
        email,
        firstName,
        lastName,
        account: {
          verification: {
            verified,
          },
        },
      });

      await user.save();

      if (verifyRequest) {
        const token = await userService.verifyRequest(user);

        userMail.verifyRequest(user, token);
      }

      return res.status(HttpStatus.OK).json({ user });
    } catch (error) {
      return Promise.reject(error).catch((error) => {
        // Will not execute
        console.log("caught in updateUser", error.message);
      });
    }
  },

  switchLocale: async (req, res) => {
    try {
      const {
        body: { locale },
        context: { user },
      } = req;

      user.set({ locale });

      await user.save();

      return res.status(HttpStatus.OK).json({ user });
    } catch (error) {
      return Promise.reject(error).catch((error) => {
        // Will not execute
        console.log("caught in switchLocale", error.message);
      });
    }
  },
};

module.exports = authController;
