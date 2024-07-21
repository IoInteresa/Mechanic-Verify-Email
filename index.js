const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const https = require("https");
const cors = require("cors");
const fs = require("fs");
require("dotenv").config();

const sendMessage = require("./mail.service");
const { isValidEmail, generateVerifyCode } = require("./helper.service");

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: "*",
  })
);

const db = new sqlite3.Database("./main.db", (err) => {
  if (err) {
    console.error(err.message);
    process.exit(1);
  }
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS codes (
    email TEXT PRIMARY KEY,
    code TEXT
  )`);
});

app.post("/send-code", async (req, res) => {
  const { email } = req.body;

  if (!isValidEmail(email)) {
    res.json({
      status: 400,
      data: "Отправлен невалидный адрес электронной почты",
    });
    return;
  }

  const code = generateVerifyCode();
  const isSuccess = await sendMessage(email, code);

  if (!isSuccess) {
    res.json({
      status: 500,
      data: "Внутренняя ошибка сервера. Свяжитесь с нами по номеру телефона",
    });
    return;
  }

  db.serialize(() => {
    db.run(
      "INSERT OR REPLACE INTO codes (email, code) VALUES (?, ?)",
      [email, code],
      function (err) {
        if (err) {
          res.json({
            status: 500,
            data: "Внутренняя ошибка сервера. Свяжитесь с нами по номеру телефона",
          });
          return;
        }
        res.json({ status: 200, data: "Успешно" });
      }
    );
  });
});

app.post("/check-code", (req, res) => {
  const { email, code } = req.body;

  db.get("SELECT code FROM codes WHERE email = ?", [email], (err, row) => {
    if (err) {
      res.json({
        status: 500,
        data: "Внутренняя ошибка сервера. Свяжитесь с нами по номеру телефона",
      });
      return;
    }

    if (row && row.code === code) {
      res.json({ status: 200, data: "Подтвержден" });
    } else {
      res.json({ status: 400, data: "Неверный код" });
    }
  });
});

const { SSL_KEY_PATH, SSL_CERT_PATH } = process.env;

const sslOptions = {
  key: fs.readFileSync(SSL_KEY_PATH),
  cert: fs.readFileSync(SSL_CERT_PATH),
};

https
  .createServer(sslOptions, app)
  .listen(443, () => console.log("Secure server started on port 443"));
