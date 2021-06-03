const mongoose = require("../mongoose");
const { Schema } = mongoose;
const Image = require("./image").schema;
const Comment = require("./comment").schema;
const VideoURL = require("./videoURL").schema;
const mongoosePaginate = require("mongoose-paginate-v2");

const blogSchema = new Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    body: { type: String, minLength: 1, maxLength: 100 },
    title: { type: String, minLength: 1, maxLength: 10000 },
    author: String,
    // images: [Image],
    // comments: [Comment],
    // videoURLs: [VideoURL],
  },
  { timestamps: true }
);

blogSchema.plugin(mongoosePaginate);

const Blog = mongoose.model("Blog", blogSchema);

module.exports = Blog;
