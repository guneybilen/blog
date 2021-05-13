var express = require("express");
var router = express.Router();

require("./auth")(router);
require("./text")(router);
require("./users")(router);

module.exports = router;
