const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
var colors = require("colors");
var emptyDir = require("empty-dir");
var moment = require("moment");
moment().format();

async function blogEdit(req, res, next) {
  //console.log(req.file);
  //console.log(req.body);
  // let dir = "multer/uploads/images";
  // NOTICE DUPLICATE CODE.
  // The Following code is also present
  // in the routes/user.js for more caution.
  if (!req.file && req.body.data === "") {
    // Normally code should not reach here.
    // If the code is reaching here, they are
    // trying to bypass the client side check.
    return res.json({ error: "empty body" });
  }

  //if (req.file && req.file.photo && req.file.photo.length > 1) {
  //return res.json({ error: "you cannot send more than 1 image at a time" });
  //}

  //console.log("req.files.photos ", req.files.photos);

  console.log(req.body);

  //let taym = req.body.comingFrom === "newAbout" ? 0 : DateTime.now();
  let taym = Date.now();
  let dir =
    req.body.comingFrom === "newAbout"
      ? "admin/websiteImages"
      : "multer/uploads/images";

  try {
    var userId = res.locals.user;

    if (!fs.existsSync(`${dir}/${res.locals.userName}_${req.body.blogId}`)) {
      try {
        fs.mkdirSync(`${dir}/${res.locals.userName}_${req.body.blogId}`, {
          recursive: true,
        });
        console.log("Directory created successfully!");
      } catch (e) {
        console.log(e.message);
      }
    }

    fs.readdir(
      `${dir}/${res.locals.userName}_${req.body.blogId}`,
      (err, files) => {
        console.log(files);
        let img = files.splice(req.body.j, 1);
        console.log("img ", img);
        if (files.length >= 3) {
          fs.unlink(
            `${dir}/${res.locals.userName}_${req.body.blogId}/${img}`,
            function (err) {
              if (err) {
                throw err;
              } else {
                console.log("Successfully deleted the file.");
              }
            }
          );
          files.unshift({
            ...req.file,
          });
        }
        if (files.length < 4) {
          files.unshift({
            ...req.file,
          });
        }
      }
    );

    sharp(req.file.buffer)
      .rotate()
      .resize(640, 320)
      .toFormat("jpeg")
      .jpeg({ quality: 90 })
      .toFile(
        path.resolve(
          `${dir}/${res.locals.userName}_${req.body.blogId}/${taym}_${req.file.originalname}`
        )
      )
      .then((info) => {
        console.log(info);
      })
      .catch((err) => {
        console.log(err.message);
      });

    req.dir = dir;
    req.originalname = req.file.originalname;
    req.j = req.body.j;
    req.userId = userId;
    req.taym = taym;
    req.blogId = req.body.blogId;
    next();
  } catch (e) {
    res.status(400).send(e.message);
  }
}

module.exports = blogEdit;
