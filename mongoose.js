const mongoose = require("mongoose");
const winston = require("winston");

// mongoose.Promise = global.Promise;
// mongoose
//   .connect(
//     `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.b9ok8.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`,
//     {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//       useFindAndModify: true,
//       useCreateIndex: true,
//     }
//   )
//   .catch((error) => {
//     console.log(error.message);
//     winston.error(error);
//   });

// mongoose.connection.on("open", () => winston.info("MongoDB connected"));

// module.exports = mongoose;

mongoose.Promise = global.Promise;
mongoose
  .connect(
    `mongodb+srv://theUser:poiu0987@cluster0.b9ok8.mongodb.net/yetenek?retryWrites=true&w=majority`,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true,
    }
  )
  .catch((error) => {
    console.log(error.message);
    winston.error(error);
  });

mongoose.connection.on("open", () => winston.info("MongoDB connected"));

module.exports = mongoose;
