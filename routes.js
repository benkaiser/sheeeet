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
    // creating a new project
    socket.on("create_project", function(data){
      app.db.projects.insert(data, function(err, doc){
        socket.emit("new_project", doc);
      });
    });
    // archive project
    socket.on("archive_project", function(data){
      app.db.projects.update({_id: data._id}, {$set: {archived: true}});
    });
    // delete project
    socket.on("delete_project", function(data){
      app.db.projects.remove({_id: data._id});
    });
  });
};

function homeRoute(req, res){
  res.render("index");
}
