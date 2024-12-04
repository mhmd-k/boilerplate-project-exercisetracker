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

    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({ error: "user not found" });
      return;
    }

    const exercise = new Exercise({
      username: user.username,
      description,
      duration,
      date: date ? new Date(date).toDateString() : new Date().toDateString(),
    });

    await exercise.save();

    return res.json({
      username: user.username,
      _id: user._id,
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
    const _id = req.params._id; // Extract user ID from route parameters
    const { from, to, limit } = req.query; // Extract query parameters

    console.log("Query Parameters:", { from, to, limit });

    // Validate the user ID exists
    const user = await User.findById(_id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Build the query for exercises
    let query = { _id };

    // Add date filtering conditions
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from); // Convert 'from' to Date and add to query
      if (to) query.date.$lte = new Date(to); // Convert 'to' to Date and add to query
    }

    console.log("MongoDB Query:", query);

    // Fetch logs from the database
    let logs = await Exercise.find({ username: user.username })
      .sort({ date: 1 }) // Sort logs by date
      .limit(limit ? parseInt(limit) : undefined); // Apply limit if provided

    // Respond with the logs and count
    return res.json({
      username: user.username,
      count: logs.length,
      log: logs.map((log) => ({
        description: log.description,
        duration: log.duration,
        date: log.date,
      })),
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});
