// install mongoose
const mongoose = require("mongoose");

async function connectToDB() {
  try {
    await mongoose.connect(process.env.mongolink);
    console.log("Connected To MongoDB...");
  } catch (error) {
    //console.log(error)
    console.log("Connection Failed To MongoDB!");
  }
}

module.exports = connectToDB;
