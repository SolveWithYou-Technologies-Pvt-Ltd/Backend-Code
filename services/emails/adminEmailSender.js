const transporter = require("../../config/mailer");
const path = require("path");

const logoPath = path.join(process.cwd(), "public", "logo.png");

const emailAttachments = [
  {
    filename: "logo.png",
    path: logoPath,
    cid: "logo",
  },
];

const sendUserCreatedEmail = async (email, fullName, targetRole, employeeCode, password) => {
  try {
    await transporter.sendMail({
      from: '"solvewithyou Technologies" <solvewithyou@gmail.com>',
      to: email,
      subject: `Welcome to solvewithyou Technologies - ${targetRole.toUpperCase()} Account`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333333; max-width: 600px; border: 1px solid #eaeaea; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="cid:logo" alt="solvewithyou Technologies" style="max-width: 150px; height: auto;" />
          </div>
          <h2 style="color: #0056b3;">Welcome, ${fullName}!</h2>
          <p>Your ${targetRole} account has been successfully created.</p>
          <p>Your Employee Code is: <strong>${employeeCode}</strong></p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Your Login Credentials:</h3>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 5px 0;"><strong>Password:</strong> ${password}</p>
            <p style="margin: 10px 0 0 0; font-size: 12px; color: #dc3545;"><em>* Please ensure you change your password immediately after logging in for the first time.</em></p>
          </div>
          
          <br/>
          <hr style="border: none; border-top: 1px solid #eeeeee;" />
          <div style="margin-top: 20px;">
            <h4 style="margin: 0; color: #333333;">solvewithyou Technologies</h4>
            <p style="margin: 5px 0; font-size: 13px; color: #777777;">
              🌐 <a href="https://www.solvewithyou.in/" style="color: #0056b3; text-decoration: none;">www.solvewithyou.in</a><br/>
              ✉️ <a href="mailto:solvewithyou@gmail.com" style="color: #0056b3; text-decoration: none;">solvewithyou@gmail.com</a>
            </p>
          </div>
        </div>
      `,
      attachments: emailAttachments,
    });
  } catch (error) {
    console.error("Create user email failed:", error.message);
  }
};

const sendUserUpdatedEmail = async (email, fullName) => {
  try {
    await transporter.sendMail({
      from: '"solvewithyou Technologies" <solvewithyou@gmail.com>',
      to: email,
      subject: "Profile Update Notice - solvewithyou Technologies",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333333; max-width: 600px; border: 1px solid #eaeaea; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="cid:logo" alt="solvewithyou Technologies" style="max-width: 150px; height: auto;" />
          </div>
          <h2 style="color: #0056b3;">Hello, ${fullName},</h2>
          <p>Your account details or profile have been successfully updated by an administrator.</p>
          <br/>
          <hr style="border: none; border-top: 1px solid #eeeeee;" />
          <div style="margin-top: 20px;">
            <h4 style="margin: 0; color: #333333;">solvewithyou Technologies</h4>
            <p style="margin: 5px 0; font-size: 13px; color: #777777;">
              🌐 <a href="https://www.solvewithyou.in/" style="color: #0056b3; text-decoration: none;">www.solvewithyou.in</a>
            </p>
          </div>
        </div>
      `,
      attachments: emailAttachments,
    });
  } catch (error) {
    console.error("Update user email failed:", error.message);
  }
};

const sendUserRoleChangeEmail = async (email, fullName, previousRole, newRole) => {
  try {
    await transporter.sendMail({
      from: '"solvewithyou Technologies" <solvewithyou@gmail.com>',
      to: email,
      subject: "Role Update Notice - solvewithyou Technologies",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333333; max-width: 600px; border: 1px solid #eaeaea; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="cid:logo" alt="solvewithyou Technologies" style="max-width: 150px; height: auto;" />
          </div>
          <h2 style="color: #0056b3;">Hello, ${fullName},</h2>
          <p>Your account role has been changed from <strong>${previousRole}</strong> to <strong>${newRole}</strong>.</p>
          <br/>
          <hr style="border: none; border-top: 1px solid #eeeeee;" />
          <div style="margin-top: 20px;">
            <h4 style="margin: 0; color: #333333;">solvewithyou Technologies</h4>
          </div>
        </div>
      `,
      attachments: emailAttachments,
    });
  } catch (error) {
    console.error("Role change email failed:", error.message);
  }
};

const sendUserPermissionsUpdatedEmail = async (email, fullName) => {
  try {
    await transporter.sendMail({
      from: '"solvewithyou Technologies" <solvewithyou@gmail.com>',
      to: email,
      subject: "Permissions Update - solvewithyou Technologies",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333333; max-width: 600px; border: 1px solid #eaeaea; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="cid:logo" alt="solvewithyou Technologies" style="max-width: 150px; height: auto;" />
          </div>
          <h2 style="color: #0056b3;">Hello, ${fullName},</h2>
          <p>Your account permissions have been updated successfully.</p>
          <br/>
          <hr style="border: none; border-top: 1px solid #eeeeee;" />
          <div style="margin-top: 20px;">
            <h4 style="margin: 0; color: #333333;">solvewithyou Technologies</h4>
          </div>
        </div>
      `,
      attachments: emailAttachments,
    });
  } catch (error) {
    console.error("Permissions update email failed:", error.message);
  }
};

const sendUserStatusUpdatedEmail = async (email, fullName, isActive) => {
  try {
    const statusText = isActive ? "activated" : "deactivated";
    await transporter.sendMail({
      from: '"solvewithyou Technologies" <solvewithyou@gmail.com>',
      to: email,
      subject: `Account Status Update - solvewithyou Technologies`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333333; max-width: 600px; border: 1px solid #eaeaea; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="cid:logo" alt="solvewithyou Technologies" style="max-width: 150px; height: auto;" />
          </div>
          <h2 style="color: #0056b3;">Hello, ${fullName},</h2>
          <p>Your account has been <strong>${statusText}</strong> by an administrator.</p>
          <br/>
          <hr style="border: none; border-top: 1px solid #eeeeee;" />
          <div style="margin-top: 20px;">
            <h4 style="margin: 0; color: #333333;">solvewithyou Technologies</h4>
          </div>
        </div>
      `,
      attachments: emailAttachments,
    });
  } catch (error) {
    console.error("Status update email failed:", error.message);
  }
};

const sendUserDeletedEmail = async (email, fullName, employeeCode) => {
  try {
    await transporter.sendMail({
      from: '"solvewithyou Technologies" <solvewithyou@gmail.com>',
      to: email,
      subject: "Account Deletion Notice - solvewithyou Technologies",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333333; max-width: 600px; border: 1px solid #eaeaea; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="cid:logo" alt="solvewithyou Technologies" style="max-width: 150px; height: auto;" />
          </div>
          <h2 style="color: #0056b3;">Hello, ${fullName},</h2>
          <p>Your account has been deleted/closed from the platform.</p>
          <br/>
          <hr style="border: none; border-top: 1px solid #eeeeee;" />
          <div style="margin-top: 20px;">
            <h4 style="margin: 0; color: #333333;">solvewithyou Technologies</h4>
          </div>
        </div>
      `,
      attachments: emailAttachments,
    });
  } catch (error) {
    console.error("Account deletion email failed:", error.message);
  }
};

module.exports = {
  sendUserCreatedEmail,
  sendUserUpdatedEmail,
  sendUserRoleChangeEmail,
  sendUserPermissionsUpdatedEmail,
  sendUserStatusUpdatedEmail,
  sendUserDeletedEmail,
};