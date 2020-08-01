const fs = require('fs');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Tour = require('./../../models/tourModel');

dotenv.config({ path: './../../config.env' });

// console.log(app.get('env'));
// console.log(process.env);

const DB = "mongodb+srv://ryan:cSo2rCMLlMPSkKNN@cluster0-z7xdm.mongodb.net/Natours?retryWrites=true&w=majority"
mongoose.connect(DB, {
    // Default for deprecation warnings
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
}).then(() => {
    console.log("DB CONNECTION SUCCESSFUL");
});

// READ FILE
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours-simple.json`, 'utf-8'));

// IMPORT DATA INTO DB
const importData = async () => {
    try {
        await Tour.create(tours);
        console.log('DATA SUCCESSFULLY LOADED');
        process.exit();
    } catch (err) {
        console.log(err);
    }
}

// DELETE ALL DATA FROM DB
const deleteData = async () => {
    try {
        await Tour.deleteMany();
        console.log('DATA SUCCESSFULLY DELETED');
        process.exit();
    } catch (err) {
        console.log(err);
    }
}

if (process.argv[2] === '--import') {
    importData();
} else if (process.argv[2] === '--delete') {
    deleteData();
}

console.log(process.argv);