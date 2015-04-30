/* reservations
 */

module.exports = (function(config, db) {
  'use strict';

  var express = require('express');
  var async = require('async');
  var fs = require('fs');
  var util = require('util');
  var moment = require('moment');
  var marked = require('marked');
  var nodemailer = require('nodemailer');
  var smtpTransport = require('nodemailer-smtp-transport');
  
  moment.locale('ro');

  // set up Mandrill transport
  var transport = nodemailer.createTransport(smtpTransport({
    host: 'smtp.mandrillapp.com',
    port: 587,
    auth: {
      user: 'contact@reservr.net',
      pass: 'cQ0Igd-t1LfoYOvFLkB0Xg'
    }
  }));

  // setup text for the user email
  var userEmailText = {
    subject: 'Rezervarea a fost facuta',
    text: 'Salut, \n Ai facut o rezervare de %SEATS% locuri pentru evenimentul "%EVENTNAME%" din data de %EVENTDATE% de la ora %EVENTTIME%. \n Poti modifica oricand rezervarea accesand acest link: %RESERVATIONURL%. \n O zi cat mai buna iti dorim.'
  };

  // setup text for the owner email
  var ownerEmailText = {
    subject: 'Rezervare la "%EVENTNAME%"',
    text: 'Salut, \n O noua rezervare de %SEATS% locuri a fost facuta pentru evenimentul "%EVENTNAME%" din data de %EVENTDATE% de catre %USEREMAIL%. \n O zi cat mai buna iti dorim.'
  };

  var create = function (req, res, next) {
    
    req.checkBody('email', 'Va rugam sa completati email-ul.').notEmpty();
    req.checkBody('seats', 'Va rugam sa completati numarul de locuri.').notEmpty();

    var email = req.body.email.trim();
    var seats = req.body.seats.trim();
    var eventId = req.params.eventId;


    var errors = req.validationErrors();

    if (errors) {
      res.status(400).json(errors);
      return;
    }

    var reservation = {
      email: email,
      seats: seats,
      eventId: eventId
    };

    db.reservations.insert(reservation, function (err, newReservation) {

      if (err) {
        res.status(400).json(err);
        return;
      }

      // find event and get details

      db.events.findOne({
        _id: newReservation.eventId
      }).exec(function (err, theEvent) {

        if(err) {
          res.status(400).json(err);
        }

        // replace template variables
        userEmailText.text = userEmailText.text.replace('%SEATS%', newReservation.seats);
        userEmailText.text = userEmailText.text.replace('%EVENTNAME%' , theEvent.name);
        userEmailText.text = userEmailText.text.replace('%EVENTDATE%' , theEvent.date);
        userEmailText.text = userEmailText.text.replace('%EVENTTIME%' , theEvent.date);
        userEmailText.text = userEmailText.text.replace('%RESERVATIONURL%','http://reserver.net/' + theEvent._id + newReservation._id);
        
        // send mail to user
        transport.sendMail({
            from: config.email,
            to: email,
            subject: userEmailText.subject,
            text: userEmailText.text
        }, function (err, info) {
          console.log(err);
          console.log(info);
        });

        // replace template variables

        // send a mail to venue owner
        transport.sendMail({
            from: config.email,
            to: 'sebi.kovacs@gmail.com',
            subject: 'hello',
            text: 'hello world! ' + new Date().getTime()
        }, function (err, info) {
          console.log(err);
          console.log(info);
        });



      });

      // shorten url

      

      // adjust the number of available seats

      

      // send response to client
      res.json({
        message: 'Create successful.',
        reservation: newReservation
      });

    });

  };

  return {
    create: create
  };

});
