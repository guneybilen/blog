/* var express = require("express");
var csrf = require("csurf");
var app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
var parseForm = express.urlencoded({ extended: false });
var router = express.Router();
const multer = require("multer");
var colors = require("colors");
const { authMiddleware: middleware } = require("@app/middleware");
const { userController: user } = require("@app/module");
const { textController: text } = require("@app/module");
const { blogEdit } = require("../module/auth/service");

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
  router.get("/edit/:blogId", user.editBlog);
  router.get("/newBlog", text.newBlog);
  router.get("/about", text.newBlog);

  router.get("/editAbout", user.editAbout);
  router.get("/hakkimizda", user.renderAbout);

  //var cpUpload = upload.fields([{ name: "photo", maxCount: 1 }]);
  router.post(
    "/entry",
    upload.single("photo"),
    blogEdit,
    user.imagePlacementForBlog
  );
  router.post("/about", upload.single("photo"), blogEdit, user.imagePlacement);
  router.post("/blogText", user.saveBlogText);
  router.post("/text", user.saveWebSiteInfoText);
  router.post("/deleteImage", text.deleteImage);
  router.post("/deleteImageForBlog", text.deleteImageForBlog);
  //router.post("/blogEdit", cpUpload, blogEdit, text.update);
  //router.get("/about", cpUpload, blogEdit, text.save);
};
*/

module.exports = function (router) {
  var express = require("express");
  const passport = require("passport");
  const jwt = require("jsonwebtoken");
  const LocalStrategy = require("passport-local");
  const passportJWT = require("passport-jwt");

  const JWTStrategy = passportJWT.Strategy;
  const parseForm = express.urlencoded({ extended: false });

  const user = {
    id: "1",
    email: "example@email.com",
    password: "password",
  };

  passport.use(
    new LocalStrategy(
      { usernameField: "email", passReqToCallback: true },
      (req, email, password, done) => {
        if (email === user.email && password === user.password) {
          return done(null, user);
        } else {
          return done(null, false);
        }
      }
    )
  );

  // passport.deserializeUser((id, done) => {
  //   passport.deserializeUser((id, done) => {
  //     User.findById(id)
  //       .then((user) => {
  //         done(null, user);
  //       })
  //       .catch(done);
  //   });
  // });

  passport.use(
    new JWTStrategy(
      {
        jwtFromRequest: passportJWT.ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: process.env.SECRETORKEY,
      },
      (jwt_payload, done) => {
        if (user.id === jwt_payload.user._id) {
          return done(null, user);
        } else {
          return done(null, false, {
            message: "Token not matched",
          });
        }
      }
    )
  );

  router.post("/sign_in", parseForm, (req, res, next) => {
    passport.authenticate("local", (err, user) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.send("Wrong email or password");
      }
      req.login(user, () => {
        const body = { _id: user.id, email: user.email };

        const token = jwt.sign({ user: body }, process.env.SECRETORKEY);
        return res.json({ token });
      });
    })(req, res, next);
  });

  var ensureAuthenticated = function (req, res, next) {
    if (req.isAuthenticated()) return next();
    else res.redirect("/login");
  };

  /* GET users listing. */
  router.get("/", function (req, res, next) {
    res.send("respond with a resource");
  });
};
