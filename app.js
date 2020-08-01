const express = require("express");
const app = express();
const path = require("path");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const cookieParser = require("cookie-parser");

const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

// ------------------ Middleware----------------------
// Serving static files
app.use(express.static(path.join(__dirname, "public")));

// Sets up HTTP headers for better security
app.use(helmet());

// Limit too many number of requests from one IP
// limit to only API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, Please try again in an hour.",
});
app.use("/api", limiter);

// Body Parser, reading data from body to req.body
// Limit data in body to less than 10kb
app.use(express.json({ limit: "10kb" }));
// Parses data from cookies
app.use(cookieParser());
// Parse data coming from urllencoded form
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Data sanitization against NoSQL query injection
// removes malicious code/symbols from body
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevents parameter pollution
// removes duplicate fields in parameter (eg: sort=price&sort=duration)
// whitelist allows specified fields to have duplicates
app.use(
  hpp({
    whitelist: [
      "duration",
      "ratingsQuantity",
      "ratingsAverage",
      "maxGroupSize",
      "difficulty",
      "price",
    ],
  })
);

// -------------------- Routes ---------------------------
// VIEWS
const viewRoutes = require("./routes/viewRoutes");
app.use("/", viewRoutes);

// API
const tourRoutes = require("./routes/tourRoutes");
const userRoutes = require("./routes/userRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const bookingRoutes = require("./routes/bookingRoutes");

app.use("/api/v1/tours", tourRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/reviews", reviewRoutes);
app.use("/api/v1/bookings", bookingRoutes);
// if route is not matched, throw an error
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 400));
});

// Global Error-handling Middleware
app.use(globalErrorHandler);

module.exports = app;
