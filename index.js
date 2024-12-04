const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./config/db");
const User = require("./models/userModel");
const Exercise = require("./models/exerciseModel");

app.use(cors());
app.use(express.static("public"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

connectDB();

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});

app
  .route("/api/users")
  .post(async (req, res) => {
    console.log(req.body);

    try {
      const username = req.body.username;
      const user = new User({
        username: username,
      });

      const doc = await User.findOne({ username: username });

      console.log("doc: ", doc);

      if (doc) {
        return res.status(400).json({ error: "Username already exists" });
      }

      // Save the new user to the database
      await user.save();

      return res.json({
        username: user.username,
        _id: user._id,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  })
  .get(async (req, res) => {
    try {
      const users = await User.find({});
      res.json(
        users.map((e) => ({
          username: e.username,
          _id: e._id,
        }))
      );
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

app.post("/api/users/:_id/exercises", async (req, res) => {
  console.log(req.body);

  try {
    const userId = req.params._id;
    const { description, duration, date } = req.body;

    const isDateValid = Boolean(new Date(date).toDateString());

    if (!isDateValid) {
      res.status(400).json({ error: "Invalid date" });
      return;
    }

    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({ error: "user not found" });
      return;
    }

    const exercise = new Exercise({
      username: user.username,
      _id: user._id,
      description,
      duration,
      date: date ? new Date(date).toDateString() : new Date().toDateString(),
    });

    await exercise.save();

    return res.json({
      _id: user._id,
      username: user.username,
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/users/:_id/logs", async (req, res) => {
  try {
    const _id = req.params._id;

    const results = await Exercise.find({ _id: _id });

    console.log("results: ", results);

    return res.json({ log: results, count: results.length });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});
