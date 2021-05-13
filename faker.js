const mongoose = require("mongoose");
const winston = require("winston");
const bcrypt = require("bcryptjs");
const ObjectId = require("mongoose").ObjectId;
const UserModel = require("./module/auth/user");
const BlogModel = require("./module/auth/blog");
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

function blogCreate(userid) {
  blog = {
    _id: mongoose.Types.ObjectId(),
    images: [
      { destination: faker.internet.avatar() },
      { destination: faker.internet.avatar() },
      { destination: faker.internet.avatar() },
      { destination: faker.internet.avatar() },
    ],
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

let responseOfCallBlogCreate = "";
const callBlogCreate = async (userid) => {
  responseOfCallBlogCreate = await blogCreate(userid);
  // console.log(colors.green("blog create result, %s", responseOfCallBlogCreate));
};

const engine = async () => {
  try {
    for (i = 0; i < 10; i++) {
      await callUserCreate();
      for (j = 0; j < 10; j++) {
        await callBlogCreate(userid);
      }
    }
  } catch (error) {
    console.log(colors.red("faker error ", error.message));
  }
};

iterator = 0;
while (iterator < 10) {
  engine().then(() => console.log(colors.cyan("faker success - OK")));
  iterator++;
}
