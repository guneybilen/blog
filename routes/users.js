module.exports = function (router) {
  var express = require("express");
  const passport = require("passport");
  const jwt = require("jsonwebtoken");
  const LocalStrategy = require("passport-local");
  const passportJWT = require("passport-jwt");

  const JWTStrategy = passportJWT.Strategy;
  const parseForm = express.urlencoded({ extended: false });
  var csrf = require("csurf");
  var csrfProtection = csrf({ cookie: true });

  const user = {
    id: "1",
    email: "example@email.com",
    password: "password",
  };

  passport.use(
    new LocalStrategy(
      { usernameField: "email", passReqToCallback: true },
      (req, email, password, done) => {
        if (email === user.email && password === user.password) {
          return done(null, user);
        } else {
          return done(null, false);
        }
      }
    )
  );

  // passport.deserializeUser((id, done) => {
  //   passport.deserializeUser((id, done) => {
  //     User.findById(id)
  //       .then((user) => {
  //         done(null, user);
  //       })
  //       .catch(done);
  //   });
  // });

  passport.use(
    new JWTStrategy(
      {
        jwtFromRequest: passportJWT.ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: process.env.SECRETORKEY,
      },
      (jwt_payload, done) => {
        if (user.id === jwt_payload.user._id) {
          return done(null, user);
        } else {
          return done(null, false, {
            message: "Token not matched",
          });
        }
      }
    )
  );

  router.post("/sign_in", parseForm, (req, res, next) => {
    passport.authenticate("local", (err, user) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.send("Wrong email or password");
      }
      req.login(user, () => {
        const body = { _id: user.id, email: user.email };

        const token = jwt.sign({ user: body }, process.env.SECRETORKEY);
        return res.json({ token });
      });
    })(req, res, next);
  });

  /* GET users listing. */
  router.get("/", function (req, res, next) {
    res.send("respond with a resource");
  });
};
