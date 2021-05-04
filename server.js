const express = require('express')
const app = express()
const cors = require('cors')
const mongo = require('mongodb');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const {nanoid} = require('nanoid');
require('dotenv').config()

app.use(cors())
app.use(bodyParser.urlencoded({extended: false}))
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// Connect to Mongo DB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Check Connection
const connection = mongoose.connection;
connection.on('error', console.error.bind(console, 'connection error:'));
connection.once('open', () => {
  console.log("MongoDB database connection established successfully");
});

// Create User Schema
const Schema = mongoose.Schema;
const userSchema = new Schema({
  _id: { type: String, required: true },
  username: { type: String, required: true },
  count: { type: Number, default: 0 },
  log: [{
    description: { type: String },
    duration: { type: Number },
    date: { type: Date }
  }]
});
const User = mongoose.model("USER", userSchema);

// Create new users
app.post("/api/users", async (req, res) => {  
  let username = req.body.username;
  //console.log(username);
  try{
    let findOne = await User.findOne({
      username: username 
    })
    // If saved, return User
    if (findOne){
      //console.log("Retrieving Stored User")
      res.json({
        username: findOne.username,
        _id: findOne._id
      })
    }
    // If new, save User
    else {
      //console.log("New User - Saving.")
      let id = nanoid();
      findOne = new User({
        username: username,
        _id: id
      })
      res.json({
        username: username,
        _id: id
      })
      await findOne.save()
      //console.log("User Saved")
    }
  } catch (err) {
    console.error(err);
  }
});

// Get array of all users
app.get("/api/users", (req, res) => {
  User.find({}, (err, users) => {
    if (err) return console.error(err);
    res.json(users);
  });
});

// Add exercises
app.post("/api/users/:_id/exercises", async (req, res) => {
  let {description, duration, date } = req.body;
  let id = req.params._id;
  if (!date) {
    date = new Date().toDateString();
  } else {
    date = new Date(date).toDateString();
  }

  try{
    let findOne = await User.findOne({
      _id: id 
    })
    // If user exists, add exercise
    if (findOne){
      console.log("Retrieving Stored User")
      findOne.count++;
      findOne.log.push({
        description: description,
        duration: parseInt(duration),
        date: date
      });
      findOne.save();

      res.json({
          username: findOne.username,
          description: description,
          duration: parseInt(duration),
          _id: id,
          date: date
        });
    }
    // If user doesn't exist, return error
  } catch (err) {
    console.error(err);
  }
});

// Get full exervise log
app.get("/api/users/:_id/logs", async (req, res) => {
  console.log("Searching Logs");
  let id = req.params._id;
  let {to, from, limit } = req.query;

  try{
    let findOne = await User.findOne({
      _id: id 
    })

    // If user exists, add exercise
    if (findOne){
      console.log("Retrieving Stored User")
      exerciseLog = [];
      let i = 0;

      // Iterate through each exercise
      findOne.log.forEach(exercise => {
        if(limit > i || !(limit)){
          i++;
          if(to){
          to = new Date(to);
          from = new Date(from);
            if(to > exercise.date && from < exercise.date){
                exerciseLog.push(exercise);
            }
          } else {
            exerciseLog.push(exercise);
          }
        }
      });

      res.json({
        _id: id,
        username: findOne.username,
        count: findOne.count,
        log: exerciseLog
      });
    }
    // If user doesn't exist, return error
  } catch (err) {
    console.error(err);
  }
});
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
