var createError = require("http-errors");
const express = require("express");
var path = require("path");
var logger = require("morgan");
var favicon = require("serve-favicon");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
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

require("dotenv").config();

const app = express();

// const server = require("http").createServer(app);
// const io = require("socket.io")(server, {
//   transports: ["websocket", "polling"],
// });

// const users = {};

// io.on("connection", (client) => {
//   client.on("username", (nick) => {
//     console.log("333333333333333333333333333333333333333333333333333  ", nick);
//     const user = {
//       name: nick,
//       id: client.id,
//     };
//     users[client.id] = user;
//     io.emit("connected", user);
//     io.emit("users", Object.values(users));
//   });

//   client.on("disconnect", () => {
//     console.log("disconnected");
//     const username = users[client.id];
//     delete users[client.id];
//     io.emit("disconnected", client.id);
//   });
// });

// server.listen(4000);

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
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:3000",
    optionsSuccessStatus: HttpStatus.OK,
    credentials: true,
  })
);

// app.use(cors());

require("./authentication/pass_local_auth")(passport);
app.use(passport.initialize());

app.use(hidePoweredBy({ setTo: "PHP 5.2.0" }));

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// app.use(logger("dev"));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

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
// app.use(require("./routes"));
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

process.on("warning", (e) => console.warn(e.stack));

process.on("unhandledRejection", (error) => {
  console.error(error); // This prints error with stack included (as for normal errors)
  throw error; // Following best practices re-throw error and let the process exit with error code
});

module.exports = app;
