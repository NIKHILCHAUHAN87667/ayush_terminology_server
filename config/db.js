const mongoose = require('mongoose');
require('dotenv').config()


const uri =process.env.MONGO_URI ;
const DB_NAME = "ayushsetu";
mongoose.connect(uri,{
  dbName: DB_NAME,
})
  .then(() => {
    console.log("Connected to MongoDB :",DB_NAME);
  })
  .catch((error) => {
    console.error("Database connection failed:", error);
});
module.exports = mongoose;