const bcrypt = require("bcryptjs");
const crypto = require("crypto");

// const mongoose = require("@app/mongoose");
const mongoose = require("../mongoose");
const Image = require("./image");

const { Schema } = mongoose;

// const mongoosePaginate = require("mongoose-paginate-v2");

// const Blog = require("@app/module/auth/blog").schema;
const Blog = require("./blog");
const { stringify } = require("querystring");

const userSchema = new Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    email: { type: String, minLength: 3, maxLength: 50, lowercase: true },
    password: { type: String, minLength: 8, maxLength: 30, required: true },
    firstName: String,
    lastName: String,
    locale: String,
    userName: {
      type: String,
      trim: true,
      minLength: 3,
      maxLength: 30,
    },
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
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
  },

  { timestamps: true }
);

userSchema.pre("save", async function save(next) {
  if (!this.isModified("password")) return next();
  try {
    this.password = await bcrypt.hash(this.password, 10);
    return next();
  } catch (err) {
    return next(err);
  }
});

userSchema.statics.emailExist = function (email) {
  return this.findOne({ email });
};

userSchema.statics.userNameExist = function (userName) {
  return this.findOne({ userName });
};

userSchema.methods.comparePassword = function (password) {
  return bcrypt.compareSync(password, this.password);
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() - 10 * 60 * 1000;

  return resetToken;
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
