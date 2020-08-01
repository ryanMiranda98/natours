const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema({
  tour: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tour",
    required: [true, "Booking must belong to a tour"],
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Booking must belong to a user"],
  },
  price: {
    type: Number,
    required: ["Booking must have a price"],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  paid: { type: Boolean, default: true },
});

BookingSchema.pre(/^find/, function (next) {
  this.populate("user").populate({ path: "tour", select: "name" });
  next();
});

const Booking = mongoose.model("Booking", BookingSchema);
module.exports = Booking;
