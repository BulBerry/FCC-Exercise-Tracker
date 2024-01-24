const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");

mongoose
  .connect(process.env.MONGO_URI)
  .then((result) => {
    console.log("connected");
  })
  .catch((err) => {
    console.error(err);
  });
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
});
const exerciseSchema = new mongoose.Schema({
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
  },
  user_id: {
    type: String,
    required: true,
  },
});
const User = mongoose.model("User", userSchema);
const Exercise = mongoose.model("Exercise", exerciseSchema);

app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});
app.get("/api/users", async (req, res) => {
  const userList = await User.find().select("_id username").exec();
  if (!userList) {
    res.json("No Users");
  } else {
    res.json(userList);
  }
});
app.get("/api/users/:_id/logs", async (req, res) => {
  var activityCount;
  await Exercise.countDocuments({ user_id: req.params._id })
    .then((count) => {
      activityCount = count;
      console.log("count = " + count);
    })
    .catch((err) => {
      console.error(err);
    });
  //console.log(activityCount)
  let userData = await Exercise.find({ user_id: req.params._id })
    .limit(parseInt(req.query.limit) ?? 500)
    // .from(
    //   new Date(req.query.from).catch((e) => {
    //     console.error(e);
    //   })
    // )
    // .to(new Date(req.query.to) ?? new Date())
    .catch((err) => {
      console.error(err);
    });

  console.log("userData " + userData);
  console.log("userData[0] " + userData[0].username);
  res.json({
    username: userData[0].username,
    count: activityCount,
    _id: userData[0].user_id,
    log: userData.map((item) => ({
      description: item.description,
      duration: item.duration,
      date: item.date.toDateString(),
    })),
  });
});

app.post("/api/users", async (req, res) => {
  //console.log(req.body.username);
  let foundUser = await User.findOne({ username: req.body.username }).exec();
  if (!foundUser) {
    let newUser = await new User({
      username: req.body.username,
    });
    newUser
      .save()
      .then((result) => {
        //console.log(result);
        res.json({
          username: result.username,
          _id: result._id,
        });
      })
      .catch((err) => {
        console.error(err);
      });
  } else {
    res.json({
      username: foundUser.username,
      _id: foundUser._id,
    });
  }
});
app.post("/api/users/:_id/exercises", async (req, res) => {
  let foundData = await User.findById(req.params._id).exec();
  if (foundData) {
    // let currentDate;
    // if (!req.body.date) {
    //   currentDate
    //    = new Date();
    // } else currentDate = req.body.date;
    let exercisesData = await new Exercise({
      username: foundData.username.toString(),
      description: req.body.description.toString(),
      duration: req.body.duration,
      date: req.body.date ? new Date(req.body.date) : new Date(),
      user_id: req.params._id.toString(),
    });
    exercisesData
      .save()
      .then((result) => {
        res.json({
          username: result.username,
          description: result.description,
          duration: result.duration,
          date: new Date(result.date).toDateString(),
          _id: result.user_id,
        });
      })
      .catch((err) => {
        console.error(err);
      });
  } else {
    res.json("found nothing ");
  }
});
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
