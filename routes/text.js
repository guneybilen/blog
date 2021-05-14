var express = require("express");
// var app = express();
// app.use(express.urlencoded({ extended: false }));
// app.use(express.json());
var csrf = require("csurf");
var csrfProtection = csrf({ cookie: true });
var parseForm = express.urlencoded({ extended: false });

const { authMiddleware: middleware } = require("../middleware");
const {
  authController: auth,
  textController: text,
  userController: user,
} = require("../controllers");
const UserModel = require("../models/user");
const multer = require("multer");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
let dir = "/multer/uploads/images";
var mongoose = require("mongoose");
const { db } = require("../models/user");

var config = multer.memoryStorage({
  filename: function (req, file = {}, cb) {
    // cb(null, new Date().toISOString() + file.originalname);
    // console.log("req.originalname ", req.originalname);
    cb(null, file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (!file.originalname.match(/\.(png|jpg|jpeg)$/)) {
    cb(new Error("Please upload an image."));
  } else {
    cb(undefined, true);
  }
};

const upload = multer({
  storage: config,
  limits: {
    fileSize: 1024 * 1024 * 5,
  },
  fileFilter: fileFilter,
});

module.exports = function (router) {
  router.post("/recordPost");

  /*
  var cpUpload = upload.fields([{ name: "photos", maxCount: 4 }]);
  router.post(
    "/upload",
    cpUpload,
    async (req, res, next) => {
      // NOTICE DUPLICATE CODE.
      // The Following code is also present
      // in the routes/blog.js for more caution.
      if (!req.files.photos && req.body.data === "") {
        // Normally code should not reach here.
        // If the code is reaching here, they are
        // trying to bypass the client side check.
        return res.json({ error: "empty body" });
      }

      try {
        var blogId = mongoose.Types.ObjectId();

        if (!fs.existsSync(`${dir}/${res.locals.userName}/${blogId}`)) {
          try {
            fs.mkdirSync(`${dir}/${res.locals.userName}/${blogId}`, {
              recursive: true,
            });
            console.log("Directory created successfully!");
          } catch (e) {
            console.log(e.message);
          }
        }
        req.files.photos.forEach((element) => {
          sharp(element.buffer)
            .rotate()
            .resize(640, 320)
            .toFormat("jpeg")
            .jpeg({ quality: 90 })
            .toFile(
              path.resolve(
                `${dir}/${res.locals.userName}/${blogId}/${element["originalname"]}`
              )
            )
            .then((info) => {
              console.log(info);
            })
            .catch((err) => {
              console.log(err.message);
            });
        });

        req.blogId = blogId;

        next();
      } catch (e) {
        res.status(400).send(e.message);
      }
    },
    text.save
  ); */
  router.get("/author/:kodName/all", text.readBlogsByMe);
  router.get("/author/:kodName/:page", text.readBlogsByMe);
  router.get("/getBlogs/:page", text.readBlogs);
  router.get("/blog", text.readBlog);
  router.get("/getSavedBlog", text.savedBlog);
  router.get("/savedBlog", text.renderSavedBlog);

  router.get("/contact", text.contact);

  router.get("/form", csrfProtection, function (req, res) {
    // res.header("Access-Control-Allow-Origin", "*");

    res.send({ csrfToken: req.csrfToken() });
  });

  router.get("/blogs", parseForm, csrfProtection, (req, res) => {
    //console.log("text");
    let rawdata = fs.readFileSync("data/db.json");
    let result = JSON.parse(rawdata);
    //console.log(result);
    return res.send([result.blogs]);
  });

  router.get("/blogs/:id", parseForm, csrfProtection, (req, res) => {
    console.log(req.params.id);
    let rawdata = fs.readFileSync("data/db.json");
    let result = JSON.parse(rawdata);
    // console.log([result.blogs[req.params.id]]);
    return res.send([result.blogs[req.params.id - 1]]);
  });

  router.post("/blogs", (req, res) => {
    console.log(req.body);
    fs.readFile("data/db.json", function (err, data) {
      var json = JSON.parse(data);
      let result = JSON.parse(req.body.body);
      //console.log(json["blogs"].length);

      const retrieveValue = (key) =>
        json["blogs"].filter((x) => x[key]).map((x) => x[key])[3];
      //console.log("retrieveValue", retrieveValue("id"));
      let value = retrieveValue("id");

      // console.log(value);
      let newData = {
        title: result.title,
        body: result.body,
        author: result.author,
        id: value + 1,
      };
      // console.log(newData);
      json["blogs"].push(newData);
      let dt = JSON.stringify(json);
      console.log(dt);

      fs.writeFileSync("data/db.json", dt);
    });

    return res.json("ok");
  });
};
