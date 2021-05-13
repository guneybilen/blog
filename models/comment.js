// const mongoose = require("@app/mongoose");
const mongoose = require("../mongoose");

const { Schema } = mongoose;

const commentSchema = new Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    email: String,
    userName: String,
    commentText: String,
  },
  { timestamps: true }
);

const Comment = mongoose.model("Comment", commentSchema);

module.exports = Comment;
