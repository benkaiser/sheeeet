// init socket connection
var socket = io.connect("http://"+window.location.host);

// utility functions
function render(template, data){
  return swig.render($(template).html(), {locals: data});
}

// collections
var ProjectCollection = Backbone.Collection.extend({});
var WorkCollection = Backbone.Collection.extend({});
// instances of the collections
var projects = new ProjectCollection();
var work = new WorkCollection();

// socket.io actions
socket.on("connect", function(){
  socket.emit("app_connected");
});
socket.on("data", function(data){

  // only start the routing when the data is loaded
  if(!Backbone.History.started){
    Backbone.history.start({pushState: false});
  }
});

// setup the backbone app and router
App = new Backbone.Marionette.Application();

// set the regions on the page
App.addRegions({
  contentRegion: "#contentContainer",
});

var Router = Backbone.Router.extend({
  cv: null, // content view
  routes: {
    "": "home",
    "home": "home",
  },
  home: function(id){
    console.log("Home");
    this.cv = new HomeView({});
    App.contentRegion.show(this.cv);
  }
});


var sections;
App.addInitializer(function(options) {
  this.router = new Router();
});

var HomeView = Backbone.View.extend({
  template: "#home_view",
  events: {},
  initialize: function() {

  },
  render: function() {
    this.$el.html(render(this.template, {projects: projects.where({})}));
  }
});

App.start();
