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

const getUserById = (id, done) => {
  User.findById(id, function (err, data) {
    if (err) {
      console.error(err);
      done(err);
    }
    console.log("User found", data)
    done(null, data);
  })
}

const getAllUsers = (done) => {
  User.find(function (err, data) {
    if (err) {
      console.error(err);
      done(err);
    }
    // console.log("People found", data)
    done(null, data);
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

const getExercisesByUsername = (username, filters, done) => {
  let dateFilterObject = null;
  let from = filters.from;
  let to = filters.to;
  if (from && to) {
    dateFilterObject = { $gte: new Date(filters.from), $lte: new Date(filters.to) };
  }
  else if (from) {
    dateFilterObject = { $gte: new Date(filters.from) };
  }
  else if (to) {
    dateFilterObject = { $lte: new Date(filters.to) };
  }

  let filterToApply = { username: username }

  if (dateFilterObject) {
    filterToApply.date = dateFilterObject
  }

  Exercise.find(filterToApply)
    .limit(filters.limit ? parseInt(filters.limit) : 100)
    .exec(function (err, data) {
      if (err) {
        console.error(err);
        done(err);
      }
      console.log("Filters applied", filters)
      console.log("Exercises found", data)
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
      res.json({ "error": err });
    }

    //console.log("Al parecer todo ok: ", data)
    res.json({
      username: data.username,
      _id: data._id
    })
  })
})

app.get("/api/users", function (req, res) {
  getAllUsers(function (err, data) {
    if (err) {
      console.log("ERROR", err)
      res.json({ "error": err });
    }

    // console.log("Al parecer todo ok - GET ALL USERS: ", data)
    res.json(data)
  })
})

app.post("/api/users/:id/exercises", function (req, res) {
  console.log(req.body)
  let userid = req.params.id;
  getUserById(userid, function (err, foundUser) {
    let username = foundUser.username;
    let dateToRegiser = req.body.date;

    if (!dateToRegiser) {
      dateToRegiser = new Date();
    }

    let exerciseToRegister = {
      description: req.body.description,
      duration: req.body.duration,
      date: dateToRegiser
    }
    createAndSaveExercise(username, exerciseToRegister, function (err, data) {
      if (err) {
        console.log("ERROR", err)
        res.json({ "error": err });
      }

      console.log("Al parecer todo ok - CREATE AND SAVE EXERCISE: ", data)
      let response = {
        _id: data._id.toString(),
        username: data.username,
        date: data.date.toDateString(),
        duration: data.duration,
        description: data.description
      }
      console.log("Response - Post Exercise", response)
      res.json(response)
    })
  })
})


app.get("/api/users/:id/logs", function (req, res) {
  // console.log(req.body)
  console.log("Query Params for Get Logs: ", req.query)
  let userid = req.params.id;
  getUserById(userid, function (err, foundUser) {
    let username = foundUser.username;
    let filters = {
      from: req.query.from,
      to: req.query.to,
      limit: req.query.limit
    }

    getExercisesByUsername(username, filters, function (err, exercises) {
      if (err) {
        console.log("ERROR", err)
        res.json({ "error": err });
      }

      // console.log("Al parecer todo ok - GET LOGS: ", exercises)
      let response = {
        username: username,
        count: exercises.length,
        _id: foundUser._id,
        log: exercises.map(e => {
          return {
            description: e.description,
            duration: e.duration,
            date: e.date.toDateString()
          }
        })
      }
      // console.log("Response", response)
      res.json(response)
    })
  })
})
//#endregion



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
