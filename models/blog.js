const mongoose = require("../mongoose");
const { Schema } = mongoose;
const Image = require("./image");
const Comment = require("./comment");
// const VideoURL = require("./videoURL");
const mongoosePaginate = require("mongoose-paginate-v2");

const blogSchema = new Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    title: { type: String, minLength: 1, maxLength: 100 },
    body: { type: String, minLength: 1, maxLength: 10000 },
    author: String,
    email: String,
    // images: [Image],
    imageId: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Image",
        required: false,
      },
    ],
    // commentId: [
    //   {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "Comment",
    //     required: false,
    //   },
    // ],
  },
  { timestamps: true }
);

blogSchema.plugin(mongoosePaginate);

const Blog = mongoose.model("Blog", blogSchema);

module.exports = Blog;
