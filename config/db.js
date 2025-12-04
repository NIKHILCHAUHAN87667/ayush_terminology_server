const mongoose = require('mongoose');


const uri = 'mongodb+srv://devstatic014_db_user:zmkbeTqXgLMU3ocv@cluster0.xxcjgvv.mongodb.net/?appName=Cluster0/ayushsetu';
mongoose.connect(uri)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Database connection failed:", error);
});
module.exports = mongoose;