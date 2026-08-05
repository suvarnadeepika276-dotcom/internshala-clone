const mongoose = require("mongoose");
require("dotenv").config();

const url = process.env.DATABASE_URL;

module.exports.connect = async () => {
    try {
        console.log("DATABASE_URL =", process.env.DATABASE_URL);
        console.log("Mongoose version =", mongoose.version);

        await mongoose.connect(url);

        console.log("Database is connected");
    } catch (error) {
        console.error("Database connection failed:");
        console.error(error);
    }
};