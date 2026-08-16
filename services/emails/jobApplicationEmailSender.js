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

const sendApplicationSubmittedEmail = async (email, fullName, applicationId, createdBy) => {
  try {
    const originText = createdBy === "Admin" || createdBy === "admin" ? "submitted by an administrator on your behalf" : "submitted successfully";
    await transporter.sendMail({
      from: '"solvewithyou Technologies" <solvewithyou@gmail.com>',
      to: email,
      subject: `Job Application Received - ${applicationId}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333333; max-width: 600px; border: 1px solid #eaeaea; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="cid:logo" alt="solvewithyou Technologies" style="max-width: 150px; height: auto;" />
          </div>
          <h2 style="color: #0056b3;">Hello, ${fullName}!</h2>
          <p>Your job application has been <strong>${originText}</strong>.</p>
          <p><strong>Application ID:</strong> ${applicationId}</p>
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
    console.error("Job application submitted email failed:", error.message);
  }
};

const sendApplicationUpdatedEmail = async (email, fullName, applicationId, status) => {
  try {
    await transporter.sendMail({
      from: '"solvewithyou Technologies" <solvewithyou@gmail.com>',
      to: email,
      subject: `Job Application Status Update - ${applicationId}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333333; max-width: 600px; border: 1px solid #eaeaea; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="cid:logo" alt="solvewithyou Technologies" style="max-width: 150px; height: auto;" />
          </div>
          <h2 style="color: #0056b3;">Hello, ${fullName},</h2>
          <p>Your job application (<strong>${applicationId}</strong>) status has been updated.</p>
          ${status ? `<p><strong>Current Status:</strong> ${status}</p>` : ""}
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
    console.error("Job application updated email failed:", error.message);
  }
};

const sendApplicationDeletedEmail = async (email, fullName, applicationId) => {
  try {
    await transporter.sendMail({
      from: '"solvewithyou Technologies" <solvewithyou@gmail.com>',
      to: email,
      subject: `Job Application Deletion Notice - ${applicationId}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333333; max-width: 600px; border: 1px solid #eaeaea; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="cid:logo" alt="solvewithyou Technologies" style="max-width: 150px; height: auto;" />
          </div>
          <h2 style="color: #0056b3;">Hello, ${fullName},</h2>
          <p>Your job application with ID <strong>${applicationId}</strong> has been removed from the platform.</p>
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
    console.error("Job application deleted email failed:", error.message);
  }
};

module.exports = {
  sendApplicationSubmittedEmail,
  sendApplicationUpdatedEmail,
  sendApplicationDeletedEmail,
};