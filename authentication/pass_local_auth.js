// const passport = require("passport");
var JwtStrategy = require("passport-jwt").Strategy,
  ExtractJwt = require("passport-jwt").ExtractJwt;
const UserModel = require("../models/user");

module.exports = (passport) => {
  var opts = {};
  opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
  opts.secretOrKey = process.env.SECRETORKEY;
  //   console.log( opts.jwtFromRequest);
  passport.use(
    new JwtStrategy(opts, function (jwt_payload, done) {
      //  console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
      UserModel.findOne({ _id: jwt_payload.sub }, function (err, user) {
        if (err) {
          return done(err, false);
        }
        if (user) {
          return done(null, user);
        } else {
          return done(null, false);
          // or you could create a new account
        }
      });
    })
  );
};
