const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const dns = require("dns");
require("dotenv").config();

dns.setServers(["8.8.8.8", "8.8.4.4"]);

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
});

const TeamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  score: {
    type: Number,
    default: 0,
  },
});

const EventSchema = new mongoose.Schema({
  time: {
    type: String,
    required: true,
  },
  team: {
    type: String,
    required: true,
  },
  points: {
    type: Number,
    required: true,
  },
  events: {
    type: String,
    required: true,
  },
});

const SchoolSchema = new mongoose.Schema({
  schoolName: {
    type: String,
    required: true,
  },
  programName: {
    type: String,
    required: true,
  },
  numberOfDays: {
    type: Number,
    required: true,
  },
  participants: {
    type: Number,
    required: true,
  },
  startDate: {
    type: String,
    required: true,
  },
  endDate: {
    type: String,
    required: true,
  },
  teamNames: {
    type: [TeamSchema],
    default: [],
  },
  eventLog: {
    type: [[EventSchema]],
    default: [],
  },
});

const DatabaseSchema = new mongoose.Schema({
  users: {
    type: [UserSchema],
    default: [],
  },
  schools: {
    type: [SchoolSchema],
    default: [],
  },
});

let data;

mongoose
  .connect(
    "mongodb+srv://entercontech:Tech@11Entercon@cluster0.lpvcsca.mongodb.net/entercon?appName=Cluster0"
  )
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => console.log("MongoDB connection error:", err));

const entercon = mongoose.model("entercon", DatabaseSchema, "entercon");

app.get("/add-users", async (req, res) => {
  try {
    const { username, role, password } = req.query;

    await entercon.updateOne(
      {},
      {
        $push: {
          users: {
            name: username,
            role,
            password,
          },
        },
      },
    );

    const updatedDb = await entercon.findOne();

    res.send(updatedDb.users);
  } catch (err) {
    console.log(err);
    res.status(500).send("Server Error");
  }
});

