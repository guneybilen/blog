const passport = require("passport");

function authorized(request, response, next) {
  passport.authenticate("jwt", { session: false }, (error, user) => {
    if (error || !user) {
      return response.status(401).json({ message: "Unauthorized Message" });
    }
    if (user._id) {
      request.userId = user._id;
      next();
    } else {
      console.log(error.message);
      next(error);
    }
  })(request, response, next);
}

module.exports = authorized;
