const mongoose = require("mongoose");
const slugify = require("slugify");

const TourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A tour must have a name"],
      unique: true,
      trim: true,
      maxlength: [40, "Name must have less than or equal to 40 characters"],
      minlength: [10, "Name must have more than or equal to 10 characters"],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, "A tour must have a duration"],
    },
    maxGroupSize: {
      type: Number,
      required: [true, "A tour must have a group size"],
    },
    difficulty: {
      type: String,
      required: [true, "A tour must have a difficulty"],
      enum: {
        values: ["easy", "medium", "difficult"],
        message: "Difficulty is either easy, medium, or difficult",
      },
    },
    ratingsAverage: {
      type: Number,
      min: [1, "Must be atleast 1.0"],
      max: [5, "Must be below 5.0"],
      default: 4.5,
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, "A tour must have a price"],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (value) {
          return value < this.price;
        },
        message: "Discount price should be below regular price",
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, "A tour must have a summary"],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, "A tour must have a cover image"],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: "Point",
        enum: ["Point"],
      },
      // longitude, latitude in this case
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: "Point",
          enum: ["Point"],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// INDEXES - for query performance
// TourSchema.index({ price: 1 });
TourSchema.index({ price: 1, ratingsAverage: -1 });
TourSchema.index({ slug: 1 });
TourSchema.index({startLocation: '2dsphere'})

TourSchema.virtual("durationWeeks").get(function () {
  return this.duration / 7;
});

// Virtual Populate
TourSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "tour",
  localField: "_id",
});

TourSchema.pre("save", function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// Embed users into tours (guides) on create(EXAMPLE ONLY)
// TourSchema.pre("save", async function(next){
//   const guidesPromises = this.guides.map(async id => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
// })

// Populate guides for all find()
TourSchema.pre(/^find/, async function (next) {
  this.populate({
    path: "guides",
    select: "-__v -passwordChangedAt",
  });
});

TourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  next();
});

const Tour = mongoose.model("Tour", TourSchema);
module.exports = Tour;
