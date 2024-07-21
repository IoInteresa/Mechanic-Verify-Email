const isValidEmail = (email) => {
  const regex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
  return regex.test(email);
};

const generateVerifyCode = () => {
  return Math.floor(10000 + Math.random() * 90000).toString();
};

module.exports = { isValidEmail, generateVerifyCode };
