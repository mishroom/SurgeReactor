const RedisSMQ = require("rsmq");
const rsmq = new RedisSMQ( {host: "127.0.0.1", port: 6379, ns: "rsmq"} );
const RSMQWorker = require( "rsmq-worker" );
const workerMatch = new RSMQWorker( 'matches' );
const workerDriver = new RSMQWorker( "drivers" );
var redis = require('redis');
var client = redis.createClient();


workerDriver.on( "message", function( msg, next, id ) {
  let match = {};
  rsmq.getQueueAttributes({qname: 'riders'}, (err, resp) => {
    if (err) {
      console.log('ERR', err);
    } else {
      if (resp.msgs - resp.hiddenmsgs) {
        rsmq.receiveMessage({qname: 'riders'}, (err, resp) => {
          if (err) {
            console.log(err);
          } else {
            match.driver = JSON.parse(msg).driver;
            match.rider = JSON.parse(resp.message).rider;
            match.request_id = resp.id;
            console.log('GOT MATCH ', match);
            rsmq.sendMessage({qname: 'matches', message: JSON.stringify(match)}, function (err, resp) {
              if (err) {
                console.log(err);
              } else if (resp) {
              }
            });
            rsmq.deleteMessage({qname: 'riders', id: resp.id}, function (err, resp) {
              if (resp === 1) {
                console.log('Message deleted.');
              } else {
                console.log('Message not found.');
              }
            });
          }
        });
        workerDriver.del(id);
        next();
      } else {
        console.log('NO RIDERS KAY');
      }
    }
  });
  next(false);
});
workerDriver.on('error', function( err, msg ) {
  console.log( "DRIVER - WORKER ERROR", err, msg.id );
});
workerDriver.on('exceeded', function( msg ) {
  console.log( "DRIVER - WORKER EXCEEDED", msg.id );
});
workerDriver.on('timeout', function( msg ) {
  console.log( "DRIVER - WORKER TIMEOUT", msg.id, msg.rc );
});

workerMatch.on('message', function( msg, next, id ) {

  console.log(msg);
  const match = JSON.parse(msg);
  const {request_id, rider, driver} = match;
  
  // send to rider /matches
  const rider_match = {request_id: request_id, driver: driver, rider_id: rider.id};


  // send to driver /matchWithRider
  const driver_match = {request_id: request_id, driver_id: driver.id, rider: rider};

  // send to logger /requests
  let is_surged = true;
  client.get('surgeRatio', (err, reply) => {
    if (reply <= 1) {
      reply = 1;
      is_surged = false;
      const logger_match = {rider_id: rider.id, driver_id: driver.id, request_id: request_id, time_stamp: new Date(), is_surged: is_surged, surge_ratio: reply};
    }
  });
 

  // workerMatch.del(id);
  next();

});
workerMatch.on('error', function( err, msg ) {
  console.log( "MATCH - WORKER ERROR", err, msg.id );
});
workerMatch.on('exceeded', function( msg ) {
  console.log( "MATCH - WORKER EXCEEDED", msg.id );
});
workerMatch.on('timeout', function( msg ) {
  console.log( "MATCH - WORKER TIMEOUT", msg.id, msg.rc );
});

workerDriver.start();
workerMatch.start();

const makeData = (userType) => {
  let user = {};
  let obj = user[userType] = {};
  obj.id = Math.floor(Math.random() * (99999));
  obj.username = Math.random().toString(36).substring(7);
  obj.timestamp = new Date().toISOString();
  return JSON.stringify(user);
};

module.exports = {
  generateData: (quantity) => {

    const allUsers = {riders: [], drivers: []};

    console.log(`Adding ${quantity} riders and drivers`);

    for (var i = 0; i < quantity; i++) {
      allUsers.riders.push(makeData('rider'));
      allUsers.drivers.push(makeData('driver'));
    }
    allUsers.riders.forEach(rider => {
      rsmq.sendMessage({qname: 'riders', message: rider}, (err, resp) => {
        if (err) {
          console.log(err);
        }
      });
    });
    allUsers.drivers.forEach(driver => {
      rsmq.sendMessage({qname: 'drivers', message: driver}, (err, resp) => {
        if (err) {
          console.log(err);
        }
      });
    });
  }
};