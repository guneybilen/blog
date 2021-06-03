var createError = require("http-errors");
var express = require("express");
var path = require("path");
var logger = require("morgan");
var favicon = require("serve-favicon");
const helmet = require("helmet");
var cookieFlashMessages = require("cookie-flash-messages");
const cors = require("cors");
const { StatusCodes: HttpStatus } = require("http-status-codes");
const hidePoweredBy = require("hide-powered-by");
const passport = require("passport");
const cookieParser = require("cookie-parser");

// var csrf = require("csurf");
require("dotenv").config();

var app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(helmet());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:3000",
    optionsSuccessStatus: HttpStatus.OK,
    credentials: true,
  })
);

//app.use(cors());

require("./authentication/pass_local_auth")(passport);
app.use(passport.initialize());

// app.use(
//   csurf({
//     cookie: {
//       key: "_kjbkjbkjbkhbkhvvjhvjh",
//       path: "/context-route",
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       maxAge: 3600, // 1-hour
//     },
//   })
// );

// var csrfProtection = csrf({ cookie: true });

app.use(hidePoweredBy({ setTo: "PHP 5.2.0" }));

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
// app.use(
//   express.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 })
// );
// app.use(express.json());
app.use(logger("dev"));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header("Access-Control-Allow-Methods", "GET,PUT,PATCH,POST,DELETE");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Credentials", "true");

  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});
app.use(require("./routes"));

// if (process.env.NODE_ENV === "production") {
//   app.use(express.static("client/build"));
//   a;

//   app.get("*", (req, res) => {
//     res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
//   });
// }

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

process.on("unhandledRejection", (error) => {
  console.error(error); // This prints error with stack included (as for normal errors)
  throw error; // Following best practices re-throw error and let the process exit with error code
});

module.exports = app;
