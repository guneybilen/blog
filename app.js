var createError = require("http-errors");
const express = require("express");
var path = require("path");
var logger = require("morgan");
var favicon = require("serve-favicon");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");

// xss-xlean package creates problems on sanitizing. I uninstalled xss-clean.
// const xss = require("xss-clean");

const { xss } = require("express-xss-sanitizer");

// var hpp = require("hpp");
var cookieFlashMessages = require("cookie-flash-messages");
const cors = require("cors");
const { StatusCodes: HttpStatus } = require("http-status-codes");
const hidePoweredBy = require("hide-powered-by");
const passport = require("passport");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const { duration } = require("moment");
// const winstonLogger = require("./service");
const contentSecurityPolicy = require("helmet-csp");

require("dotenv").config();

const app = express();

// app.set("view engine", "html");

app.use(express.static(path.join(__dirname, "build")));

const limiter = rateLimit({
  max: 300,
  windowMs: 60 * 60 * 1000,
  message: "too many requests from the same IP, please try in an hour",
});
app.use(limiter);

// body parser, ready data from the body into req.body
app.use(express.json({ limit: "50kb" }));
app.use(express.urlencoded({ extended: false }));

// data sanitization against NoSQL query injection
app.use(mongoSanitize());

//protection against malicious html that is injected with javascript
app.use(xss());

//prevent parameter pollution, you can white list hpp as well
// app.uss(hpp());
//prevent parameter pollution, you can white list hpp as well
// app.uss(hpp({ whitelist: ["duration"] }));

// set security HTTP headers
app.use(helmet());

app.use(
  contentSecurityPolicy({
    "default-src": ["'self'"],
    "connect-src": ["'self'", "blob:", "ws", "wss:", "websocket.domain"],
    "img-src": ["'self'", "data:"],
    "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'", "blob:"],
    reportOnly: false,
    safari5: false,
  })
);

app.use(cookieParser());
app.use(
  cors({
    origin: process.env.PRODUCTION_SERVER_URL,
    optionsSuccessStatus: HttpStatus.OK,
    credentials: true,
  })
);

// app.use(
//   cors({
//     origin: "http://localhost:8000",
//     optionsSuccessStatus: HttpStatus.OK,
//     credentials: true,
//   })
// );

// app.use(cors());

require("./authentication/pass_local_auth")(passport);
app.use(passport.initialize());

app.use(hidePoweredBy({ setTo: "PHP 5.2.0" }));

// view engine setup
// app.set("views", path.join(__dirname, "views"));
// app.set("view engine", "ejs");

// app.use(logger("dev"));
app.use(cookieParser());

app.use(function (req, res, next) {
  // console.log(req.headers.origin);
  res.header("Access-Control-Allow-Origin", req.headers.origin);
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Credentials", true);

  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

// app.use("/birds", birds);
app.use("/api", require("./routes"));
// app.use(require("./routes"));

app.get("/*", function (req, res) {
  // console.log(path.join(__dirname, "/build/index.html"));
  res.sendFile(path.join(__dirname, "/build/index.html"));
});

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

process.on("warning", (e) => console.warn(e.stack));

process.on("unhandledRejection", (error) => {
  console.error(error); // This prints error with stack included (as for normal errors)
  throw error; // Following best practices re-throw error and let the process exit with error code
});

module.exports = app;
