// init socket connection
var socket = io.connect("http://"+window.location.host);

// utility functions
function render(template, data){
  return swig.render($(template).html(), {locals: data});
}

function secondsToTime(secs){
  console.log(secs);
  secs = Math.round(secs);
  var hours = Math.floor(secs / (60 * 60));
  var divisor_for_minutes = secs % (60 * 60);
  var minutes = Math.floor(divisor_for_minutes / 60);
  var divisor_for_seconds = divisor_for_minutes % 60;
  var seconds = Math.ceil(divisor_for_seconds);
  var obj = {"h": hours, "m": minutes, "s": seconds};
  return obj;
}

function formatTime(seconds){
  var time = secondsToTime(seconds);
  return pad(time.h, 2) + ":" + pad(time.m, 2) + ":" + pad(time.s, 2);
}

swig.setFilter('formatTime', formatTime);

function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

// collections
var ProjectCollection = Backbone.Collection.extend({});
var WorkCollection = Backbone.Collection.extend({
  comparator: function(work){
    return -work.get('start');
  }
});
// instances of the collections
var projects = new ProjectCollection();
var work = new WorkCollection();

// socket.io actions
socket.on("connect", function(){
  socket.emit("app_connected");
});
socket.on("new_project", function(data){
  projects.add(data);
  // did we just add it?
  if(App.router.cv.name == "create_project"){
    App.router.navigate("home", true);
  }
});
socket.on("new_work", function(data){
  work.add(data);
  // did we just create it?
  if(App.router.cv.name == "view_project"){
    App.router.cv.render();
  }
});
socket.on("data", function(data){
  // init the projects
  projects.reset();
  projects.add(data.projects);
  // init the work items
  work.reset();
  work.add(data.work);
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
    "projects/create": "create",
    "projects/view/:id": "view"
  },
  home: function(){
    console.log("Home");
    this.cv = new HomeView({});
    App.contentRegion.show(this.cv);
  },
  create: function(){
    this.cv = new CreatProjectView({});
    App.contentRegion.show(this.cv);
  },
  view: function(id){
    this.cv = new ProjectView({id: id});
    App.contentRegion.show(this.cv);
  }
});


var sections;
App.addInitializer(function(options) {
  this.router = new Router();
});

var HomeView = Backbone.View.extend({
  template: "#home_view",
  events: {
    "click .view": "view",
    "click .edit": "edit",
    "click .archive": "archive",
    "click .delete": "delete"
  },
  initialize: function() {
  },
  render: function() {
    this.$el.html(render(this.template, {projects: projects.where({archived: false})}));
  },
  edit: function(ev){
    var _id = $(ev.target).attr("data-id");
    // TODO: create edit functionality
  },
  archive: function(ev){
    var _id = $(ev.target).attr("data-id");
    // update locally
    projects.findWhere({_id: _id}).set("archived", true);
    // update the server
    socket.emit("archive_project", {_id: _id});
    // redraw
    this.render();
  },
  delete: function(ev){
    var _id = $(ev.target).attr("data-id");
    // update locally
    projects.findWhere({_id: _id}).destroy();
    // update the server
    socket.emit("delete_project", {_id: _id});
    // redraw
    this.render();
  }
});

var ProjectView = Backbone.View.extend({
  name: "view_project",
  template: "#project_view",
  timer_placeholder: "00:00:00",
  events: {
    "click .start": "start",
    "click .pause,.resume": "pause",
    "click .stop": "stop"
  },
  initialize: function() {
    this.options.project = projects.findWhere({_id: this.options.id});
    this.options.breaks = [];
  },
  render: function() {
    this.$el.html(render(this.template, {project: this.options.project, work: work.where({project: this.options.id}), timer_placeholder: this.timer_placeholder}));
  },
  start: function(){
    this.options.is_paused = false;
    // set start time
    this.options.start_time = +new Date();
    // update the buttons
    $(".start").addClass("hide");
    $(".pause").removeClass("hide");
    $(".stop").removeClass("hide");
    // set interval for updating UI
    this.options.interval = setInterval(this.updateTime.bind(this), 1000);
    this.updateTime();
  },
  pause: function(){
    if(this.options.is_paused){
      var now = +new Date();
      this.options.breaks.push({
        start: this.options.last_paused,
        end: now,
        duration: now - this.options.last_paused
      });
      $(".pause").removeClass("hide");
      $(".resume").addClass("hide");
    } else {
      this.options.last_paused = +new Date();
      $(".pause").addClass("hide");
      $(".resume").removeClass("hide");
    }
    this.options.is_paused = !this.options.is_paused;
  },
  stop: function(){
    if(this.options.is_paused){
      this.pause();
    }
    // update the buttons
    $(".start").removeClass("hide");
    $(".pause").addClass("hide");
    $(".stop").addClass("hide");
    // clear interval
    clearInterval(this.options.interval);
    $("#timer").html(this.timer_placeholder);
    // send the data back to the server
    var now = +new Date();
    var work_item = {
      project: this.options.id,
      start: this.options.start_time,
      end: now,
      duration: this.calculateTotalTime(),
      breaks: this.options.breaks
    };
    // save to server
    socket.emit("add_work", work_item);
    // clear the data
    this.options.breaks = [];
  },
  // factor in breaks, and work out the total time worked
  calculateTotalTime: function(){
    // work out the total without the breaks
    var total;
    if(this.options.is_paused){
      // if we are still on a break, use the break start time as the end time
      total = this.options.last_paused - this.options.start_time;
    } else {
      total = (+new Date()) - this.options.start_time;
    }
    // factor in the breaks
    for(var i = 0; i < this.options.breaks.length; i++){
      total -= this.options.breaks[i].duration;
    }
    // return the total
    return total;
  },
  updateTime: function(){
    if(!this.options.is_paused){
      var now = +new Date();
      var time = secondsToTime(this.calculateTotalTime() / 1000);
      $("#timer").html(formatTime(time));
    }
  }
});

var CreatProjectView = Backbone.View.extend({
  name: "create_project",
  template: "#create_project_view",
  events: {
    "click .create": "create"
  },
  render: function() {
    this.$el.html(render(this.template, {projects: projects.where()}));
  },
  create: function() {
    var data = {
      title: this.$el.find("#title").val(),
      contact_name: this.$el.find("#contact_name").val(),
      rate: this.$el.find("#rate").val(),
      description: this.$el.find("#description").val(),
      archived: false
    };
    // update the server
    socket.emit("create_project", data);
  }
});

App.start();
