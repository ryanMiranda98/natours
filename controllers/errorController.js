const AppError = require("../utils/appError");

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/);
  const message = `Duplicate field value ${value}. Please use another value`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join(". ")}`;
  return new AppError(message, 400);
};

const handleJWTError = (err) => {
  return new AppError("Invalid Token. Please log in again", 401);
};

const handleJWTExpiredError = (err) => {
  return new AppError("Your token has expired. Please log in again", 401);
};

const sendErrorDev = (err, req, res) => {
  if (req.originalUrl.startsWith("/api")) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
  return res
    .status(err.statusCode)
    .render("error", { title: "Something went wrong", msg: err.message });
};

const sendErrorProd = (err, req, res) => {
  if (req.originalUrl.startsWith("/api")) {
    console.log(err);
    // if error is operational error, send to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    // if error is programming error, send generic message to client
    // don't leak error to client
    // 1) log error for developers
    console.error("Error", err);
    // 2) send generic message
    return res.status(500).json({
      status: "error",
      message: "Something went wrong!",
    });
  }
  if (err.isOperational) {
    return res
      .status(err.statusCode)
      .render("error", { title: "Something went wrong!", msg: err.message });
  }
  console.error("Error", err);
  return res.status(500).render("error", {
    title: "Something went wrong!",
    msg: "Please try again later.",
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === "production") {
    // console.log(error);
    let error = { ...err };
    error.message = err.message;

    // if (error.name === "CastError") error = handleCastErrorDB(error);
    // if(error.code === '11000') error = handleDuplicateFieldsDB(error);
    // if(error.name === 'ValidationError') error = handleValidationErrorDB(error);
    // if(error.name === 'JsonWebTokenError') error = handleJWTError(error);
    // if(error.name === 'TokenExpiredError') error = handleJWTExpiredError(error)
    sendErrorProd(error, req, res);
  }
};
