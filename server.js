const dotenv = require("dotenv");
dotenv.config({ path: `${__dirname}/config.env` });

// GLOBAL HANDLER FOR UNCAUGHT EXCEPTIONS - SYNC
process.on("uncaughtException", (err) => {
  console.log(err.name, err.message);
  console.log("Uncaught Exception. Shutting down...");
  process.exit(1);
});

const app = require("./app");

// SETUP DB CONNECTION
const mongoose = require("mongoose");
mongoose
  .connect(process.env.DB_URI.replace("<password>", process.env.DB_PASSWORD), {
    useCreateIndex: true,
    useFindAndModify: false,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Db connected successfully"));
// .catch((err) => console.log(`Error connecting to Db: ${err.message}`));

// SETUP PORT TO LISTEN
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, (req, res) => {
  console.log(`Server running on port ${PORT}`);
});

// GLOBAL HANDLER FOR UNHANDLED REJECTED PROMISES - ASYNC
process.on("unhandledRejection", (err) => {
  console.log(err.name, err.message);
  console.log("Unhandled Rejection. Shutting down...");
  server.close(() => {
    process.exit(1);
  });
});
