const mongoose = require("mongoose");
const Tour = require("./tour");

const ReviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, "Review cannot be empty"],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    tour: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tour",
      required: [true, "Review must belong to a tour"],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Review must belong to a user"],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Query Middleware= populate review with tours and users
ReviewSchema.pre(/^find/, function (next) {
  // this.populate({ path: "tour", select: "name" }).populate({
  //   path: "user",
  //   select: "name",
  // });

  this.populate({
    path: "user",
    select: "name photo",
  });
  next();
});

// Here, "this" points to current model in static methods
ReviewSchema.statics.calcAverageRating = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: "$tour",
        nRating: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
  ]);
  // console.log(stats);
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: stats[0].avgRating,
      ratingsQuantity: stats[0].nRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: 4.5,
      ratingsQuantity: 0,
    });
  }
};

//
ReviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// Here "this" points to document currently being saved
// Post hook does not get access to next
ReviewSchema.post("save", function () {
  // this.constructor points to model as there is no other way
  // of accessing Review model
  this.constructor.calcAverageRating(this.tour);
});

// This points to current query
ReviewSchema.pre(/^findOneAnd/, async function (next) {
  // create a temporary property to pass variable
  // from pre hook to post hook
  this.r = await this.findOne();
  // console.log(this.r);
  next();
});

ReviewSchema.post(/^findOneAnd/, async function () {
  // await this.findOne(); Does not work on post hook as query has already
  // been executed
  await this.r.constructor.calcAverageRating(this.r.tour);
});

const Review = mongoose.model("Review", ReviewSchema);
module.exports = Review;
