require("dotenv").config(); //connect .env file
require("./config/dbConnection"); //connection to the database

var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const cors = require("cors");
const session = require("express-session");
const mongoose = require("mongoose");
const MongoStore = require("connect-mongo")(session);
const _DEV_MODE = false;

var app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL, // White list of clients, allowing specific domains to communicate with the api.
    credentials: true, //Allow client to send cookies.
  })
);

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    store: new MongoStore({ mongooseConnection: mongoose.connection }), //Persist the session in the database
    saveUninitialized: true,
    resave: true,
    secret: process.env.SESSION_SECRET,
  })
);

if (_DEV_MODE) {
  const User = require("./models/User");

  app.use((req, res, next) => {
    User.findOne({}) //Get a user from the DB (doesn't matter which)
      .then((userDocument) => {
        req.session.currentUser = userDocument._id; // Set that user as the loggedin user by puutin him the session.
      })
      .catch((error) => {
        console.log(error);
      })
      .finally(() => {
        // .finaly() will be called no matter if the promise failed or succeeded so we can safely call our next function here.
        next();
      });
  });
}
// Router

// var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var authRouter = require("./routes/auth");

// app.use("/", indexRouter);
app.use("/newsPaper/users", usersRouter);
app.use("/newsPaper/auth", authRouter);

if (process.env.NODE_ENV === "production") {
  app.use("*", (req, res, next) => {
    // If no routes match, send them the React HTML.
    res.sendFile(__dirname + "/public/index.html");
  });
}

//Midldeware that handles a ressource that wasn't found

app.use((req, res, next) => {
  res.status(404).json({
    message: `The ressource you try to request doesn't exist. Method: ${req.method} path: ${req.originalUrl}`,
  });
});

// if (process.env.NODE_ENV === "production") {
//   app.use("*", (req, res, next) => {
//     res.sendFile(__dirname + "/public/index.html");
//   });
// }
//Midllewares that handles errors, as soon as you pass some data to your next() function
// ex: next("toto"). you will end up in this middleware function

app.use((error, req, res, next) => {
  console.log(error);
  error.status = error.status || 500;
  res.json(error);
});

module.exports = app;
