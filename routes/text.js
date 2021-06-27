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
const UserModel = require("../models/user");
const BlogModel = require("../models/blog");
const ImageModel = require("../models/image");
const authorized = require("../authentication/authorized");

var storage = multer.memoryStorage();
var store = multer({ storage: storage });

const TITLE_LENGTH_MIN = 1;
const TITLE_LENGTH_MAX = 100;
const BODY_LENGTH_MIN = 1;
const BODY_LENGTH_MAX = 10000;
const MAX_PICTURE_UPLOAD = 4;
const BLOG_IMAGE_COUNT = 3;

var options = {
  sort: { date: -1 },
  populate: "imageId",
  lean: true,
  limit: 10,
  sort: { updatedAt: -1 },
};
module.exports = function (router) {
  router.get("/blogs", async (req, res) => {
    let data = await BlogModel.paginate({}, options);

    // let data = {
    //   blogs,
    //   // images,
    // };
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
    // console.log(req);
    let { id } = req.params;
    let blog = await BlogModel.findById(id).populate("imageId").exec();
    let user = await UserModel.findById(req.userId);

    let sameUser = user.userName === blog.author;
    if (sameUser) {
      console.log("user passed authorization test");
    } else {
      console.log("user failed authorization test");
    }

    let data = {
      blog,
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
      let { body } = req.body;
      let { title } = req.body;
      if (title.length < TITLE_LENGTH_MIN || title.length > TITLE_LENGTH_MAX)
        return res.json({ title_too_short_or_long: true });

      if (body.length < BODY_LENGTH_MIN || body.length > BODY_LENGTH_MAX)
        return res.json({ body_too_short_or_long: true });

      if (req.files.length > MAX_PICTURE_UPLOAD)
        return res.json({ too_many_pictures_at_once: true });

      let user = await UserModel.findById(req.userId).exec();

      let newBlog = new BlogModel({
        _id: mongoose.Types.ObjectId(),
        // userId: user._id,
        title: title,
        author: user.userName,
        email: user.email,
        body: body,
        // author: req.body.author,
      });

      // let savedBlog = await newBlog.save();

      user.blogId = newBlog._id;
      await user.save({ validateBeforeSave: false });

      for (file of req.files) {
        let image = new ImageModel({
          _id: mongoose.Types.ObjectId(),
          blogID: newBlog._id,
          fieldname: file["fieldname"],
          originalname: file["originalname"],
          encoding: file["encoding"],
          mimetype: file["mimetype"],
        });
        newBlog.imageId.push(image.id);
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

      await newBlog.save();

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

      if (title.length < TITLE_LENGTH_MIN || title.length > TITLE_LENGTH_MAX)
        return res.json({ title_too_short_or_long: true });

      if (body.length < BODY_LENGTH_MIN || body.length > BODY_LENGTH_MAX)
        return res.json({ body_too_short_or_long: true });

      let user = await UserModel.findById(req.userId).exec();
      let blog = await BlogModel.findById(id).exec();

      let sameUser = user.userName === blog.author;
      if (sameUser) {
        console.log("user passed authorization test");
      } else {
        console.log("user failed authorization test");
      }

      blog.body = body;
      blog.title = title;
      await blog.save();

      if (req.files.length === 0) return res.json({ no_image_action: true });
      if (req.files.length > 1)
        return res.json({ too_many_pictures_at_once: true });

      let imageIds = blog.imageId;

      if (blog.imageId.length > BLOG_IMAGE_COUNT) {
        ImageModel.find({ _id: imageIds })
          .sort({ created_at: 1 })
          .limit(1)
          .exec(function (error, image) {
            if (error) console.log("error ", error);
            else {
              // console.log("image ", image[0]._id);
              let images = imageIds.filter(
                (img) => img.toString() !== image[0]._id.toString()
              );
              // console.log("images ", images);
              blog.imageId = images;
              ImageModel.findByIdAndRemove(
                image[0]._id,
                function (error, image) {
                  if (error) console.log("error ", error);
                  else console.log("image deleted");
                }
              );
            }
          });
      }

      // console.log("blog ", blog);
      await blog.save();
      for (file of req.files) {
        const image = new ImageModel({
          _id: mongoose.Types.ObjectId(),
          fieldname: file["fieldname"],
          originalname: file["originalname"],
          encoding: file["encoding"],
          mimetype: file["mimetype"],
        });
        sharp(file["buffer"])
          .rotate()
          .resize(200)
          .jpeg({ mozjpeg: true })
          .toBuffer()
          .then(async (data) => {
            image.data = data;
            blog.imageId.push(image._id);
            await image.save();
            await blog.save();
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
