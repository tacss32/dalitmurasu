const mongoose = require("mongoose");


const clientUserSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true, sparse: true },
    phone: { type: String, sparse: true },
    gender: {
      type: String,
      enum: ["male", "female"],
    },
    password: String,
    googleId: { type: String, unique: true, sparse: true },

    dob: { type: Date },

    passwordResetCode: { type: String },
    passwordResetExpires: { type: Date },
    passwordResetVerified: Boolean,

   
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.ClientUser || mongoose.model("ClientUser", clientUserSchema);
