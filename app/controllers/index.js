/* main
 */

module.exports = (function(config, db) {
  'use strict';

  var express = require('express');
  var async = require('async');
  var fs = require('fs');
  var util = require('util');
  var moment = require('moment');
  var marked = require('marked');

  var view = function(req, res, next) {

    var startDate = req.query.startDate || '';
    var endDate = req.query.endDate || '';
    
    var defaultInterval = moment().add(7, 'days');
    
    var intervals = [];
    
    intervals.push({
      label: '7 zile',
      startDate: moment().format('YYYY-MM-DD'),
      endDate: defaultInterval.format('YYYY-MM-DD')
    });
    
    intervals.push({
      label: '30 de zile',
      startDate: moment().format('YYYY-MM-DD'),
      endDate: moment().add(30, 'days').format('YYYY-MM-DD')
    });
    
    intervals.push({
      label: '3 luni',
      startDate: moment().format('YYYY-MM-DD'),
      endDate: moment().add(3, 'months').format('YYYY-MM-DD')
    });
        
    var dateFilters = {
      $lte: defaultInterval
    };
    
    if(startDate) {
      dateFilters.$gte = new Date(startDate);
    } else {
      startDate = moment().format('YYYY-MM-DD');
    }
    
    if(endDate) {
      dateFilters.$lte = new Date(endDate); 
    } else {
      endDate = moment(defaultInterval).format('YYYY-MM-DD');
    }
    
    db.events
    .find({
      date: dateFilters
    })
    .sort({
      date: -1
    })
    .exec(function (err, events) {
      
      res.render('index', {
        events: events,
        startDate: startDate,
        endDate: endDate,
        intervals: intervals,
        
        moment: moment,
        marked: marked
      });
      
    });
    

  };

  return {
    view: view
  };

});
