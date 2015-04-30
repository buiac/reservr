/* dashboard
 */

module.exports = (function(config, db) {
  'use strict';

  var express = require('express');
  var request = require('superagent');
  var async = require('async');
  var fs = require('fs');
  var mkdirp = require('mkdirp');
  var util = require('util');
  var moment = require('moment');
  var marked = require('marked');
  

  var eventEditView = function(req, res, next) {

    if (req.params.eventId) {

      db.events.findOne({
        _id: req.params.eventId
      }).exec(function (err, theEvent) {

        if(err) {
          return res.render('event-edit', {errors: err});
        }

        if (!theEvent) {
          theEvent = {};
        }

        res.render('event-edit', {
          errors: [],
          theEvent: theEvent
        });

      });

    } else {

      res.render('event-edit', {
        errors: [],
        theEvent: {}
      });

    }
    
    // res.render('event-edit', {errors: []});

  };

  var view = function(req, res, next) {

    db.events.find({})
    // .sort({
    //   date: -1
    // })
    .exec(function (err, events) {

      if(err) {
        return res.render('dashboard', {errors: err});
      }

      if (!events.length) {
        events = [];
      }

      for (var i = 0; i < events.length; i++) {
        events[i].description = marked(events[i].description)
      }

      res.render('dashboard', {
        events: events
      });

    });
  };

  var eventCreate = function(req, res, next) {

    req.checkBody('name', 'Event name should not be empty').notEmpty();
    req.checkBody('description', 'Event description should not be empty').notEmpty();
    req.checkBody('seats', 'Event seats should not be empty').notEmpty();

    var errors = req.validationErrors();
    var images = [];
    
    // check if there's an image
    if (!req.files.images) {

      errors = errors || [];

      errors.push({
        msg: 'Please upload an event image'
      });  

    } else if (!req.files.images.length) {

      images.push({
        path: '/media/' + req.files.images.originalname 
      });

    } else if (req.files.images.length) {

      req.files.images.forEach(function (image) {

        images.push({
          path: '/media/' + image.originalname
        });

      });

    }

    var name = (req.body.name) ? req.body.name.trim() : '';
    var description = (req.body.description) ? req.body.description.trim() : '';
    var eventId = (req.body._id) ? req.body._id.trim() : '';
    var seats = (req.body.seats) ? req.body.seats.trim() : '';

    var theEvent = {
      name: name,
      description: description,
      _id: eventId || '',
      images: images,
      date: new Date(req.body.date),
      seats: seats
    };


    if (errors) {

      res.render('event-edit', {
        theEvent: theEvent,
        errors: errors
      });

      return;

    }

    if (eventId) {

      db.events.update({'_id': eventId}, theEvent, function (err, num, newEvent) {

        if (err) {
          res.render('event-edit', {
            errors: err,
            theEvent: theEvent
          });
        }

        if (num > 0) {
          
          res.redirect('/dashboard');

        }


      });

    } else {

      db.events.insert(theEvent, function (err, newEvent) {

        if (err) {
          res.render('event-edit', {errors: err});
        }

        res.redirect('/dashboard');

      });

    }

  };

  var eventDelete = function(req, res, next) {

    var id = req.params.eventId;
    
    db.events.remove({
      _id: req.params.eventId
    },function (err, num) {

      if (err) {
        res.render('event-edit', {
          errors: err,
          theEvent: {}
        });
      }

      res.redirect('/dashboard');

    });

    // TODO delete images associated with an event

  };

  var list = function(req, res, next) {

    db.events.find({})
    // .sort({
    //   date: -1
    // })
    .exec(function (err, events) {

      if(err) {
        return res.send(err, 400);
      }

      if (!events.length) {
        events = [];
      }

    });

  };

  return {
    eventCreate: eventCreate,
    view: view,
    eventEditView : eventEditView,
    eventDelete: eventDelete
  };

});
