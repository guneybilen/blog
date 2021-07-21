// const path = require("path");
const nodemailer = require("nodemailer");
const mg = require("nodemailer-mailgun-transport");
// const Email = require("email-templates");
// const i18next = require("i18next");

const mailgunAuth = {
  auth: {
    api_key: process.env.MAILGUN_API_KEY,
    domain: process.env.MAILGUN_DOMAIN,
  },
};

const sendEmailService = async (options) => {
  // console.log(options);
  // const transporter = nodemailer.createTransport({
  //   host: process.env.MAIL_HOST,
  //   port: process.env.MAIL_PORT,
  //   auth: {
  //     user: process.env.MAIL_USER,
  //     pass: process.env.MAIL_PASSWORD,
  //   },
  // });

  const transporter = nodemailer.createTransport(mg(mailgunAuth));

  const mailOptions = {
    from: "admin <admin@basakblog.herokuapp.com>",
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.messageHTML,
  };

  transporter.sendMail(mailOptions, function (error, response) {
    if (error) {
      console.log(error);
    } else {
      console.log("Successfully sent email.");
    }
  });
};

module.exports = sendEmailService;

// const mail = new Email({
//   views: {
//     root: path.join(process.env.NODE_PATH, 'views', 'template'),
//     locals: {
//       i18n: i18next,
//       clientUrl: process.env.CLIENT_URL,
//     },
//     options: { extension: 'ejs' },
//   },
//   preview: false,
//   send: true,
//   transport: transporter,
// });

// module.exports = { transporter, mail };
