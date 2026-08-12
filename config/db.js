const mongoose = require("mongoose");
const dns = require('dns')
dns.setServers(['8.8.8.8','1.1.1.1'])

const connectDB = () => {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then((conn) => {
      console.log(`MongoDB Connected: ${conn.connection.host}`);
    })
    .catch((error) => {
      console.error(`MongoDB Connection Error: ${error.message}`);
      process.exit(1);
    });
};

module.exports = connectDB;