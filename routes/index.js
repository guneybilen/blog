var express = require("express");
var router = express.Router();

router.get("/routes", (req, res, next) => {
  var routes = [];
  var i = 0;
  router.stack.forEach(function (r) {
    if (r.route && r.route.path) {
      r.route.stack.forEach(function (type) {
        var method = type.method.toUpperCase();
        routes[i++] = {
          no: i,
          method: method.toUpperCase(),
          path: r.route.path,
        };
      });
    }
  });

  res.send("<h1>List of routes.</h1>" + JSON.stringify(routes));
});

require("./text")(router);
require("./users")(router);
require("./image")(router);

module.exports = router;
