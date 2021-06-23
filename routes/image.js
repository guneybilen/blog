const authorized = require("../authentication/authorized");
const ImageModel = require("../models/image");
const BlogModel = require("../models/blog");

module.exports = function (router) {
  router.delete("/image/:id", authorized, async (req, res, next) => {
    try {
      let { id } = req.params;
      // console.log(req.get("blogId"));
      const blogId = req.get("blogId");
      const blog = await BlogModel.findById(blogId).exec();
      let images = blog.imageId.filter((image) => image.toString() !== id);
      // console.log(images);
      blog.imageId = images;
      await blog.save();
      await ImageModel.findByIdAndRemove(id).exec();
      return res.status(204).json({ success: true });
    } catch (error) {
      console.log(error.message);
      res.status(409).json({ success: false });
    }
  });
};
