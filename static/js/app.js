// utility functions
function render(template, data){
  return swig.render($(template).html(), {locals: data});
}

// setup the backbone app and router
App = new Backbone.Marionette.Application();

// set the regions on the page
App.addRegions({
  surveyRegion: "#surveyContainer",
});

var Router = Backbone.Router.extend({
  cv: null, // content view
  routes: {
    '': 'home',
    "home": "home",
  },
  home: function(id){
    this.cv = new HomeView({});
    if(this.pv) this.pv.show();
    WyltApp.contentRegion.show(this.cv);
    this.track('home', '/home');
  }
});


var sections;
App.addInitializer(function(options) {
  // load the survey view
  this.cv = new SurveyView({});
  App.surveyRegion.show(this.cv);
});

var SurveyView = Backbone.View.extend({
  template: "#survey_template",
  end_template: "#end_template",
  save_template: "#save_template",
  events: {
    "click #next": "nextSection",
    "click #prev": "prevSection"
  },
  initialize: function() {
    // initialise survey
    this.count = 0;
    this.current_fields = [];
  },
  render: function() {

  }
});

App.start();
