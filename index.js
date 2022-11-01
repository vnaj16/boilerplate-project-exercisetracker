const express = require('express')
let mongoose = require("mongoose")
let bodyParser = require('body-parser')
const app = express()
const cors = require('cors')
require('dotenv').config()
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

//#region MONGODB SCHEMES
//https://stackoverflow.com/questions/50316456/how-to-show-relationship-in-mongoose 
let exerciseSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    required: false,
  }
})

let userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  }
})

let User = mongoose.model('User', userSchema);
let Exercise = mongoose.model("Exercise", exerciseSchema)
//#endregion

//#region MONGODB FUNCTIONS
const createAndSaveUser = (user, done) => {
  let person = new User({
    username: user.username
  })

  person.save(function (err, data) {
    if (err) {
      console.error(err);
      done(err);
    }
    //console.log("Person created", data)
    done(null, data);
  })
};

const getAllUsers = (done) => {
  User.find(function(err, data){
    if (err) {
      console.error(err);
      done(err);
    }
    // console.log("People found", data)
    done(null , data);
  })
}

const createAndSaveExercise = (username, exercise, done) => {
  let exerciseModel = new Exercise({
    username: username,
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date
  })

  exerciseModel.save(function (err, data) {
    if (err) {
      console.error(err);
      done(err);
    }
    console.log("Exercise created", data)
    done(null, data);
  })
}
//#endregion

//#region Create a New User
app.post("/api/users", function (req, res) {
  //console.log(req.body)
  createAndSaveUser({
    username: req.body.username
  }, function (err, data) {
    if (err) {
      console.log("ERROR", err)
      res.json({"error": err});
    }

    //console.log("Al parecer todo ok: ", data)
    res.json({
      username: data.username,
      _id: data._id
    })
  })
})

app.get("/api/users", function (req, res) {
  getAllUsers(function (err, data){
    if (err) {
      console.log("ERROR", err)
      res.json({"error": err});
    }

    // console.log("Al parecer todo ok - GET ALL USERS: ", data)
    res.json(data)
  })
})

app.post("/api/users/:id/exercises", function (req, res) {
  let userid = req.params.id;
  let username = userid; //TODO: pending retrieve the username by id
  let exerciseToRegister = {
    description: req.body.description,
    duration: req.body.duration,
    date: req.body.date
  }
  createAndSaveExercise(username, exerciseToRegister, function (err, data){
    if (err) {
      console.log("ERROR", err)
      res.json({"error": err});
    }

    console.log("Al parecer todo ok - CREATE AND SAVE EXERCISE: ", data)
    res.json(data)
  })
})
//#endregion



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
