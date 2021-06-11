var mongoose = require("mongoose");
var moment = require("moment");
const jwt = require("jsonwebtoken");
var validator = require("validator");
const { cookieMiddleware } = require("../middleWare/");
const UserModel = require("../models/user");
const BlogModel = require("../models/blog");
const { user } = require("./authController");
moment().format();

const userController = {
  editAbout: async (req, res, next) => {
    try {
      let user = await UserModel.findById(res.locals.user).exec();
      //console.log(user);

      if (
        res.locals.userName === "basak" &&
        user.userName === "basak" &&
        req.path.split(/\//)[1] === "editAbout"
      ) {
        res.render("newAbout", {
          csrfToken: req.csrfToken(),
          ourStory: user["ourStory"],
          user: user["siteImages"].reverse(),
        });
      }
    } catch (e) {
      console.log(e.message);
      res.redirect("/");
    }
  },

  editBlog: async (req, res) => {
    try {
      let user = await UserModel.findById(res.locals.user).exec();

      let blog = await BlogModel.findOne({
        _id: req.params.blogId,
      }).exec();

      if (blog != undefined && user._id.toString() === blog.userId.toString()) {
        res.render("editBlog", {
          csrfToken: req.csrfToken(),
          title: "yetenek.club",
          blog: blog,
        });
      } else {
        res.render("editBlog", {
          csrfToken: req.csrfToken(),
          title: "yetenek.club",
          blog: false,
        });
      }
    } catch (e) {
      console.log(e.message);
    }
  },

  saveWebSiteInfoText: async (req, res, next) => {
    let user = await UserModel.findOneAndUpdate(
      { _id: res.locals.user },
      { ourStory: req.body.post },
      { new: true }
    );

    await user.save();
    return res.status(201).json({ saved: true });
  },

  saveBlogText: async (req, res, next) => {
    let blog = await BlogModel.findOneAndUpdate(
      { userId: res.locals.user },
      { story: req.body.post },
      { new: true }
    );

    await blog.save();
    return res.status(201).json({ saved: true });
  },

  imagePlacement: async (req, res, next) => {
    console.log("req.body ", req.body);
    let dir =
      req.body.comingFrom === "newAbout" ? "/websiteImages" : "/uploads/images";

    // // NOTICE DUPLICATE CODE.
    // // The Following code is also present
    // // in the routes/user.js for more caution.
    if (!req.file.photo && req.body.data === "") {
      // Normally code should not reach here.
      // If the code is reaching here, they are
      // trying to bypass the client side check.
      return res.json({ error: "empty body" });
    }

    let user = await UserModel.findById({ _id: req.userId });

    let obj = {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      encoding: req.file.encoding,
      mimetype: req.file.mimetype,
      destination: `${dir}/${res.locals.userName}/${req.taym}_${req.file.originalname}`,
      size: req.file.size,
    };
    if (user.siteImages.length >= 4) {
      user.siteImages.pop();
      count = user.siteImages.unshift({
        ...obj,
      });
    }
    if (user.siteImages.length < 4) {
      count = user.siteImages.unshift({
        ...obj,
      });
    }

    await user.save();
    return res
      .status(201)
      .json({ saved: obj.destination, user: user.siteImages });
  },

  imagePlacementForBlog: async (req, res, next) => {
    console.log("req.body ", req.body);
    // // NOTICE DUPLICATE CODE.
    // // The Following code is also present
    // // in the routes/user.js for more caution.
    if (!req.file.photo && req.body.data === "") {
      // Normally code should not reach here.
      // If the code is reaching here, they are
      // trying to bypass the client side check.
      return res.json({ error: "empty body" });
    }

    let blog;

    blog = await BlogModel.findById(req.blogId);

    if (!blog) {
      blog = new BlogModel({
        _id: req.blogId,
        userId: res.locals.user,
      });
    }

    let obj = {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      encoding: req.file.encoding,
      mimetype: req.file.mimetype,
      destination: `${req.dir}/${res.locals.userName}_${req.blogId}/${req.taym}_${req.file.originalname}`,
      size: req.file.size,
    };

    if (blog.images.length >= 4) {
      blog.images.pop();
      count = user.siteImages.unshift({
        ...obj,
      });
    }

    if (blog.images.length < 4) {
      count = blog.images.unshift({
        ...obj,
      });
    }

    await blog.save();
    let data = {
      saved: obj.destination,
      blog: blog.images.reverse(),
    };

    console.log(data);
    return res.status(201).json(data);
  },

  renderSavedAbout: async (req, res, next) => {
    let user = await UserModel.findById(res.locals.user).exec();

    res.render("about", {
      // user: res.locals.userName,
      ourStory: user["ourStory"],
      images: user["siteImages"].reverse(),
    });
  },

  renderAbout: async (req, res, next) => {
    let user = await UserModel.findOne({ userName: "basak" }).exec();

    res.render("about", {
      ourStory: user["ourStory"],
      user: user.userName === "basak" ? "basak" : false,
      images: user["siteImages"].reverse(),
    });
  },

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
      return res
        .status(401)
        .json({ success: false, msg: "could not find user" });
    }

    // Function defined at bottom of app.js
    let isValid = user.comparePassword(req.body.password);

    if (!isValid) {
      return res
        .status(403)
        .json({ success: false, msg: "incorrect password" });
    }
    const expiresIn = "1d";

    if (isValid) {
      const payload = {
        sub: user._id,
        iat: Date.now(),
      };
      // console.log(process.env.SECRETORKEY);
      const token = jwt.sign(payload, process.env.SECRETORKEY, {
        expiresIn: expiresIn,
      });

      res.status(200).json({
        success: true,
        token: "Bearer " + token,
        expires: expiresIn,
        userName: user.userName,
        error: "",
        logged: true,
      });
    } else {
      res
        .status(401)
        .json({ success: false, msg: "you entered the wrong password" });
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
    if (userName.length < 3 || userName.length > 20) {
      return res.status(411).send();
    }

    if (password !== passwordConfirm) {
      return res.status(403).send();
    }

    let userForEmail = await UserModel.findOne({ email }).exec();

    if (userForEmail) {
      return res.status(409).send();
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
      const expiresIn = "1d";

      const payload = {
        sub: userCreated._id,
        iat: Date.now(),
      };
      // console.log(process.env.SECRETORKEY);
      const token = jwt.sign(payload, process.env.SECRETORKEY, {
        expiresIn: expiresIn,
      });

      return res.status(200).json({
        success: true,
        token: "Bearer " + token,
        expires: expiresIn,
        userName: userCreated.userName,
      });
    } catch (error) {
      console.log(error.message);
      return res.status(500).send();
    }
  },

  sign_out: (req, res, next) => {
    console.log("signing out - message from userController, sign_out method");
    req.logout();
    res.json({
      token: "",
      success: true,
      loggedOut: true,
    });
  },
};

module.exports = userController;
