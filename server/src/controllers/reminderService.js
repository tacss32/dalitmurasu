// server/src/services/reminderService.js
const SubscriptionPayment = require("../models/SubscriptionPayment");
const {
  sendExpiryReminderEmail,
  sendPostExpiryEmail,
} = require("../middleware/sndMail");

// Ensure these models are registered for populate
require("../models/ClientUser");
require("../models/SubscriptionPlan");

const DAILY_INTERVAL = 24 * 60 * 60 * 1000;
const HOUR_TO_RUN = 12;
const MINUTE_TO_RUN = 15; // your previous change for 12:10 PM

/**
 * Existing: reminders for expiring in 3 days
 */
const sendDailyExpiryReminders = async () => {
  console.log("Running daily subscription reminder job...");

  try {
    const targetDateStart = new Date();
    targetDateStart.setDate(targetDateStart.getDate() + 3);
    targetDateStart.setHours(0, 0, 0, 0);

    const targetDateEnd = new Date(targetDateStart);
    targetDateEnd.setHours(23, 59, 59, 999);

    const expiringSubscriptions = await SubscriptionPayment.find({
      payment_status: "success",
      endDate: { $gte: targetDateStart, $lte: targetDateEnd },
    })
      .populate("userId", "name")
      .populate("subscriptionPlanId", "title");

    if (!expiringSubscriptions.length) {
      console.log("No subscriptions expiring in 3 days. Job complete.");
      return;
    }

    for (const sub of expiringSubscriptions) {
      if (sub.userId && sub.subscriptionPlanId && sub.mail) {
        await sendExpiryReminderEmail(
          sub.mail,
          sub.userId.name,
          sub.subscriptionPlanId.title,
          sub.endDate
        );
      } else {
        console.warn(
          `Skipping reminder for sub ${sub._id}: Missing user, plan, or email info.`
        );
      }
    }

    console.log("Successfully sent all expiry reminders.");
  } catch (error) {
    console.error("Error running daily expiry reminder job:", error);
  }
};

/**
 * NEW: post-expiry emails (for already expired subscriptions)
 */
const sendDailyPostExpiryEmails = async () => {
  console.log("Running daily post-expiry email job...");

  try {
    const now = new Date();

    // Find subscriptions that expired exactly yesterday
    const yesterdayStart = new Date();
    yesterdayStart.setDate(now.getDate() );
    yesterdayStart.setHours(0, 0, 0, 0);

    const yesterdayEnd = new Date();
    yesterdayEnd.setDate(now.getDate() );
    yesterdayEnd.setHours(23, 59, 59, 999);

    const expiredSubs = await SubscriptionPayment.find({
      payment_status: "success",
      endDate: { $gte: yesterdayStart, $lte: yesterdayEnd },
    })
      .populate("userId", "name email")
      .populate("subscriptionPlanId", "title");

    if (!expiredSubs.length) {
      console.log("No subscriptions expired yesterday. Job complete.");
      return;
    }

    console.log(
      `Found ${expiredSubs.length} expired subscriptions to notify...`
    );

    for (const sub of expiredSubs) {
      const to = sub.userId?.email || sub.mail;
      const userName = sub.userId?.name || "Subscriber";
      const planTitle = sub.subscriptionPlanId?.title || "your";

      if (!to) {
        console.warn(`Skipping post-expiry for ${sub._id}: missing email.`);
        continue;
      }

      await sendPostExpiryEmail(to, userName, planTitle);
      console.log(`✅ Sent post-expiry email to ${to}`);
    }

    console.log("All post-expiry emails sent successfully.");
  } catch (error) {
    console.error("Error running post-expiry email job:", error);
  }
};

/**
 * Starts both jobs at the scheduled time daily
 */
const startReminderService = () => {
  const getMsUntilNextRun = () => {
    const now = new Date();
    const nextRun = new Date(now);
    nextRun.setHours(HOUR_TO_RUN, MINUTE_TO_RUN, 0, 0); // 12:10 PM

    if (now.getTime() > nextRun.getTime()) {
      nextRun.setDate(nextRun.getDate() + 1);
    }

    const delay = nextRun.getTime() - now.getTime();
    console.log(
      `Reminder service: Next run scheduled for ${nextRun.toLocaleString()}`
    );
    return delay;
  };

  const msUntilFirstRun = getMsUntilNextRun();

  setTimeout(() => {
    // Run both jobs
    sendDailyExpiryReminders();
    sendDailyPostExpiryEmails();

    // Repeat every 24 hours
    setInterval(() => {
      sendDailyExpiryReminders();
      sendDailyPostExpiryEmails();
    }, DAILY_INTERVAL);
  }, msUntilFirstRun);

  console.log(
    "✅ Reminder service started (includes pre-expiry + post-expiry emails)."
  );
};

module.exports = { startReminderService };
