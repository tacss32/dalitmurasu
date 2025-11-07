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

const APP_URL = "https://dalitmurasu.com";

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
    const formattedExpiryDate = new Date(expiryDate).toLocaleDateString(
      "en-GB"
    );

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



async function sendExpiryReminderEmail(toEmail, userName, planTitle, endDate) {
  try {
    const formattedExpiryDate = new Date(endDate).toLocaleDateString("en-IN", {
      year: "numeric", month: "long", day: "numeric"
    });

    await transporter.sendMail({
      from: `"Dalit Murasu" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `Your ${planTitle} plan expires in 3 days`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height:1.6; color:#333;">
          <h2 style="color:#d97706;">Heads up, ${userName}! ⏳</h2>
          <p>Your <strong>${planTitle}</strong> subscription will expire on <strong>${formattedExpiryDate}</strong>.</p>
          <p>Renew now to keep uninterrupted access to Dalit Murasu.</p>
          <p>
            <a href="${APP_URL }"
               style="display:inline-block;padding:10px 16px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">
              Renew Subscription
            </a>
          </p>
          <p>If you've already renewed, you can ignore this message.</p>
          <p>— The Dalit Murasu Team</p>
        </div>
      `,
    });
    console.log(`3-day expiry reminder sent to ${toEmail}`);
  } catch (error) {
    console.error("Error sending expiry reminder email:", error);
    throw error;
  }
}
async function sendPostExpiryEmail(toEmail, userName, planTitle) {
  try {
    await transporter.sendMail({
      from: `"Dalit Murasu" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `Your ${planTitle} subscription has expired`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height:1.6; color:#333;">
          <h2 style="color:#d97706;">Your subscription has expired, ${userName}</h2>
          <p>Your <strong>${planTitle}</strong> subscription with Dalit Murasu has expired.</p>
          <p>To regain access to all our content, please renew your subscription at your earliest convenience.</p>
          <p>
            <a href="${APP_URL}"  
                style="display:inline-block;padding:10px 16px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">
              Renew Subscription
            </a>
          </p>
          <p>Thank you for being a part of our community.</p>
          <p>— The Dalit Murasu Team</p>
        </div>
      `,
    });
    console.log(`Post-expiry email sent to ${toEmail}`);
  } catch (error) {
    console.error("Error sending post-expiry email:", error);
    // Don't throw error, just log it, so one failed email doesn't stop the whole job
  }
}

module.exports = {
  transporter,
  sendWelcomeEmail,
  sendSubscriptionEmail,

  sendFeedbackEmail,
  // NEW export
  sendExpiryReminderEmail,
  sendPostExpiryEmail,
};
