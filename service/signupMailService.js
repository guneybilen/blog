const sendEmailService = require("./sendEmailService");
const { URL } = require("./urls");

const signupMailService = async (res, userCreated, signupConfirmToken) => {
  try {
    const resetURL = `${URL}/confirmAccount/${signupConfirmToken}`;
    const message = `basak's blog\nTeşekkür ederiz.? lütfen\n${URL}\nlinkini kopyalıp tarayıcınıza yapıstırın.`;

    const messageHTML =
      "<br /><br /><h2>basak's blog</h2><h3>Teşekkür ederiz. Kayıt işleminizi tamamlayabilmemiz için \
      lütfen <br /><a href=\"" +
      URL +
      `\">${URL}/confirmAccount/${signupConfirmToken}</a> linkine tıklayın...</h3>`;

    await sendEmailService({
      email: userCreated.email,
      subject: "kayıt işlemi tamamlama emaili",
      message: message,
      messageHTML: messageHTML,
    });

    return res.status(200).json({
      logged: false,
      message: "pending",
    });
  } catch (error) {
    console.log(error.message);
    userCreated.confirmationCode = undefined;
    userCreated.status = "Pending";
    return res.status(500).send();
  }
};

module.exports = signupMailService;
