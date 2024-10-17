import nodemailer from "nodemailer";
import { otpMailTemplate } from "../models/email.model.js";

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.GMAIL_ACCOUNT,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const sendMail = (to, otp) => {
  const mailOptions = otpMailTemplate("codyrahulop@gmail.com", to, otp);
  return transporter.sendMail(mailOptions);
};

export { sendMail };
