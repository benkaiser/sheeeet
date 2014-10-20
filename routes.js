app = null;

module.exports = function(app, io){
  app = app;
  // send down the app
  app.get("/", homeRoute);

  // socket connections
  io.on('connection', function(socket){
    // emit the inital page data
    socket.emit('page_data', {});
  });
};

function homeRoute(req, res){
  res.render("index");
}
