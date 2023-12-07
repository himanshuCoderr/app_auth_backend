const express = require("express");
const app = express();
const mongoose = require("mongoose");
const { Schema } = mongoose;
const bodyparser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcrypt");

// Some Needed Middlewares

app.use("/registerPerson", express.json());
app.use(cors());

// Connecting MongoDb
connectDb();

function connectDb() {
  mongoose
    .connect("mongodb://127.0.0.1:27017/auth_app")
    .then(() => {
      console.log("database Connected");
    })
    .catch((err) => {
      console.log(err);
    });
}

// Defining Schema

const registrationSchema = new Schema({
  name: String,
  user_name: {
    type: String,
    unique: true,
  },
  email: {
    type: String,
    unique: true,
  },
  password: String,
  acceptTc: Boolean,
});

// Model

const registrationModel = mongoose.model("Registration", registrationSchema);

// API FOR LOGIN
app.post("/getRegisteredData", express.json(), async (req, res) => {
  try {
    const user = await registrationModel.findOne({ email: req.body.email });

    if (!user) {
      // User not found
      res.status(404).send("User not found");
      return;
    }

    const checkVerify = await bcrypt.compare(req.body.password, user.password);

    if (checkVerify) {
      console.log(user);
      res.status(200).send("Exists");
    } else {
      res.send("notExists");
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

// API FOR REGISTRATION
app.post("/registerPerson", async (req, res) => {
  try {
    const user = await registrationModel.findOne({
      $or: [{ email: req.body.email }, { user_name: req.body.user_name }],
    });

    console.log(user);

    if (user && user.email && user.user_name) {
      console.log("Hey user exists");
      res.send("exists");
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashedPass = await bcrypt.hash(req.body.password, salt);
      const doc = new registrationModel({ ...req.body, password: hashedPass });
      await doc.save();
      console.log("Hey new user created");
      res.sendStatus(200);
    }
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.listen("5000", () => {
  console.log("Server started");
});
