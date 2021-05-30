const mongoose = require("../mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const { Schema } = mongoose;
const Blog = require("./blog").schema;

const imageSchema = new Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    blogID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Blog",
      required: true,
    },
    fieldname: String,
    originalname: String,
    encoding: String,
    mimetype: String,
    destination: String,
    filename: String,
    path: String,
    size: Number,
    data: Schema.Types.Mixed,
    contentType: String,
  },
  { timestamps: true }
);

imageSchema.plugin(mongoosePaginate);

const Image = mongoose.model("Image", imageSchema);

module.exports = Image;
