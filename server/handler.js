const RedisSMQ = require('rsmq');
const rsmq = new RedisSMQ( {host: '127.0.0.1', port: 6379, ns: 'rsmq'} );
const worker = require('./worker.js');
const db = require('./db.js');

module.exports = {

  addToQueue: (req, res) => {
    const { qname } = req.params;
    req.on('data', (chunk) => {
      rsmq.sendMessage({qname: qname, message: chunk.toString()}, (err, resp) => {
        if (err) {
          res.send(err);
        } else if (resp) {
          console.log('Message sent: ', resp);
          if (qname === 'riders') {
            // worker.callWorkerTest();
          }
          res.send('success');
        }
      });  
    }); 
  },

  getEstimate: (req, res) => {
    const t = process.hrtime();
    req.on('data', (chunk) => {
      const data = JSON.parse(chunk.toString());
      db.getEstimate (data, (err, resp) => {
        if (err) {
          console.log(err);
          res.end();
        } else {
          console.log(process.hrtime(t));
          res.json(resp);
        }
      });
    });
    res.end();
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
    // for (var i = 0; i < 10; i++) {
      console.log('Adding data: ' + /*(i + 1) */ 1000000 + ' entries');
      db.generateData();
    // }
    res.end();
  }
};