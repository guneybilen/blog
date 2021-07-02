const mongoose = require("../mongoose");

const { Schema } = mongoose;

const commentSchema = new Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    prevCommentId: mongoose.Schema.Types.ObjectId,
    commentAuthorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    comment: { type: String, minLength: 1, maxLength: 1000, required: true },
    blogId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Blog",
      required: true,
    },
    blogAuthorId: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
  },
  { timestamps: true }
);

const Comment = mongoose.model("Comment", commentSchema);

module.exports = Comment;
