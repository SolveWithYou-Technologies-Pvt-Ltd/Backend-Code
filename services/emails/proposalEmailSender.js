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

const sendProposalCreatedEmail = async (email, fullName, proposalId, title, createdBy) => {
  try {
    const originText = createdBy === "Admin" || createdBy === "admin" ? "created by an administrator" : "created for you";
    await transporter.sendMail({
      from: '"solvewithyou Technologies" <solvewithyou@gmail.com>',
      to: email,
      subject: `New Proposal Generated - ${proposalId}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333333; max-width: 600px; border: 1px solid #eaeaea; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="cid:logo" alt="solvewithyou Technologies" style="max-width: 150px; height: auto;" />
          </div>
          <h2 style="color: #0056b3;">Hello, ${fullName}!</h2>
          <p>A new proposal has been <strong>${originText}</strong>.</p>
          <p><strong>Proposal ID:</strong> ${proposalId}</p>
          <p><strong>Title:</strong> ${title || "N/A"}</p>
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
    console.error("Proposal created email failed:", error.message);
  }
};

const sendProposalUpdatedEmail = async (email, fullName, proposalId, status) => {
  try {
    await transporter.sendMail({
      from: '"solvewithyou Technologies" <solvewithyou@gmail.com>',
      to: email,
      subject: `Proposal Update Notice - ${proposalId}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333333; max-width: 600px; border: 1px solid #eaeaea; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="cid:logo" alt="solvewithyou Technologies" style="max-width: 150px; height: auto;" />
          </div>
          <h2 style="color: #0056b3;">Hello, ${fullName},</h2>
          <p>Your proposal (<strong>${proposalId}</strong>) has been updated.</p>
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
    console.error("Proposal updated email failed:", error.message);
  }
};

const sendProposalDeletedEmail = async (email, fullName, proposalId) => {
  try {
    await transporter.sendMail({
      from: '"solvewithyou Technologies" <solvewithyou@gmail.com>',
      to: email,
      subject: `Proposal Deletion Notice - ${proposalId}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333333; max-width: 600px; border: 1px solid #eaeaea; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="cid:logo" alt="solvewithyou Technologies" style="max-width: 150px; height: auto;" />
          </div>
          <h2 style="color: #0056b3;">Hello, ${fullName},</h2>
          <p>Your proposal with ID <strong>${proposalId}</strong> has been deleted/closed from the platform.</p>
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
    console.error("Proposal deleted email failed:", error.message);
  }
};

module.exports = {
  sendProposalCreatedEmail,
  sendProposalUpdatedEmail,
  sendProposalDeletedEmail,
};