const { cookieMiddleware } = require("../middleWare/");
const BlogModel = require("../models/blog");
var colors = require("colors");
var moment = require("moment");
moment().format();

// var name = "Marak";
// console.log(colors.green("Hello %s"), name);
// totalDocs: 114,
// limit: 3,
// totalPages: 38,
// page: 1,
// pagingCounter: 1,
// hasPrevPage: false,
// hasNextPage: true,
// prevPage: null,
// nextPage: 2

const blogService = {
  verifyRequest: async (req, res) => {
    if (req.cookies.refreshToken) {
      let str = req.path.split(/\//);
      let index = str[2] ? str[2] : 1;
      // req.query.index !== null
      //   ? parseInt(req.query.index.split(/[?#]/)[0])
      //   : 1;

      let blogs = await BlogModel.paginate(
        {},
        {
          populate: [
            {
              path: "userId",
              select: "userName account",
              model: "User",
            },
          ],
          limit: 2,
          page: index ? index : 1,
          sort: { updatedAt: -1 },
        }
      ).catch((e) => console.log(e.message));
      // console.log(colors.cyan("blogs ", blogs));
      return blogs;
    } else {
      res.flash("info", "lutfen giris yapiniz yada kayit olunuz...");
      return res.redirect("/");
    }
  },
  verifyRequestByMe: async (req, res) => {
    let str = req.path.split(/\//);
    if (req.cookies.refreshToken) {
      let index = str[3] ? str[3] : 1;
      // req.query.index !== null || req.query.index !== ""
      //   ? req.query.index.split(/[?#]/)[0]
      //   : 1;

      let blogs = await BlogModel.paginate(
        { userId: res.locals.user },
        {
          populate: [
            {
              path: "userId",
              select: "userName account",
              model: "User",
            },
          ],
          limit: 2,
          page: index,
          sort: { updatedAt: -1 },
        }
      ).catch((e) => console.log(e.message));
      // console.log(colors.cyan("blogs ", blogs));
      return blogs;
    } else {
      res.flash("info", "lutfen giris yapiniz yada kayit olunuz...");
      return res.redirect("/");
    }
  },
};

module.exports = blogService;
