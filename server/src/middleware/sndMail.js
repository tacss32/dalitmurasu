const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

async function sendWelcomeEmail(toEmail, userName) {
  try {
    console.log(`Attempting to send welcome email to: ${toEmail}`);
    await transporter.sendMail({
      from: `"Dalit Murasu" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: "Welcome to Dalit Murasu!",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #0056b3;">Hello, ${userName}! 👋</h2>
          <p>Thank you for registering with Dalit Murasu. We are thrilled to have you join our community.</p>
          <p>You can now log in and explore all the features we have to offer.</p>
          <p>If you have any questions, feel free to reach out to us.</p>
          <p>Best regards,<br/>The Dalit Murasu Team</p>
        </div>
      `,
    });
    console.log(`Welcome email successfully sent to ${toEmail}`);
  } catch (error) {
    console.error("Error sending welcome email:", error);
    // Log the full error object for more detail
    console.error(error);
  }
}

async function sendSubscriptionEmail(
  toEmail,
  userName,
  planTitle,
  planPrice,
  expiryDate
) {
  try {
    console.log(`Attempting to send subscription email to: ${toEmail}`);
    // Convert paisa back to rupees for display
    const formattedExpiryDate = new Date(expiryDate).toLocaleDateString();

    await transporter.sendMail({
      from: `"Dalit Murasu" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: "Subscription Confirmation - Dalit Murasu",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #0056b3;">Hello, ${userName}! 👋</h2>
          <p>Thank you for subscribing to Dalit Murasu.</p>
          <p>Your subscription details are as follows:</p>
          <ul>
            <li><strong>Plan:</strong> ${planTitle}</li>
            <li><strong>Price Paid:</strong> ₹${planPrice}</li>
            <li><strong>Status:</strong> Active</li>
            <li><strong>Expires On:</strong> ${formattedExpiryDate}</li>
          </ul>
          <p>You can now enjoy full access to our content. Thank you for your support!</p>
          <p>Best regards,<br/>The Dalit Murasu Team</p>
        </div>
      `,
    });
    console.log(`Subscription email successfully sent to ${toEmail}`);
  } catch (error) {
    console.error("Error sending subscription email:", error);
  }
}

async function sendDonationEmail(toEmail, userName, amount) {
  try {
    const formattedAmount = amount.toFixed(2);
    await transporter.sendMail({
      from: `"Dalit Murasu" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: "Thank You for Your Donation - Dalit Murasu ❤️",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #0056b3;">Dear ${userName},</h2>
          <p>We sincerely thank you for your generous donation to <strong>Dalit Murasu</strong>.</p>
          <p>Your contribution of <strong>₹${formattedAmount}</strong> helps us continue our mission of amplifying voices and promoting equality.</p>
          <p>We deeply appreciate your support 🙏</p>
          <p>Best regards,<br/>The Dalit Murasu Team</p>
        </div>
      `,
    });
    console.log(`Donation email sent to ${toEmail}`);
  } catch (error) {
    console.error("Error sending donation email:", error);
  }
}
async function sendFeedbackEmail({ name, phone, mail, subject, message }) {
  try {
    // Determine the ADMIN email address from environment variables
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;

    if (!adminEmail) {
      throw new Error(
        "ADMIN_EMAIL is not configured in environment variables."
      );
    }

    console.log(`Attempting to send feedback email to admin: ${adminEmail}`);
    await transporter.sendMail({
      from: `"Feedback from ${name}" <${process.env.EMAIL_USER}>`, // Set 'from' to a general mailbox
      to: adminEmail, // Send to the administrator's email
      replyTo: mail, // Allow the admin to reply directly to the user's email
      subject: `New Feedback: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #d9534f;">New Feedback Submission</h2>
          <p><strong>From:</strong> ${name}</p>
          <p><strong>Email:</strong> ${mail}</p>
          ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ""}
          <p><strong>Subject:</strong> ${subject}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <h3 style="color: #5cb85c;">Message:</h3>
          <p style="white-space: pre-wrap; background-color: #f9f9f9; padding: 15px; border-left: 3px solid #5cb85c;">${message}</p>
        </div>
      `,
    });
    console.log(`Feedback email successfully sent to admin ${adminEmail}`);
  } catch (error) {
    console.error("Error sending feedback email:", error);
    // Log the full error object for more detail
    console.error(error);
    throw error; // Re-throw the error so the controller can handle the 500 response
  }
}


module.exports = {
  transporter,
  sendWelcomeEmail,
  sendSubscriptionEmail,
  sendDonationEmail,
  sendFeedbackEmail,
};
