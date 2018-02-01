const RedisSMQ = require("rsmq");
const rsmq = new RedisSMQ( {host: "127.0.0.1", port: 6379, ns: "rsmq"} );
var RSMQWorker = require( "rsmq-worker" );
var workerRider = new RSMQWorker( "riders" );
var workerDriver = new RSMQWorker( "drivers" );

module.exports = {
  makeMatch: (qname) => {
    let match = {};
    rsmq.getQueueAttributes({qname: 'drivers'}, (err, resp) => {
      if (err) {
        console.log(err);
      } else if (resp.msgs) { 
        rsmq.popMessage({qname: 'riders'}, (err, rider) => {
          if (err) {
            console.log(err);
          } else {
            match.rider_id = JSON.parse(rider.message).rider.id;
          }
        });
        rsmq.popMessage({qname: 'drivers'}, (err, driver) => {
          if (err) {
            console.log(err);
          } else {
            match.driver_id = JSON.parse(driver.message).driver.id;
            console.log(match);
          }
        });
        // add a match number
        // collect in an array
        // send to rider and driver
        // if array.length === 10, send to logger/requests
      } else {
        console.log('NO AVAILABLE DRIVERS KAY?');
        // check every 30 seconds until a match (polling)
      }
    });
  },

  callWorkerTest: () => {
    console.log('in callWorkerTest');
    workerRider.on( "message", function( msg, next, id ) {
      // process your message
      console.log("Message id : " + id);
      // console.log(msg);
      next();
    });
    workerRider.on('error', function( err, msg ) {
      console.log( "ERROR", err, msg.id );
    });
    workerRider.on('exceeded', function( msg ) {
      console.log( "EXCEEDED", msg.id );
    });
    workerRider.on('timeout', function( msg ) {
      console.log( "TIMEOUT", msg.id, msg.rc );
    });

    workerRider.start();
  },

};