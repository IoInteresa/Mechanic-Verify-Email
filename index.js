const express = require("express");
const sqlite3 = require("sqlite3").verbose();
require("dotenv").config();

const sendMessage = require("./mail.service");
const { isValidEmail, generateVerifyCode } = require("./helper.service");

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;

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

app.listen(PORT, () => console.log("Started on port " + PORT));
