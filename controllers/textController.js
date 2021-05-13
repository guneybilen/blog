const mongoose = require("../mongoose");
const UserModel = require("../models/user");
const BlogModel = require("../models/blog");
// const blogService = require("../service/blogService");
const fs = require("fs");
const { cookieMiddleware } = require("../middleWare/");
var moment = require("moment");
moment().format();

const textController = {
  newBlog: async (req, res) => {
    let blogId = mongoose.Types.ObjectId();

    res.render("newBlog", {
      csrfToken: req.csrfToken(),
      title: "yetenek.club",
      blogId: blogId,
    });
  },

  saveBlog: async (req, res, next) => {
    //let dir = "multer/uploads/images";

    // // NOTICE DUPLICATE CODE.
    // // The Following code is also present
    // // in the routes/blog.js for more caution.
    if (!req.files.photos && req.body.data === "") {
      // Normally code should not reach here.
      // If the code is reaching here, they are
      // trying to bypass the client side check.
      return res.json({ error: "empty body" });
    }

    // console.log("req.user in blogController ", req.user);
    const user = await UserModel.findOne({ userName: res.locals.userName });
    const blog = new BlogModel({
      _id: mongoose.Types.ObjectId(),
      userId: user._id,
      story: req.body.data,
    });

    req.files["photos"].forEach((image) => {
      let obj = {
        fieldname: image.fieldname,
        originalname: image.originalname,
        encoding: image.encoding,
        mimetype: image.mimetype,
        destination: `${req.dir}/${res.locals.userName}/${image["originalname"]}`,
        size: image.size,
      };

      if (blog.images.length >= 4) {
        blog.images.pop();
        count = blog.images.unshift({
          ...obj,
        });
      }
      if (blog.images.length < 4) {
        count = blog.images.unshift({
          ...obj,
        });
      }
    });
    await blog.save();
    res.flash("info", "blog kayit edildi...");
    var redir = {
      redirect: "/getSavedBlog",
    };
    return res.json(redir);
  },

  update: async (req, res, next) => {
    let dir = "./multer/uploads/images";
    // // NOTICE DUPLICATE CODE.
    // // The Following code is also present
    // // in the routes/blog.js for more caution.
    if (!req.files.photos && req.body.data === "") {
      // Normally code should not reach here.
      // If the code is reaching here, they are
      // trying to bypass the client side check.
      return res.json({ error: "empty body" });
    }

    //console.log("req.blogId ", req.blogId);
    //console.log("req.deletedNames ", req.deletedNames);
    // const user = await UserModel.findOne({ userName: req.cookies.kodName });

    // let blog = await BlogModel.findOneAndUpdate(
    //   { _id: req.blogId },
    //   {
    //     $pull: { images: { originalname: req.deletedNames } },
    //   },
    //   { new: true }
    // );
    let blog = await BlogModel.findOneAndUpdate(
      { _id: req.blogId },
      { story: req.body.data },
      { new: true }
    );

    let array = (req.files.photos || []).filter(function (n) {
      return n != undefined;
    });
    console.log("array ", array);
    if (array !== []) {
      array.forEach((image) => {
        let obj = {
          fieldname: image.fieldname,
          originalname: image.originalname,
          encoding: image.encoding,
          mimetype: image.mimetype,
          destination: `${dir}/${res.locals.userName}/${res.locals.user}/${image["originalname"]}`,
          size: image.size,
        };

        if (blog.images.length >= 4) {
          blog.images.pop();
          count = blog.images.unshift({
            ...obj,
          });
        }
        if (blog.images.length < 4) {
          count = blog.images.unshift({
            ...obj,
          });
        }
      });
    }

    await blog.save();
    res.flash("info", "blog kayit edildi...");
    var redir = {
      redirect: "/getSavedBlog",
    };
    return res.json(redir);
  },

  get: async (req, res, next) => {
    let answer = await cookieMiddleware(req, res, req.user);
    if (!answer) {
      res.flash("info", "lutfen giris yapiniz");
      return res.redirect("/");
    }
    return res.render("readBlog", { kodName: res.locals.userName });
  },

  readBlogs: async (req, res) => {
    const blogs = await blogService.verifyRequest(req, res);
    let data = {
      data: blogs,
    };
    return res.render("readBlog", {
      dt: JSON.stringify(data),
      comingFrom: "blogOkuma",
    });
  },

  readBlogsByMe: async (req, res) => {
    const blogs = await blogService.verifyRequestByMe(req, res);
    let data = {
      data: blogs,
    };
    return res.render("readBlog", {
      user: res.locals.user,
      dt: JSON.stringify(data),
      comingFrom: "benimBlogum",
    });
  },

  readBlog: async (req, res) => {
    // console.log("req ", req);
    // console.log("req ", req.query);
    const blog = await BlogModel.findById(req.query.index.toString());
    const user = await UserModel.findOne({ _id: blog.userId });
    // console.log(user._id.toString() === blog.userId.toString());
    // console.log(user);
    console.log(blog);
    console.log(user.userName);
    return res.render("savedBlog", {
      blog: blog,
      user: user.userName,
      owner:
        res.locals.user.toString() === blog.userId.toString() ? true : false,
    });
  },

  paging: async (req, res) => {
    const blogs = await blogService.verifyRequest(req, res);
    let {
      totalDocs,
      limit,
      totalPages,
      page,
      pagingCounter,
      hasPrevPage,
      hasNextPage,
      prevPage,
      nextPage,
    } = blogs;
    // console.log("blogs ", blogs);
    let data = {
      totalDocs,
      limit,
      totalPages,
      page,
      pagingCounter,
      hasPrevPage,
      hasNextPage,
      prevPage,
      nextPage,
    };
    return res.status(200).send(data);
  },

  contact: async (req, res, next) => {
    if (req && req.cookies && req.cookies.kodName) {
      return res.render("contact", {
        // kodName: req.cookies.kodName,
      });
    } else {
      return res.render("contact", {
        signedin: req.cookies.signedin ? req.cookies.signedin : false,
      });
    }
  },

  about: async (req, res, next) => {
    if (req && req.cookies && req.cookies.kodName) {
      return res.render("about", {
        // kodName: req.cookies.kodName,
      });
    } else {
      return res.render("about");
    }
  },

  savedBlog: async (req, res, next) => {
    res.flash("success", "kaydedilen blogunuz...");
    return res.redirect("/savedBlog");
  },
  renderSavedBlog: async (req, res, next) => {
    let blog = await BlogModel.findOne({ userId: res.locals.user })
      .sort({ updatedAt: -1 })
      .exec();
    // console.log("res.locals ", res.locals);
    // console.log("blog ", blog);
    res.render("savedBlog", {
      // kodName: res.locals.user,
      blog: blog,
    });
  },

  deleteImage: async (req, res, next) => {
    try {
      let user = await UserModel.findOneAndUpdate(
        { _id: res.locals.user },
        {
          $pull: { siteImages: { destination: req.body.payload } },
        },
        { new: true }
      ).exec();
      if (req.body.payload !== "undefined") {
        fs.unlink(`admin/${req.body.payload}`, function (err) {
          if (err) {
            throw err;
          } else {
            console.log("Successfully deleted the file.");
          }
        });
        return res.json({
          result: "DELETED",
        });
      } else {
        return res.json({
          result: "NOT_DELETED",
        });
      }
    } catch (e) {
      res.status(400).send(e.message);
    }
  },
  deleteImageForBlog: async (req, res, next) => {
    console.log("req.body.payload ", req.body.payload);
    try {
      let user = await BlogModel.findOneAndUpdate(
        { userId: res.locals.user },
        {
          $pull: { images: { destination: req.body.payload } },
        },
        { new: true }
      ).exec();
      if (req.body.payload !== "undefined") {
        fs.unlink(`${req.body.payload}`, function (err) {
          if (err) {
            throw err;
          } else {
            console.log("Successfully deleted the file.");
          }
        });
        return res.json({
          result: "DELETED",
        });
      } else {
        return res.json({
          result: "NOT_DELETED",
        });
      }
    } catch (e) {
      res.status(400).send(e.message);
    }
  },
};

module.exports = textController;
