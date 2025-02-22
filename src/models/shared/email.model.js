const otpMailTemplate = (from, to, otp) => {
  return {
    from: `Cravyn <${from}>`,
    to,
    subject: "Cravyn OTP",
    text: `Your OTP is ${otp}`,
    html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>OTP for Password Reset - Cravyn</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
                margin: 0;
                padding: 0;
            }
            .container {
                width: 100%;
                padding: 20px;
                background-color: #ffffff;
                max-width: 600px;
                margin: 0 auto;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            }
            h2 {
                color: #FF5722;
                text-align: center;
            }
            p {
                font-size: 16px;
                color: #333333;
                line-height: 1.5;
            }
            .otp {
                display: block;
                width: 100%;
                font-size: 22px;
                font-weight: bold;
                color: #ffffff;
                background-color: #FF5722;
                text-align: center;
                padding: 10px;
                margin: 20px 0;
                border-radius: 5px;
                letter-spacing: 5px;
            }
            .footer {
                text-align: center;
                font-size: 14px;
                color: #999999;
                margin-top: 30px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h2>Cravyn Password Reset</h2>
            <p>Hi ${to},</p>
            <br>
            <p>We received a request to reset the password for your Cravyn account. Please use the following OTP to reset your password:</p>
            <div class="otp">${otp}</div>
            <p>If you did not request this, please ignore this email or contact our support team for assistance.</p>
            <br>
            <p>Thanks,</p>
            <p>The Cravyn Team</p>
            <div class="footer">
                <p>Need help? Contact us at <a href="mailto:support@cravyn.com">support@cravyn.com</a></p>
            </div>
        </div>
    </body>
    </html>
  `,
  };
};

export { otpMailTemplate };
