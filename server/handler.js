const RedisSMQ = require('rsmq');
const rsmq = new RedisSMQ( {host: '127.0.0.1', port: 6379, ns: 'rsmq'} );
const worker = require('./worker.js');
const db = require('./db.js');


module.exports = {

  addToQueue: (req, res) => {
    const { qname } = req.params;
    rsmq.sendMessage({qname: qname, message: JSON.stringify(req.body)}, (err, resp) => {
      if (err) {
        res.send(err);
      } else if (resp) {
        console.log('Message sent to : ', qname, ' ', resp);
        res.send('You have been added to the matching pool');
      }
    });  
  },

  getEstimate: (req, res) => {
    const { rider_id } = req.body;
    // const t = process.hrtime();
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
      } else {
        console.log(qname, ' created');
      }
    });
    res.end();
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
  }
};