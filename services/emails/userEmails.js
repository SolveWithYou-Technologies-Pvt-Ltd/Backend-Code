const transporter = require("../../config/mailer");

const sendWelcomeEmail = async (userEmail, userName) => {
  try {
    const logoPath = path.join(__dirname, "../../public/logo.png");

    const mailOptions = {
      from: '"solvewithyou Technologies" <solvewithyou@gmail.com>',
      to: userEmail,
      subject: "Welcome to solvewithyou Technologies!",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333333; max-width: 600px; border: 1px solid #eaeaea; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="cid:companyLogo" alt="solvewithyou Technologies" style="max-width: 150px; height: auto;" />
          </div>
          <h2 style="color: #0056b3;">Welcome, ${userName}!</h2>
          <p>Thank you for registering with us. Your account has been successfully created.</p>
          <p>We are excited to have you on board with solvewithyou Technologies.</p>
          <br/>
          <hr style="border: none; border-top: 1px solid #eeeeee;" />
          <div style="margin-top: 20px;">
            <h4 style="margin: 0; color: #333333;">solvewithyou Technologies</h4>
            <p style="margin: 5px 0; font-size: 14px; font-style: italic; color: #555555;">
              "We Can Create Solutions Together"
            </p>
            <p style="margin: 5px 0; font-size: 13px; color: #777777;">
              IT Software & Web Development
            </p>
            <p style="margin: 10px 0 0 0; font-size: 13px; color: #777777;">
              🌐 <a href="https://www.solvewithyou.in/" style="color: #0056b3; text-decoration: none;">www.solvewithyou.in</a><br/>
              ✉️ <a href="mailto:solvewithyou@gmail.com" style="color: #0056b3; text-decoration: none;">solvewithyou@gmail.com</a><br/>
              📞 +91 9005825347, +91 9936344869
            </p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: "logo.png",
          path: logoPath,
          cid: "companyLogo",
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    throw error;
  }
};

const sendProfileUpdateEmail = async (userEmail, userName) => {
  try {
    const logoPath = path.join(__dirname, "../../public/logo.png");

    const mailOptions = {
      from: '"solvewithyou Technologies" <solvewithyou@gmail.com>',
      to: userEmail,
      subject: "Profile Update Confirmation - solvewithyou Technologies",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333333; max-width: 600px; border: 1px solid #eaeaea; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="cid:companyLogo" alt="solvewithyou Technologies" style="max-width: 150px; height: auto;" />
          </div>
          <h2 style="color: #0056b3;">Hello, ${userName},</h2>
          <p>This email is to confirm that your profile information has been successfully updated on our platform.</p>
          <p>If you did not make these changes, please contact our support team immediately.</p>
          <br/>
          <hr style="border: none; border-top: 1px solid #eeeeee;" />
          <div style="margin-top: 20px;">
            <h4 style="margin: 0; color: #333333;">solvewithyou Technologies</h4>
            <p style="margin: 5px 0; font-size: 14px; font-style: italic; color: #555555;">
              "We Can Create Solutions Together"
            </p>
            <p style="margin: 5px 0; font-size: 13px; color: #777777;">
              IT Software & Web Development
            </p>
            <p style="margin: 10px 0 0 0; font-size: 13px; color: #777777;">
              🌐 <a href="https://www.solvewithyou.in/" style="color: #0056b3; text-decoration: none;">www.solvewithyou.in</a><br/>
              ✉️ <a href="mailto:solvewithyou@gmail.com" style="color: #0056b3; text-decoration: none;">solvewithyou@gmail.com</a><br/>
              📞 +91 9005825347, +91 9936344869
            </p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: "logo.png",
          path: logoPath,
          cid: "companyLogo",
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  sendWelcomeEmail,
  sendProfileUpdateEmail,
};