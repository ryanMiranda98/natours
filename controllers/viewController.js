const Tour = require("../models/tour");
const User = require("../models/user");
const Booking = require("../models/booking");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

// OVERVIEW PAGE
exports.getOverview = catchAsync(async (req, res, next) => {
  // get tour data from api
  const tours = await Tour.find();

  // build template
  // render template using data
  res.status(200).render("overview", { title: "All Tours", tours });
});

// TOUR PAGE
exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: "reviews",
    fields: "review rating user",
  });

  if (!tour) {
    return next(new AppError("There is no tour with that name", 404));
  }

  res.status(200).render("tour", { title: tour.name, tour });
});

// LOGIN PAGE
exports.login = catchAsync(async (req, res, next) => {
  res.status(200).render("login", { title: "Log into your account" });
});

exports.getAccount = (req, res) => {
  res.status(200).render("account", { title: "Your Account" });
};

exports.updateUserData = catchAsync(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    {
      new: true,
      runValidators: true,
    }
  );
  res.status(200).render("account", { user: updatedUser });
});

exports.getMyTours = catchAsync(async (req, res, next) => {
  // Find all bookings
  const bookings = await Booking.find({ user: req.user.id });

  // Find tours with the returned IDs
  const tourIds = bookings.map((el) => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIds } });

  res.status(200).render("overview", { title: "My Tours", tours: tours });
});
