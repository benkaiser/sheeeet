app = null;

module.exports = function(app, io){
  app = app;
  // send down the app
  app.get("/", homeRoute);

  // socket connections
  io.on("connection", function(socket){
    // send back the basic data when app is connected
    socket.on("app_connected", function(){
      // fetch all data
      app.db.projects.find({}, function(err, projects){
        app.db.work.find({}, function(err, work){
          socket.emit("data", {projects: projects, work: work});
        });
      });
    });
  });
};

function homeRoute(req, res){
  res.render("index");
}
