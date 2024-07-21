const nodemailer = require("nodemailer");
require("dotenv").config();

const { SMTP_USER, SMTP_PASSWORD } = process.env;

const sendMessage = async (email, code) => {
  let transporter = nodemailer.createTransport({
    service: "gmail",
    secure: false,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD,
    },
  });

  let result = await transporter.sendMail({
    from: "Механик - научно-производственнная компания",
    to: email,
    subject: "Код подтверждения",
    html: `<p>Ваш код подтверждения: <strong>${code}</strong>.<br> Введите его на сайте, чтобы подтвердить вашу почту.</p>`,
  });

  return !!result.messageId;
};

module.exports = sendMessage;
