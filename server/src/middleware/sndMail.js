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
    const formattedPrice = (planPrice / 100).toFixed(2); // Convert paisa back to rupees for display
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
            <li><strong>Price Paid:</strong> ₹${formattedPrice}</li>
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

module.exports = {
  transporter,
  sendWelcomeEmail,
  sendSubscriptionEmail,
  sendDonationEmail,
};
