const jwt = require("jsonwebtoken");

// const redis = require("../redis");
const { StatusCodes: HttpStatus } = require("http-status-codes");

function signRefreshToken(userId) {
  return new Promise((resolve, reject) => {
    const payload = {
      maxAge: "31536000",
    };
    const secret = process.env.REFRESH_TOKEN_SECRET;
    const options = {
      issuer: "localhost",
      audience: userId.toString(),
    };
    jwt.sign(payload, secret, options, (err, token) => {
      if (err) {
        console.log(err.message);

        return reject(HttpStatus.Internal_Server_Error);
      }

      // redis.set(userId, token, 'EX', 365 * 24 * 60 * 60, (err, reply) => {
      //   if (err) {
      //     console.log(err.message);
      //     reject(HttpStatus.Internal_Server_Error);
      //     return;
      //  }
      // });
      resolve(token);
    });
  });
}

module.exports = signRefreshToken;
