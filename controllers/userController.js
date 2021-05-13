const { cookieMiddleware } = require("../middleWare/");
const UserModel = require("../models/user");
const BlogModel = require("../models/blog");
var mongoose = require("mongoose");
var moment = require("moment");
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
};

module.exports = userController;
