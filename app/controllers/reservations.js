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
  var Bitly = require('bitly');
  var bitly = new Bitly('reservr', 'R_0f028c7d50e844f283a6c11b90600234');
  var mcapi = require('../../node_modules/mailchimp-api/mailchimp');
  var mc = new mcapi.Mailchimp('7c3195803dbe692180ed207d6406fec3-us8');
  
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

  var addUserToMailingList = function (reservation) {
    var params = {
      update_existing: true,
      double_optin: false,
      send_welcome: false,
      id: reservation.mclistid,
      email: {
        email: reservation.email
      },
      merge_vars: {
        FNAME: reservation.name.split(' ')[0] || '',
        LNAME:  reservation.name.split(' ')[1] || '' 
      }
    };

    mc.lists.subscribe(params, function(data) {
      console.log('success');
      console.log(data);

    }, function(err) {

      console.log('error');
      console.log(err);

    });
  };

  var create = function (req, res, next) {

    // setup text for the user email
    var userEmailSetup = {
      subject: 'Rezervarea a fost facuta',
      subjectAlt: 'Ai fost inclus pe lista de asteptare',
      text: 'Salut, <br /><br /> Ai facut o rezervare de %SEATS% locuri pentru evenimentul "%EVENTNAME%" de %EVENTDATE%. <br /><br /> O zi cat mai buna iti dorim.',
      textAlt: 'Salut, <br /><br /> Ai fost inclus pe lista de asteptare pentru %SEATS% locuri la evenimentul "%EVENTNAME%" de %EVENTDATE%. <br /><br /> Daca se elibereaza un loc te vom contacta. <br /><br /> O zi cat mai buna iti dorim.' 
    };

    // setup text for the owner email
    var ownerEmailSetup = {
      subject: 'O noua rezervare la "%EVENTNAME%"',
      text: 'Salut, <br /><br /> O noua rezervare de %SEATS% locuri a fost facuta pentru evenimentul "%EVENTNAME%" de %EVENTDATE% de catre %USERNAME%, %USEREMAIL%. <br /><br /> O zi cat mai buna iti dorim.'
    };
    
    req.checkBody('name', 'Va rugam sa completati numele.').notEmpty();
    req.checkBody('email', 'Va rugam sa completati email-ul.').notEmpty();
    req.checkBody('seats', 'Va rugam sa completati numarul de locuri.').notEmpty();

    var name = req.body.name.trim();
    var email = req.body.email.trim();
    var seats = req.body.seats;
    var waiting = req.body.waiting;
    var eventId = req.params.eventId;
    var mclistid = req.body.mclistid;

    // check if there is already a user that has a reservation with this email
    // if he does just update the number of seats
    // else proceed as before

    // loop through all reservations

    db.reservations.find({
      email: email
    }).exec(function (err, reservations) {
      
      if (reservations && reservations.length) {

        reservations.forEach(function (reservation) {
          
          if (reservation.eventId === eventId) {
            
            db.reservations.update( { eventId: eventId }, { $set: { seats: seats } }, {}, function (err, num) {

              if (num && num > 0) {

                res.json({
                  message: 'Create successful.',
                  reservation: reservation
                });

              }

            });

          }
        });

      } else {

        var errors = req.validationErrors();

        if (errors) {
          res.status(400).json(errors);
          return;
        }

        var reservation = {
          name: name,
          email: email,
          seats: seats,
          eventId: eventId,
          waiting: waiting,
          mclistid: mclistid
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
          theEvent.seats = parseInt(theEvent.seats);

          if ((theEvent.seats > 0 && theEvent.seats >= reservation.seats) || reservation.waiting === 'true') {


            if (!reservation.waiting || reservation.waiting === 'false') {
              
              theEvent.seats = theEvent.seats - reservation.seats;

            }
            
            
            // update the number of seats available
            db.events.update({'_id': theEvent._id}, theEvent, function (err, num, newEvent){


              // add the reservation to the database
              db.reservations.insert(reservation, function (err, newReservation) {

                if (err) {
                  res.status(400).json(err);
                  return;
                }


                // replace email template variables
                userEmailSetup.text = userEmailSetup.text.replace('%SEATS%', newReservation.seats);
                userEmailSetup.text = userEmailSetup.text.replace('%EVENTNAME%' , theEvent.name);
                userEmailSetup.text = userEmailSetup.text.replace('%EVENTDATE%' , moment(theEvent.date).format('dddd, Do MMMM YYYY, HH:mm'));

                // replace email template variables
                userEmailSetup.textAlt = userEmailSetup.textAlt.replace('%SEATS%', newReservation.seats);
                userEmailSetup.textAlt = userEmailSetup.textAlt.replace('%EVENTNAME%' , theEvent.name);
                userEmailSetup.textAlt = userEmailSetup.textAlt.replace('%EVENTDATE%' , moment(theEvent.date).format('dddd, Do MMMM YYYY, HH:mm'));

                // shorten reservation url
                var longUrl = 'http://reactor.reserver.net/reservations/userview/' + newReservation._id;

                bitly.shorten(longUrl, function(err, response) {

                  if (err) {
                    
                    console.log(err);
                  
                  } 

                  // send email to user
                  var short_url = response.data.url;

                  if(!process.env.OPENSHIFT_APP_NAME) {
                    
                    short_url = 'http://localhost:8080/reservations/userview/' + newReservation._id;
                  
                  }

                  //userEmailSetup.text = userEmailSetup.text.replace('%RESERVATIONURL%', short_url);

                  var emailParams = null;

                  // send mail to user
                  if (reservation.waiting === 'true') {
                    emailParams = {
                      from: config.email,
                      to: newReservation.email,
                      subject: userEmailSetup.subjectAlt,
                      html: userEmailSetup.textAlt
                    }

                  } else {

                    emailParams = {
                      from: config.email,
                      to: newReservation.email,
                      subject: userEmailSetup.subject,
                      html: userEmailSetup.text
                    }

                  }

                  transport.sendMail(emailParams, function (err, info) {
                    console.log(err);
                    console.log(info);
                  });
                
                });
                
                // replace template variables
                ownerEmailSetup.subject = ownerEmailSetup.subject.replace('%EVENTNAME%', theEvent.name);
                ownerEmailSetup.text = ownerEmailSetup.text.replace('%SEATS%', newReservation.seats);
                ownerEmailSetup.text = ownerEmailSetup.text.replace('%EVENTNAME%', theEvent.name);
                ownerEmailSetup.text = ownerEmailSetup.text.replace('%EVENTDATE%', moment(theEvent.date).format('dddd, Do MMMM YYYY, HH:mm'));
                ownerEmailSetup.text = ownerEmailSetup.text.replace('%USEREMAIL%', newReservation.email);
                ownerEmailSetup.text = ownerEmailSetup.text.replace('%USERNAME%', newReservation.name);

                var ownerEmail = 'sebi.kovacs@gmail.com';

                if (req.subdomains && req.subdomains.length === 1) {

                  ownerEmail = 'rezervari.reactor@yahoo.ro';
                
                }

                // send a mail to venue owner
                transport.sendMail({
                  from: config.email,
                  to: ownerEmail,
                  subject: ownerEmailSetup.subject,
                  html: ownerEmailSetup.text
                }, function (err, info) {
                  
                });

                // add user to mailing list
                if (newReservation.mclistid) {
                  addUserToMailingList(newReservation);
                }

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

  };

  var userView = function (req, res, next) {

    // find all reservations for event
    db.reservations.findOne({
      _id: req.params.reservationId
    }).exec(function (err, reservation) {


      if(err) {
        return res.render('reservation-user', {
          errors: err
        });
      }

      db.events.findOne({
        _id: reservation.eventId
      }).exec(function (err, ev) {

        var reservations = [];
        reservation.event = ev;
        reservations.push(reservation);

        if(err) {
          return res.render('reservation-user', {
            errors: err
          });
        }

        res.render('reservation-user', {
          reservations: reservations,
        });

      });

      

    });

  };

  var reservationDelete = function(req, res, next) {

    var reservationId = req.params.reservationId;
    var eventId = req.params.eventId;
    
    db.reservations.remove({
      _id: reservationId
    },function (err, num) {

      if (err) {
        res.render('reservations', {
          errors: err,
          reservations: []
        });
      }

      // redirect to reservations page
      res.redirect('/reservations/' + eventId);

    });

  };

  return {
    create: create,
    view: view,
    //update: update,
    reservationDelete: reservationDelete,
    userView: userView
  };

});
