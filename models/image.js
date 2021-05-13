// const mongoose = require("@app/mongoose");
const mongoose = require("../mongoose");

const { Schema } = mongoose;

const imageSchema = new Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    fieldname: String,
    originalname: String,
    encoding: String,
    mimetype: String,
    destination: String,
    filename: String,
    path: String,
    size: Number,
  },
  { timestamps: true }
);

const Image = mongoose.model("Image", imageSchema);

module.exports = Image;