app.get("/update-users", async (req, res) => {
  try {
    const { name, password, role, i } = req.query;

    const index = Number(i);

    const db = await entercon.findOne();

    if (!db) {
      return res.status(404).json({
        success: false,
        message: "Database not found",
      });
    }

    if (isNaN(index) || index < 0 || index >= db.users.length) {
      return res.status(400).json({
        success: false,
        message: "Invalid user index",
      });
    }

    const result = await entercon.updateOne(
      {},
      {
        $set: {
          [`users.${index}.name`]: name,
          [`users.${index}.password`]: password,
          [`users.${index}.role`]: role,
        },
      }
    );


    const updatedDb = await entercon.findOne();

    res.send(updatedDb.users);
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

app.get("/delete-users", async (req, res) => {
  try {
    const index = Number(req.query.i);

    const db = await entercon.findOne();


    const users = [...db.users];
    users.splice(index, 1);

    const result = await entercon.updateOne(
      {},
      {
        $set: { users },
      },
    );


    const updatedDb = await entercon.findOne();


    res.send(updatedDb.users);
  } catch (err) {
    console.log(err);
    res.status(500).send("Server Error");
  }
});

app.get("/update-school", async (req, res) => {
  try {
    const {
      i,
      schoolName,
      programName,
      numberOfDays,
      participants,
      startDate,
      endDate,
      selectedTeams,
    } = req.query;

    const index = Number(i);

    const db = await entercon.findOne();

    if (!db) {
      return res.status(404).json({
        success: false,
        message: "Database not found",
      });
    }

    if (isNaN(index) || index < 0 || index >= db.schools.length) {
      return res.status(400).json({
        success: false,
        message: "Invalid school index",
      });
    }

    const oldSchool = JSON.parse(
      JSON.stringify(db.schools[index])
    );

    const teamNames = selectedTeams.split(",").map((team) => ({
      name: team,
      score:
        oldSchool.teamNames.find((t) => t.name === team)?.score || 0,
    }));

    const result = await entercon.updateOne(
      {},
      {
        $set: {
          [`schools.${index}.schoolName`]: schoolName,
          [`schools.${index}.programName`]: programName,
          [`schools.${index}.numberOfDays`]: Number(numberOfDays),
          [`schools.${index}.participants`]: Number(participants),
          [`schools.${index}.startDate`]: startDate,
          [`schools.${index}.endDate`]: endDate,
          [`schools.${index}.teamNames`]: teamNames,
        },
      }
    );


    const updatedDb = await entercon.findOne();

    res.send(updatedDb.schools);
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

app.get("/add-school", async (req, res) => {
  try {
    const db = await entercon.findOne();

    if (!db) {
      return res.status(404).json({
        success: false,
        message: "Database not found",
      });
    }

    const selectedTeams = req.query.selectedTeams.split(",");

    const teamNames = selectedTeams.map((team) => ({
      name: team,
      score: 0,
    }));

    const numberOfDays = Number(req.query.numberOfDays);

    const eventLog = Array.from(
      { length: numberOfDays },
      () => []
    );

    const entry = {
      schoolName: req.query.schoolName,
      programName: req.query.programName,
      numberOfDays,
      participants: Number(req.query.participants),
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      teamNames,
      eventLog,
    };

    const result = await entercon.updateOne(
      {},
      {
        $push: {
          schools: entry,
        },
      }
    );


    const updatedDb = await entercon.findOne();

    res.send(updatedDb.schools);
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

app.get("/delete-school", async (req, res) => {
  try {
    const index = Number(req.query.i);

    const db = await entercon.findOne();

    if (!db) {
      return res.status(404).json({
        success: false,
        message: "Database not found",
      });
    }

    if (isNaN(index) || index < 0 || index >= db.schools.length) {
      return res.status(400).json({
        success: false,
        message: "Invalid school index",
      });
    }

    const schools = JSON.parse(JSON.stringify(db.schools));

    schools.splice(index, 1);

    const result = await entercon.updateOne(
      {},
      {
        $set: { schools },
      }
    );


    const updatedDb = await entercon.findOne();

    res.send(updatedDb.schools);
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

app.get("/add-points", async (req, res) => {
  try {
    const dayIndex = Number(req.query.dayIndex);
    const teamName = req.query.teamName;
    const points = Number(req.query.points);
    const event = req.query.event;
    const time = req.query.time;
    const schoolIndex = Number(req.query.schoolIndex);

    const db = await entercon.findOne();

    if (!db) {
      return res.status(404).json({
        success: false,
        message: "Database not found",
      });
    }

    const schools = JSON.parse(JSON.stringify(db.schools));

    const school = schools[schoolIndex];

    if (!school) {
      return res.status(404).json({
        success: false,
        message: "School not found",
      });
    }

    school.eventLog[dayIndex].push({
      time,
      team: teamName,
      points,
      events: event,
    });

    const team = school.teamNames.find(
      (t) => t.name === teamName
    );

    if (team) {
      team.score += points;
    }

    const result = await entercon.updateOne(
      {},
      {
        $set: { schools },
      }
    );


    const updatedDb = await entercon.findOne();

    res.send(updatedDb.schools);
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

app.get("/undo-points", async (req, res) => {
  try {
    const dayIndex = Number(req.query.dayIndex);
    const schoolIndex = Number(req.query.matchingIndex);
    const index = Number(req.query.index);

    const db = await entercon.findOne();

    if (!db) {
      return res.status(404).json({
        success: false,
        message: "Database not found",
      });
    }

    const schools = JSON.parse(JSON.stringify(db.schools));

    const school = schools[schoolIndex];

    if (!school) {
      return res.status(404).json({
        success: false,
        message: "School not found",
      });
    }

    const dayEvents = school.eventLog[dayIndex - 1];

    if (!dayEvents || !dayEvents[index]) {
      return res.status(400).json({
        success: false,
        message: "Event not found",
      });
    }

    const deletedEvent = dayEvents[index];

    const team = school.teamNames.find(
      (t) => t.name === deletedEvent.team
    );

    if (team) {
      team.score -= deletedEvent.points;
    }

    dayEvents.splice(index, 1);

    const result = await entercon.updateOne(
      {},
      {
        $set: { schools },
      }
    );

    const updatedDb = await entercon.findOne();

    res.send(updatedDb.schools);
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

app.get("/get-data", async (req, res) => {
  try {
    const db = await entercon.findOne();

    if (!db) {
      return res.status(404).json({
        success: false,
        message: "Database not found",
      });
    }

    res.json(db.schools);
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

app.get("/", (req, res) => {
  entercon
    .find()
    .then((s) => res.send(s))
    .catch((err) => console.log(err));
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
