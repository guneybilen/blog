// var express = require("express");
// var app = express();
// app.use(express.json());
// app.use(express.urlencoded({ extended: false }));
//var csrf = require("csurf");
//var csrfProtection = csrf({ cookie: true });
//var parseForm = express.urlencoded({ extended: false });
const multer = require("multer");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
let dir = "/multer/uploads/images";
var mongoose = require("mongoose");
const passport = require("passport");
const { authMiddleware: middleware } = require("../middleware");
const {
  authController: auth,
  textController: text,
  userController: user,
} = require("../controllers");
const UserModel = require("../models/user");
const BlogModel = require("../models/blog");
const ImageModel = require("../models/image");
const authorized = require("../authentication/authorized");

var storage = multer.memoryStorage();
var store = multer({ storage: storage });

module.exports = function (router) {
  router.post("/recordPost");
  router.get("/author/:kodName/all", text.readBlogsByMe);
  router.get("/author/:kodName/:page", text.readBlogsByMe);
  router.get("/getBlogs/:page", text.readBlogs);
  router.get("/blog", text.readBlog);
  router.get("/getSavedBlog", text.savedBlog);
  router.get("/savedBlog", text.renderSavedBlog);

  router.get("/contact", text.contact);

  // router.get("/form", csrfProtection, function (req, res) {
  //   // res.header("Access-Control-Allow-Origin", "*");

  //   res.send({ csrfToken: req.csrfToken() });
  // });

  router.get("/blogs", async (req, res) => {
    // console.log("req ", req);
    let blogs = await BlogModel.find({})
      .sort([["updatedAt", -1]])
      .populate("userId")
      .exec();
    // let str = req.path.split(/\//);
    // let index = str[2] ? str[2] : 1;
    var options = {
      //   // select: "title body author createdAt updatedAt",
      sort: { date: -1 },
      //   populate: "blogID",
      //   lean: true,
      //   offset: 0,
      limit: 40,
    };

    let images = await ImageModel.paginate({}, options).catch((e) =>
      console.log(e.message)
    );

    // console.log(blogs);
    let data = {
      blogs,
      images,
    };
    // console.log(JSON.stringify(data));
    return res.status(200).json([data]);

    ////////////////////////////////////////////
    /* local file store data/db.json version
    ////////////////////////////////////////////
    let rawdata = fs.readFileSync("data/db.json");
    let result = JSON.parse(rawdata);
    return res.send([result.blogs]);
    */
  });

  router.get("/blogs/:id", authorized, async (req, res) => {
    // console.log(req.params.id);
    let { id } = req.params;
    let blog = await BlogModel.findById(id).populate("userId").exec();
    let images = await ImageModel.find({ blogID: blog._id }).exec();

    // console.log(blog);
    // console.log("req.userId.toString() ", req.userId.toString());
    // console.log("blog.userId.toString() ", blog.userId.toString());
    let sameUser = req.userId.toString() === blog.userId._id.toString();
    if (sameUser) {
      console.log("user passed authorization test");
    } else {
      console.log("user failed authorization test");
    }

    let data = {
      blog,
      images,
      sameUser,
    };
    return res.status(200).json([data]);

    ////////////////////////////////////////////
    /* local file store data/db.json version
    ////////////////////////////////////////////
    let rawdata = fs.readFileSync("data/db.json");
    let result = JSON.parse(rawdata);
    return res.send([result.blogs[req.params.id - 1]]);
    */
  });

  // router.get("/blogs/:id/edit", authorized, async (req, res) => {
  //   console.log("!!!!!!!!!!!!!!!!!!!!!!!");
  //   let { id } = req.params;
  //   let blog = await BlogModel.findById(id).exec();
  //   return res.send([blog]);

  ////////////////////////////////////////////
  /* local file store data/db.json version
    ////////////////////////////////////////////
    let rawdata = fs.readFileSync("data/db.json");
    let result = JSON.parse(rawdata);
    return res.send([result.blogs[req.params.id - 1]]);
     */
  // });

  router.delete("/blogs/:id", authorized, async (req, res) => {
    let { id } = req.params;
    ImageModel.findOneAndRemove({ blogID: id }, function (err, image) {
      if (err) {
        console.log(err.message);
      } else {
        console.log("Removed image : ", image);
      }
    });
    BlogModel.findByIdAndRemove(id, function (err, blog) {
      if (err) {
        console.log(err.message);
      } else {
        console.log("Removed Blog : ", blog);
      }
    });

    res.status(204).send();
  });
  //await BlogModel.findByIdAndRemove(id).exec();
  // res.json(204).send();
  // } catch (error) {
  // console.log(error.message);
  // }
  ////////////////////////////////////////////
  /* local file store data/db.json version
    ////////////////////////////////////////////
    fs.readFile("data/db.json", function (err, data) {
      var json = JSON.parse(data);

      let newJSON = json["blogs"].filter(
        (blog) => blog.id !== parseInt(req.params.id)
      );

      let obj = {
        blogs: newJSON,
      };

      fs.writeFileSync("data/db.json", JSON.stringify(obj)); */
  // });

  // return res.json("ok");
  // });

  var cpUpload = store.fields([{ name: "files", maxCount: 4 }]);
  router.post(
    "/blogs",
    authorized,
    store.array("files", 4),
    async (req, res) => {
      // console.log(req.files);

      if (req.files.length > 4)
        return res.json({ too_many_pictures_at_once: true });

      let user = await UserModel.findById(req.userId).exec();

      let newBlog = new BlogModel({
        _id: mongoose.Types.ObjectId(),
        userId: user._id,
        title: req.body.title,
        body: req.body.body,
        // author: req.body.author,
      });

      let savedBlog = await newBlog.save();

      for (file of req.files) {
        let image = new ImageModel({
          _id: mongoose.Types.ObjectId(),
          blogID: savedBlog._id,
          fieldname: file["fieldname"],
          originalname: file["originalname"],
          encoding: file["encoding"],
          mimetype: file["mimetype"],
          destination: null,
          filename: null,
          path: null,
        });
        sharp(file["buffer"])
          .rotate()
          .resize(200)
          .jpeg({ mozjpeg: true })
          .toBuffer()
          .then((data) => {
            image.data = data;
            image.save();
            //console.log("image compressed and saved to MongoDB");
          })
          .catch((err) => console.log(err));
      }

      //console.log(savedBlog);

      return res.json("ok");

      ////////////////////////////////////////////
      /* local file store data/db.json version
    ////////////////////////////////////////////
    fs.readFile("data/db.json", function (err, data) {
      var json = JSON.parse(data);
      let result = JSON.parse(req.body.body);

      const retrieveValue = (key) =>
        json["blogs"].filter((x) => x[key]).map((x) => x[key])[3];
      let value = retrieveValue("id");

      let newData = {
        title: result.title,
        body: result.body,
        author: result.author,
        id: value + 1,
      };

      json["blogs"].push(newData);
      let dt = JSON.stringify(json);
      console.log(dt);

      fs.writeFileSync("data/db.json", dt);
    });

    return res.json("ok");
    */
    }
  );

  var cpUpload = store.fields([{ name: "files", maxCount: 1 }]);
  router.put(
    "/blogs/:id/edit",
    authorized,
    store.array("files", 1),
    async (req, res) => {
      // console.log(req);
      let { id } = req.params;
      let { body } = req.body;
      let { title } = req.body;

      let user = await UserModel.findById(req.userId).exec();
      let blog = await BlogModel.findById(id).exec();

      if (req.userId.toString() === blog.userId.toString()) {
        console.log("user passed authorization test");
      } else {
        console.log("user failed authorization test");
      }

      BlogModel.findById(id, function (err, blog) {
        if (err) {
          console.log(err);
          return res.status(400).json({ success: false });
        }
        blog.body = body;
        blog.title = title;
        blog.save();
      });

      if (req.files.length === 0) return res.json({ no_image_action: true });
      if (req.files.length > 1)
        return res.json({ too_many_pictures_at_once: true });

      let images = await ImageModel.find({ blogID: id }).exec();

      if (images.length > 3) {
        ImageModel.findOne({ blogID: id })
          .sort({ created_at: 1 })
          .exec(function (error, image) {
            if (error) console.log("error ", error);
            else {
              ImageModel.findByIdAndRemove(image._id, function (error, image) {
                if (error) console.log("error ", error);
                else console.log("image deleted");
              });
            }
          });
      }

      for (file of req.files) {
        let image = new ImageModel({
          _id: mongoose.Types.ObjectId(),
          blogID: id,
          fieldname: file["fieldname"],
          originalname: file["originalname"],
          encoding: file["encoding"],
          mimetype: file["mimetype"],
          destination: null,
          filename: null,
          path: null,
        });
        sharp(file["buffer"])
          .rotate()
          .resize(200)
          .jpeg({ mozjpeg: true })
          .toBuffer()
          .then((data) => {
            image.data = data;
            image.save();
            //console.log("image compressed and saved to MongoDB");
          })
          .catch((err) => console.log(err));
      }

      //console.log(savedBlog);

      return res.json("ok");
    }
  );

  // router.put("/blogs/:id/edit", authorized, async (req, res) => {
  //   console.log("req.body ", req.body);
  //   let { id } = req.params;
  //   let blog = await BlogModel.findById(id).exec();
  //   console.log("req.userId.toString() ", req.userId.toString());
  //   console.log("blog.userId.toString() ", blog.userId.toString());
  //   if (req.userId.toString() === blog.userId.toString()) {
  //     console.log("user passed authorization test");
  //     return;
  //   }
  //   return res.status(201).json([blog]);
  ////////////////////////////////////////////
  /* local file store data/db.json version
    ////////////////////////////////////////////
    fs.readFile("data/db.json", function (err, data) {
      var json = JSON.parse(data);

      let newJSON = json["blogs"].filter(
        (blog) => blog.id !== parseInt(req.params.id)
      );

      let obj = {
        blogs: newJSON,
      };

      let newData = {
        title: req.body.title,
        body: req.body.body,
        author: req.body.author,
        id: parseInt(req.params.id),
      };

      obj["blogs"].push(newData);

      fs.writeFileSync("data/db.json", JSON.stringify(obj));
    });

    return res.json("ok");
    */ ////////////////////////////////////////////////////////////
  // });
};
