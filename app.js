var path = require("path");
var express = require("express");
var session = require("express-session");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
var mkdirp = require("mkdirp");

// init the app and socket.io
var app = express();
var http = require("http").Server(app);
var io = require("socket.io")(http);

module.exports = app;

// make sure the dbs directory is present
mkdirp(__dirname + "/dbs", function(){
  // attach the db to the app
  require(__dirname + "/db.js")(app);
});

// all environments
app.set("port", process.env.PORT || 5335);
// use swig for templating
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "html");
app.set("root", __dirname);
app.engine("html", require("swig").renderFile);
// regular express stuff
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(session({
  name: "connect.sid_sheeeet",
  secret: "encryptionsecretforsheeeet",
  saveUninitialized: true,
  resave: true,
}));
// surve the static dir
app.use("/static", express.static(__dirname + "/static"));

// run all the routes
require("./routes")(app, io);

// start the server
http.listen(app.get("port"), function() {
  console.log("listening on " + app.get("port"));
});
