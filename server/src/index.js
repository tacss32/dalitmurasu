const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const session = require("express-session");
const passport = require("passport");
const path = require("path");

const connectDB = require("./config/db");

// Import routes
const searchRoutes = require("./routes/search");
const newsletterImageRoutes = require("./routes/newsletterImage");
const subscriptionRoutes = require("./routes/subscriptionPlanRoutes");
const forgotPasswordRoutes = require("./routes/forgotPasswordRoutes");
const pdfUploadRoutes = require("./routes/pdfUploadRoutes");

// Load environment variables
dotenv.config();

// Passport Strategy
require("./middleware/passportSetup");

// ----------------------------------------------------------------------------
// Start Server AFTER DB Connect
// ----------------------------------------------------------------------------
connectDB()
  .then(() => {
    const app = express();

    // ------------------------------------------------------------------------
    // CORS Configuration
    // ------------------------------------------------------------------------
    const allowedOrigins = [
      "http://localhost:3030",
      "https://dalitmurasu.com",
      "http://localhost:5173",
    ];

    app.use(
      cors({
        origin: function (origin, callback) {
          if (!origin) return callback(null, true); // Allow same-origin or curl
          if (allowedOrigins.includes(origin)) return callback(null, true);
          return callback(new Error("Not allowed by CORS"));
        },
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true,
      })
    );

    app.set("trust proxy", 1);

    // ------------------------------------------------------------------------
    // Body Parsers
    // ------------------------------------------------------------------------
    app.use(express.json({ limit: "100mb" }));
    app.use(express.urlencoded({ limit: "100mb", extended: true }));

    // ------------------------------------------------------------------------
    // Session & Passport Setup
    // ------------------------------------------------------------------------
    app.use(
      session({
        secret: process.env.SESSION_SECRET || "defaultSecret",
        resave: false,
        saveUninitialized: false,
        cookie: {
          secure: true, // Ensure HTTPS
          sameSite: "none", // For cross-origin
        },
      })
    );

    app.use(passport.initialize());
    app.use(passport.session());

    // ------------------------------------------------------------------------
    // Static Assets (for PDFs and other uploads)
    // ------------------------------------------------------------------------
    // app.use("/uploads", (req, res, next) => {
    //   res.header("Access-Control-Allow-Origin", "*"); // Or use whitelist logic
    //   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    //   next();
    // });

    const mime = require("mime-types");

    app.use("/uploads", (req, res, next) => {
      const contentType = mime.lookup(req.path);
      if (contentType) {
        res.setHeader("Content-Type", contentType);
      }

      res.setHeader("Access-Control-Allow-Origin", "*");
      next();
    });

    // ✅ Fix path: serve from src/uploads/
    app.use("/uploads", express.static(path.join(__dirname,  "uploads")));

    // ------------------------------------------------------------------------
    // API Routes
    // ------------------------------------------------------------------------
    app.use("/api/auth", require("./routes/authRoutes"));
    app.use("/api/categories", require("./routes/categoryRoutes"));
    app.use("/api/post_titles", require("./routes/postTitlesRoutes"));
    app.use("/api/post_header", require("./routes/postHeaderRoutes"));
    app.use("/api/banners", require("./routes/bannerRoutes"));
    app.use("/api/gallery", require("./routes/galleryRoutes"));
    app.use("/api/chronological", require("./routes/chronological"));
    app.use("/api/universal-posts", require("./routes/universalPostRoutes"));
    app.use("/api/photo", require("./routes/photoRoutes"));
    app.use("/api/books", require("./routes/bookRoutes"));
    app.use("/api/cart", require("./routes/cartRoutes"));
    app.use("/api/premium-posts", require("./routes/premiumPostRoutes"));
    app.use("/api/subscriptions", require("./routes/subscriptionPlanRoutes"));
    app.use("/api/notifications", require("./routes/notificationRoutes"));
    app.use("/api/orders", require("./routes/orderRoutes"));
    app.use("/api/profile", require("./routes/profileRoutes"));
    app.use("/api/search", searchRoutes);
    app.use("/api/newsletter-image", newsletterImageRoutes);
    app.use("/api/client-users", require("./routes/clientUserRoutes"));
    app.use("/api/subscription", subscriptionRoutes);
    app.use("/api/forgot-password", forgotPasswordRoutes);
    app.use("/api/combined-posts", require("./routes/combinedPostRoutes"));
    app.use("/api/pdf-uploads", pdfUploadRoutes);
    // ------------------------------------------------------------------------
    // Health Check
    // ------------------------------------------------------------------------
    app.get("/", (req, res) => {
      res.send({ message: "🚀 Server is running successfully..." });
    });

    // ------------------------------------------------------------------------
    // Start Server
    // ------------------------------------------------------------------------
    const PORT = process.env.PORT || 3030;
    app.listen(PORT, () => {
      console.log(`✅ Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  });
