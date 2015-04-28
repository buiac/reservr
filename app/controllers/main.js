/* main
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

  var view = function(req, res, next) {

    res.render('main', {
      moment: moment
    });

  };

  return {
    view: view
  };

});
