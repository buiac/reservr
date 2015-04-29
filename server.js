#!/bin/env node
/* server
 */

module.exports = (function() {
  'use strict';

  var express = require('express');
  var request = require('superagent');
  var async = require('async');
  var fs = require('fs');
  var knox = require('knox');
  var multer = require('multer');

  var bodyParser = require('body-parser');
  var errorhandler = require('errorhandler');
  var basicAuth = require('basic-auth-connect');

  var app = express();

  // validation library for whatever comes in through the forms
  var expressValidator = require('express-validator');

  // configs
  var config = require('./config/config.js');

  // Admin auth
  var adminAuth = function(req, res, next) {
    
    if(!process.env.OPENSHIFT_APP_NAME) {
      return next();
    }
    
    return basicAuth(function(user, pass) {
      return (user === config.admin.user && pass === config.admin.password);
    })(req, res, next);
    
  };

  // config express
  app.use(bodyParser.json({
    limit: '50mb'
  }));

  app.use(bodyParser.urlencoded({
    limit: '50mb',
    extended: true
  }));

  // config file uploads folder
  app.use(multer({ 
    dest: './data/media/',
    rename: function (fieldname, filename) {
      return filename;
    }
  }));

  app.use(expressValidator());

  app.set('views', __dirname + '/app/views');
  app.set('view engine', 'ejs');

  app.use(express.static(__dirname + config.publicDir));

  app.use(errorhandler());

  // datastore
  var Datastore = require('nedb');
  
  var db = new Datastore({
    filename: config.dataDir + config.dbDir + '/reservr.db',
    autoload: true
  });

  // events datastore
  db.events = new Datastore({
    filename: config.dataDir + config.dbDir + '/events.db',
    autoload: true
  });

  // controllers
  var main = require('./app/controllers/main.js')(config, db);
  var dashboard = require('./app/controllers/dashboard.js')(config, db);

  // routes
  app.get('/', adminAuth, main.view);
  app.get('/dashboard', adminAuth, dashboard.view);
  app.get('/dashboard/event', adminAuth, dashboard.eventEditView);
  app.get('/dashboard/event/:eventId', adminAuth, dashboard.eventEditView);
  app.post('/dashboard/event', dashboard.eventCreate);
  app.get('/dashboard/eventdelete/:eventId', dashboard.eventDelete);


  // start express server
  app.listen(config.port, config.ipAddress, function() {
    console.log(
      '%s: Node server started on %s:%d ...',
      Date(Date.now()),
      config.ipAddress,
      config.port
    );
  });

  return app;

}());
