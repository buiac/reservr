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
  var userEmailSetup = {
    subject: 'Rezervarea a fost facuta',
    text: 'Salut, \n Ai facut o rezervare de %SEATS% locuri pentru evenimentul "%EVENTNAME%" din data de %EVENTDATE% de la ora %EVENTTIME%. \n Poti modifica oricand rezervarea accesand acest link: %RESERVATIONURL%. \n O zi cat mai buna iti dorim.'
  };

  // setup text for the owner email
  var ownerEmailSetup = {
    subject: 'O noua rezervare la "%EVENTNAME%"',
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

    // find event and get details
    db.events.findOne({
      _id: reservation.eventId
    }).exec(function (err, theEvent) {

      if(err) {
        res.status(400).json(err);
      }

      // check if there are seats available
      reservation.seats = parseInt(reservation.seats);
      theEvent.seats = parseInt(theEvent.seats)
      

      if (theEvent.seats > reservation.seats) {

        theEvent.seats = theEvent.seats - reservation.seats;
        
        // update the number of seats available
        db.events.update({'_id': theEvent._id}, theEvent, function (err, num, newEvent){

          // add the reservation to the database
          db.reservations.insert(reservation, function (err, newReservation) {

            if (err) {
              res.status(400).json(err);
              return;
            }

            // TODO shorten reservation url

            // replace email template variables
            userEmailSetup.text = userEmailSetup.text.replace('%SEATS%', newReservation.seats);
            userEmailSetup.text = userEmailSetup.text.replace('%EVENTNAME%' , theEvent.name);
            userEmailSetup.text = userEmailSetup.text.replace('%EVENTDATE%' , theEvent.date);
            userEmailSetup.text = userEmailSetup.text.replace('%EVENTTIME%' , theEvent.date);
            userEmailSetup.text = userEmailSetup.text.replace('%RESERVATIONURL%','http://reserver.net/' + theEvent._id + newReservation._id);

            // send mail to user
            transport.sendMail({
              from: config.email,
              to: newReservation.email,
              subject: userEmailSetup.subject,
              text: userEmailSetup.text
            }, function (err, info) {
              
              console.log(err);
              console.log(info);

            });

            // replace template variables
            ownerEmailSetup.subject = ownerEmailSetup.subject.replace('%EVENTNAME%', theEvent.name);
            ownerEmailSetup.text = ownerEmailSetup.text.replace('%SEATS%', newReservation.seats);
            ownerEmailSetup.text = ownerEmailSetup.text.replace('%EVENTNAME%', theEvent.name);
            ownerEmailSetup.text = ownerEmailSetup.text.replace('%EVENTDATE%', theEvent.date);
            ownerEmailSetup.text = ownerEmailSetup.text.replace('%USEREMAIL%', newReservation.email);

            // send a mail to venue owner
            transport.sendMail({
              from: config.email,
              to: 'sebi.kovacs@gmail.com',
              subject: ownerEmailSetup.subject,
              text: ownerEmailSetup.text
            }, function (err, info) {
              
              console.log(err);
              console.log(info);  
              
            });

            // send response to client
            res.json({
              message: 'Create successful.',
              reservation: newReservation
            });

          });

        });
      
      } else {

        res.status(400).json({msg: 'Ne pare rau. Numarul locurilor rezervate e mai mare decat numarul locurilor disponibile. Actualizati pagina pentru a vedea numarul exact al locurilor disponibile.'});

      }

    });

  };

  var view = function (req, res, next) {
    

    // find all reservations for event
    db.reservations.find({
      eventId: req.params.eventId
    }).exec(function (err, reservations) {

      if(err) {
        return res.render('reservations', {
          errors: err
        });
      }

      res.render('reservations', {
        reservations: reservations
      });

    });

  }

  return {
    create: create,
    view: view
  };

});
