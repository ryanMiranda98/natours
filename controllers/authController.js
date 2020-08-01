const { promisify } = require("util");
const User = require("../models/user");
const catchAsync = require("../utils/catchAsync");
const jwt = require("jsonwebtoken");
const AppError = require("../utils/appError");
const crypto = require("crypto");
const Email = require("../utils/email");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  // Create Cookie
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRY * 24 * 60 * 60 * 1000
    ),
    secure: false,
    // this means that we cannot manipulate cookie in the browser in any way
    httpOnly: true,
  };
  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;
  res.cookie("jwt", token, cookieOptions);

  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: { user },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  // name: req.body.name,
  // email: req.body.email,
  // password: req.body.password,
  // passwordConfirm: req.body.passwordConfirm,
  const newUser = await User.create(req.body);
  const url = `${req.protocol}://${req.get("host")}/me`;
  await new Email(newUser, url).sendWelcome();
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("Please provide email or password", 400));
  }

  const user = await User.findOne({ email: email }).select("+password");
  if (!user || !(await user.verifyPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }
  createSendToken(user, 200, res);
});

// Logout
exports.logout = (req, res) => {
  console.log("in logout");
  res.cookie("jwt", "logged out", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({
    status: "success",
  });
};

// middleware - protects route from unauthorized users
exports.protect = catchAsync(async (req, res, next) => {
  let token;
  // Read from either auth header or cookie
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError("You are not logged in! Please login to get access", 401)
    );
  }
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // Check if user still exists
  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    return next(
      new AppError("The token belonging to this user no longer exists", 401)
    );
  }
  // Check if user changed password after token was issued
  if (freshUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError("User recently changed password! Please log in again"),
      401
    );
  }
  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = freshUser;
  res.locals.user = freshUser;
  next();
});

// only for rendered pages, no errors would be found
exports.isLoggedIn = async (req, res, next) => {
  // Read only from cookie
  if (req.cookies.jwt) {
    try {
      // Verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );
      // Check if user still exists
      const freshUser = await User.findById(decoded.id);
      if (!freshUser) {
        return next();
      }
      // Check if user changed password after token was issued
      if (freshUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // There is a logged in user
      res.locals.user = freshUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

// middleware - restricts routes from users who do not have permission (user roles)
// cannot pass argument into middleware function
// so, create a wrapper function around it and return middleware
exports.restrictTo = (...roles) => {
  return async (req, res, next) => {
    // if current user's role is not in the roles provided
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action"),
        403
      );
    }
    next();
  };
};

// Receives email address
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError("There is no user with that email address"), 404);
  }

  // Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // Send it to the user

  try {
    const resetUrl = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/users/resetPassword/${resetToken}`;
    await new Email(user, resetUrl).sendPasswordReset();

    res.status(200).json({
      status: "success",
      message: "Token sent to email!",
    });
  } catch (error) {
    console.log(error);
    user.passwordResetToken = undefined;
    user.passwordResetExpiry = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        "There was an error sending the email. Please try again",
        500
      )
    );
  }
});

// Receives token and new password
exports.resetPassword = catchAsync(async (req, res, next) => {
  // Get user based on token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpiry: { $gt: Date.now() },
  });

  // If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError("Token is invalid or expired", 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpiry = undefined;
  // update changedPasswordAt property - pre-save hook
  await user.save();

  // log user in, send JWT
  createSendToken(user, 200, res);
});

// Update password for "logged" in users
exports.updatePassword = catchAsync(async (req, res, next) => {
  // get user from req.user.id
  const user = await User.findById(req.user.id).select("+password");

  // check if POSTed password is correct
  if (!(await user.verifyPassword(req.body.password, user.password))) {
    return next(new AppError("Your current password is incorrect.", 401));
  }

  // if password is correct, update the password
  user.password = req.body.newPassword;
  user.passwordConfirm = req.body.newPasswordConfirm;
  await user.save();

  // log the user in, send JWT
  createSendToken(user, 200, res);
});
