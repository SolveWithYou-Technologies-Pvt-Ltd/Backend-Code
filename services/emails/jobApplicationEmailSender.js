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
          <p>Your application has been <strong>${originText}</strong>. Our team will contact you when you are shortlisted. Thank you for applying.</p>
          <p><strong>Application ID:</strong> ${applicationId}</p>
          <br/>
          <hr style="border: none; border-top: 1px solid #eeeeee;" />
          <div style="margin-top: 20px;">
            <h4 style="margin: 0; color: #333333;">solvewithyou Technologies</h4>
            <p style="margin: 5px 0; font-size: 13px; color: #777777;">
              📧 <a href="mailto:solvewithyou@gmail.com" style="color: #0056b3; text-decoration: none;">solvewithyou@gmail.com</a><br/>
              📞 6306567512<br/>
              🌐 <a href="https://www.solvewithyou.in/" style="color: #0056b3; text-decoration: none;">www.solvewithyou.in</a>
            </p>
          </div>
        </div>
      `,
      attachments: emailAttachments,
    });
  } catch (error) {
    console.error(error.message);
  }
};

const sendApplicationUpdatedEmail = async (email, fullName, applicationId, status) => {
  try {
    let statusMessage = "";

    if (status === "Shortlisted") {
      statusMessage = `
        <p>Congratulations! Your profile for application ID <strong>${applicationId}</strong> has been <strong>Shortlisted</strong>.</p>
        <p>Our team will contact you shortly with details regarding the next steps.</p>
      `;
    } else if (status === "Rejected") {
      statusMessage = `
        <p>Thank you for taking the time to apply with us.</p>
        <p>After careful consideration of your application (<strong>${applicationId}</strong>), we regret to inform you that we have decided to move forward with other candidates whose profiles more closely match our current requirements.</p>
        <p>We wish you all the best in your future endeavors.</p>
      `;
    } else if (status === "Reviewed") {
      statusMessage = `
        <p>Your application (<strong>${applicationId}</strong>) has been <strong>Reviewed</strong> by our team.</p>
        <p>We are currently evaluating your profile against our requirements and will keep you updated on any further progress.</p>
      `;
    } else {
      statusMessage = `
        <p>The status of your job application (<strong>${applicationId}</strong>) has been updated.</p>
        <p><strong>Current Status:</strong> ${status}</p>
      `;
    }

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
          ${statusMessage}
          <br/>
          <hr style="border: none; border-top: 1px solid #eeeeee;" />
          <div style="margin-top: 20px;">
            <h4 style="margin: 0; color: #333333;">solvewithyou Technologies</h4>
            <p style="margin: 5px 0; font-size: 13px; color: #777777;">
              📧 <a href="mailto:solvewithyou@gmail.com" style="color: #0056b3; text-decoration: none;">solvewithyou@gmail.com</a><br/>
              📞 6306567512<br/>
              🌐 <a href="https://www.solvewithyou.in/" style="color: #0056b3; text-decoration: none;">www.solvewithyou.in</a>
            </p>
          </div>
        </div>
      `,
      attachments: emailAttachments,
    });
  } catch (error) {
    console.error(error.message);
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
            <p style="margin: 5px 0; font-size: 13px; color: #777777;">
              📧 <a href="mailto:solvewithyou@gmail.com" style="color: #0056b3; text-decoration: none;">solvewithyou@gmail.com</a><br/>
              📞 6306567512<br/>
              🌐 <a href="https://www.solvewithyou.in/" style="color: #0056b3; text-decoration: none;">www.solvewithyou.in</a>
            </p>
          </div>
        </div>
      `,
      attachments: emailAttachments,
    });
  } catch (error) {
    console.error(error.message);
  }
};

module.exports = {
  sendApplicationSubmittedEmail,
  sendApplicationUpdatedEmail,
  sendApplicationDeletedEmail,
};