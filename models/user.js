const bcrypt = require("bcryptjs");

// const mongoose = require("@app/mongoose");
const mongoose = require("../mongoose");
const Image = require("./image").schema;

const { Schema } = mongoose;

// const mongoosePaginate = require("mongoose-paginate-v2");

// const Blog = require("@app/module/auth/blog").schema;
const Blog = require("./blog").schema;

const userSchema = new Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    email: String,
    password: String,
    firstName: String,
    lastName: String,
    locale: String,
    userName: { type: String, lowercase: true, trim: true },
    account: {
      verification: {
        verified: {
          type: Boolean,
          default: false,
        },
        token: String,
        expiresIn: Date,
      },
      resetPassword: {
        token: String,
        expiresIn: Date,
      },
    },
  },
  { timestamps: true }
);

userSchema.statics.emailExist = function (email) {
  return this.findOne({ email });
};

userSchema.statics.userNameExist = function (userName) {
  return this.findOne({ userName });
};

userSchema.methods.comparePassword = function (password) {
  return bcrypt.compareSync(password, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();

  delete obj.password;

  // by guney
  delete obj.email;
  //
  //
  //
  //
  delete obj.account;
  delete obj.resetPassword;
  // delete obj.account.verification.token;
  // delete obj.account.verification.expiresIn;

  return obj;
};

// userSchema.plugin(mongoosePaginate);

const User = mongoose.model("User", userSchema);

module.exports = User;
