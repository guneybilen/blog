const authorized = require("../authentication/authorized");
const ImageModel = require("../models/image");

module.exports = function (router) {
  router.delete("/image/:id", authorized, async (req, res, next) => {
    try {
      let { id } = req.params;
      await ImageModel.findByIdAndRemove(id).exec();
      return res.status(204).json({ success: true });
    } catch (error) {
      console.log(error.message);
      res.status(409).json({ success: false });
    }
  });
};
