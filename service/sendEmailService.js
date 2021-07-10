// const path = require("path");
const nodemailer = require("nodemailer");
// const Email = require("email-templates");
// const i18next = require("i18next");

const sendEmailService = async (options) => {
  // console.log(options);
  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: "admin <admin@basakblog.com>",
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.messageHTML,
  };
  await transporter.sendMail(mailOptions);
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