const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

const fs = require("fs");
const mongoose = require("mongoose");
mongoose
  .connect(process.env.DB_URI.replace("<password>", process.env.DB_PASSWORD), {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: true,
  })
  .then(() => console.log("Db connected successfully"))
  .catch((err) => console.log(`Error connecting to Db: ${err.message}`));

const tourData = JSON.parse(
  fs.readFileSync("./dev-data/data/tours.json", "utf-8")
);
const reviewData = JSON.parse(
  fs.readFileSync("./dev-data/data/reviews.json", "utf-8")
);
const userData = JSON.parse(
  fs.readFileSync("./dev-data/data/users.json", "utf-8")
);

const Tour = require("./models/tour");
const Review = require("./models/review");
const User = require("./models/user");

const importData = async () => {
  try {
    await Tour.create(tourData);
    await User.create(userData, { validateBeforeSave: false });
    await Review.create(reviewData);
    console.log("Data successfully loaded");
  } catch (error) {
    console.log("Error adding data");
  }
  process.exit();
};

const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log("Data successfully deleted");
  } catch (error) {
    console.log("Error deleting data");
  }
  process.exit();
};

if (process.argv[2] === "--import") {
  importData();
} else if (process.argv[2] === "--delete") {
  deleteData();
}
