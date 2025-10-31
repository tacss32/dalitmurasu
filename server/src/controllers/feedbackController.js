const { sendFeedbackEmail } = require("../middleware/sndMail");


exports.submitFeedback = async (req, res) => {
  try {
    const { name, phone, mail, subject, message } = req.body;

    // 1. Validation: Ensure required fields are present
    if (!name || !mail || !subject || !message) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Missing required fields: name, mail, subject, or message",
        });
    }

    // Optional validation for phone, you can remove this block if phone is optional
    // if (!phone) {
    //   return res
    //     .status(400)
    //     .json({ success: false, message: "Missing required field: phone" });
    // }

    // 2. Send the feedback email to the admin
    await sendFeedbackEmail({ name, phone, mail, subject, message });

    // 3. Respond to the client
    res.status(200).json({
      success: true,
      message: "Your feedback has been submitted successfully. Thank you!",
    });
  } catch (err) {
    console.error("Error submitting feedback:", err);
    // Log the full error to the server console for debugging
    res.status(500).json({
      success: false,
      message: "Failed to submit feedback. Please try again later.",
    });
  }
};

// NOTE: All admin-related functions (getAll, getTotal, getStats)
// are REMOVED as feedback is not being stored in the database.
// If you wanted to store feedback, you'd reintroduce a new model and admin routes.
