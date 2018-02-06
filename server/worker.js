const RedisSMQ = require("rsmq");
const rsmq = new RedisSMQ( {host: "127.0.0.1", port: 6379, ns: "rsmq"} );
const RSMQWorker = require( "rsmq-worker" );
const workerRider = new RSMQWorker( "riders" );
const workerDriver = new RSMQWorker( "drivers" );

workerDriver.on( "message", function( msg, next, id ) {
  //this is where matching happens
  let match = {};


  // check if there is a rider in the rider queue

  // workerRider.on('message', (msgRider, nextRider, idRider) => {
  //   match.request_id = idRider;
  //   match.rider = JSON.parse(msgRider);
  //   match.driver = JSON.parse(msg);
  //   console.log(match);
  //   nextRider();
  // });
  workerRider.on('error', function( err, msg ) {
    console.log( "ERROR", err, msg.id );
  });



  // rsmq.receiveMessage({qname: 'riders'}, function (err, resp) {
  //   if (err) {
  //     console.log(err);
  //   } else if (resp.id) {
  //     // console.log('"Message received."', resp);  
  //   // if yes
  //     // save the rider, save the driver;
  //     match.request_id = resp.id;
  //     match.rider = JSON.parse(resp.message);
  //     match.driver = JSON.parse(msg);
  //     console.log(match);

  //     // pop the rider, pop the driver
  //     // ideally send to another function to match so the worker can keep working
  //     // build the matching object and send to logger
  //     // respond to driver and rider services with their matches
  //   } else {
  //     console.log('"NO RIDERS KAY?"');
  //   // if no
  //     // do nothing; or keep polling; tbd based on how this message queue works
  //   }
  // });

  console.log("Message id : " + id);
  // console.log(msg);
  next();
});
workerDriver.on('error', function( err, msg ) {
  console.log( "ERROR", err, msg.id );
});
workerDriver.on('exceeded', function( msg ) {
  console.log( "EXCEEDED", msg.id );
});
workerDriver.on('timeout', function( msg ) {
  console.log( "TIMEOUT", msg.id, msg.rc );
});

// workerDriver.start();
// workerRider.start();

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
    // add to queue

    allUsers.riders.forEach(rider => {
      rsmq.sendMessage({qname: 'riders', message: rider}, (err, resp) => {
        if (err) {
          console.log(err);
        } else {
          console.log('Message sent. ID:', resp);
        }
      });
    });
    allUsers.drivers.forEach(driver => {
      rsmq.sendMessage({qname: 'drivers', message: driver}, (err, resp) => {
        if (err) {
          console.log(err);
        } else {
          console.log('Message sent. ID:', resp);
        }
      });
    });

    console.log('All users: ', allUsers);

    

  }
};