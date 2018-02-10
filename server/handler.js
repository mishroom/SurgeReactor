const RedisSMQ = require('rsmq');
const rsmq = new RedisSMQ( {host: '18.144.40.171', port: 6379, ns: 'rsmq'} );
const worker = require('./worker.js');
const db = require('./db.js');


module.exports = {

  addToQueue: (req, res) => {
    const { qname } = req.params;

    if (qname !== 'riders' && qname !== 'drivers') {
      res.sendStatus(404);
      res.end();
    } else if ( !req.body.rider && !req.body.driver) {
      res.sendStatus(400);
      res.end();
    } else {
      rsmq.sendMessage({qname: qname, message: JSON.stringify(req.body)}, (err, resp) => {
        if (err) {
          res.send(err);
          res.end();
        } else if (resp) {
          // console.log('Message sent to : ', qname, ' ', resp);
          res.send('You have been added to the matching pool');
          res.end();
        }
      });  
    } 
  },

  getEstimate: (req, res) => {
    const { rider_id } = req.body;

    if (!rider_id) {
      res.sendStatus(400);
    } else {
      db.getEstimate((err, ratio) => {
        if (err) {
          console.log(err);
          res.status(500).send('Could not retrieve estimate');
        } else {
          const is_surged = ratio > 1 ? true : false;
          const response = {
            'rider_id': rider_id,
            'surge_id': 0,
            'is_surged': is_surged,
            'surge_ratio': ratio,
          };
          // console.log(process.hrtime(t));
          res.json(response);
        }
      });    
    }
  },

  deleteQueue: (req, res) => {
    const {qname} = req.params;
    rsmq.deleteQueue({qname: qname}, (err, resp) => {
      if (err) {
        console.log(err);
      } else {
        console.log(qname, ' deleted');
      }
    });
    res.end();
  },

  addQueue: (req, res) => {
    const {qname} = req.params;

    rsmq.createQueue({qname: qname}, (err, resp) => {
      if (err) {
        console.log(err);
        res.end();
      } else {
        console.log(qname, ' created');
        res.end();
      }
    });
    
  },

  generateData: (req, res) => {
    console.log('Adding data: ' + 1000000 + ' entries');
    db.generateData();
    res.end();
  },

  generateQueue: (req, res) => {
    const {quantity} = req.params;
    worker.generateData(quantity);
    res.end(quantity);
  },

  addSurgeData: (req, res) => {
    //req.body is the data i need to add to mongo
    // add to mongo
    // respond with 200

//     {
//   'time_stamp': '2018-01-25T18:25:43.511Z',
//   'rider': 43,
//   'driver': 21, 
// }
  res.end();

  }
};