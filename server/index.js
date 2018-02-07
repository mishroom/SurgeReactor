const nr = require('newrelic');
const express = require('express');
const bodyParser = require('body-parser');
const handler = require('./handler.js');

const app = express();

app.use(bodyParser.json());

app.post('/price', handler.getEstimate);

app.post('/match/:qname', handler.addToQueue);

app.get('/delete/:qname', handler.deleteQueue);

app.get('/add/:qname', handler.addQueue);

app.get('/', (req, res) => { res.end(); });

app.post('/generatedata', handler.generateData);

app.get('/generateQueue/:quantity', handler.generateQueue);

app.listen(3000, () => {
  console.log('listening on port 3000!');
});











// rsmq.sendMessage({qname:"myqueue", message:"Hello World"}, function (err, resp) {
//     if (resp) {
//         console.log("Message sent. ID:", resp);
//     }
// });
// rsmq.receiveMessage({qname:"myqueue"}, function (err, resp) {
//     if (resp.id) {
//         console.log("Message received.", resp)  
//     }
//     else {
//         console.log("No messages for me...")
//     }
// });
// rsmq.listQueues( function (err, queues) {
//     if( err ){
//         console.error( err )
//         return
//     }
//     console.log("Active queues: " + queues.join( "," ) )
// });