var Datastore = require('nedb');

module.exports = function(app){
  app.db = {};
  app.db.projects = new Datastore({ filename: __dirname + '/dbs/projects.db', autoload: true });
  app.db.work = new Datastore({ filename: __dirname + '/dbs/work.db', autoload: true });
};
