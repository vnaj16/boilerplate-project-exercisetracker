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
let userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  }
})

let User = mongoose.model('User', userSchema);
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
    console.log("Person created", data)
    done(null, data);
  })
};
//#endregion

//#region Create a New User
app.post("/api/users", function (req, res) {
  console.log(req.body)
  createAndSaveUser({
    username: req.body.username
  }, function (err, data) {
    if (err) {
      console.log("ERROR", err)
      res.json({"error": err});
    }

    console.log("Al parecer todo ok: ", data)
    res.json({
      username: data.username,
      _id: data._id
    })
  })
})

app.get("/api/users", function (req, res) {

})
//#endregion



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
