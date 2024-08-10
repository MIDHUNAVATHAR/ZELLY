const nodemailer = require('nodemailer');
const dotenv = require("dotenv");
dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_ID,
    pass: process.env.MAIL_PASS,
  },
  tls: {
   rejectUnauthorized: false
 }
});

module.exports = transporter;
