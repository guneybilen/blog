const mongoose = require("mongoose");
const winston = require("winston");
const bcrypt = require("bcryptjs");
const ObjectId = require("mongoose").ObjectId;
const UserModel = require("./models/user");
const BlogModel = require("./models/blog");
const ImageModel = require("./models/image");
var faker = require("faker");
var colors = require("colors");

require("dotenv").config();

function userCreate() {
  user = {
    _id: mongoose.Types.ObjectId(),
    email: faker.internet.email().toLowerCase(),
    password: bcrypt.hashSync("zaq12345", 10),
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    locale: "en",
    userName: faker.internet.userName(),
  };
  return UserModel.create(user);
}

function imgCreate(blogID) {
  img = {
    _id: mongoose.Types.ObjectId(),
    destination: faker.internet.avatar(),
    blogID: blogID,
  };
  return ImageModel.create(img);
}

function blogCreate(userid) {
  blog = {
    _id: mongoose.Types.ObjectId(),
    userId: userid,
    story: faker.lorem.paragraphs(),
  };
  return BlogModel.create(blog);
}

let userid = "";
let responseOfCallUserCreate = "";
const callUserCreate = async () => {
  responseOfCallUserCreate = await userCreate();
  userid = responseOfCallUserCreate._id;
};

let blogid = "";
let responseOfCallBlogCreate = "";
const callBlogCreate = async (userid) => {
  responseOfCallBlogCreate = await blogCreate(userid);
  blogid = responseOfCallUserCreate._id;
  // console.log(colors.green("blog create result, %s", responseOfCallBlogCreate));
};

const callImageCreate = async (blogid) => {
  responseOfCallImageCreate = await imgCreate(blogid);
  imageId = responseOfCallImageCreate._id;
};

const engine = async () => {
  try {
    for (i = 0; i < 3; i++) {
      await callUserCreate();
      for (j = 0; j < 3; j++) {
        await callBlogCreate(userid);
        for (j = 0; j < 3; j++) {
          await callImageCreate(blogid);
        }
      }
    }
  } catch (error) {
    console.log(colors.red("faker error ", error.message));
  }
};

iterator = 0;
while (iterator < 2) {
  engine().then(() => console.log(colors.cyan("faker success - OK")));
  iterator++;
}
