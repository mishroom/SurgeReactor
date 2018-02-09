const chai = require('chai');
const request = require('supertest');

const { expect } = chai;
const app = require('../server/index.js');

const RedisSMQ = require('rsmq');
const rsmq = new RedisSMQ( {host: '18.144.40.171', port: 6379, ns: "rsmq"} );

var redis = require('redis');
var client = redis.createClient();


describe('API Endpoints', () => {
  describe('GET /', () => {
    it('Server should load 200', (done) => {
      request(app)
        .get('/')
        .expect(200, done);
    });
  });

  describe('POST /price', () => {
    it('should not accept empty request body', (done) => {
      request(app)
        .post('/price')
        .expect(400, done);
    });
    it('should return rider id and surge data', (done) => {
      request(app)
        .post('/price')
        .send({'rider_id': 24354})
        .expect(200)
        .end((err, res) => {
          expect(res.body).to.have.property('rider_id');
          expect(res.body).to.have.property('is_surged');
          expect(res.body).to.have.property('surge_ratio');
          expect(res.body).to.have.property('surge_id');
          done();
        });
    });
  });

  describe('POST /match/:qname', () => {
    it('should throw error if rider or driver not specified', (done) => {
      request(app)
        .post('/match')
        .expect(404, done);
    });
    it('should throw error if parameter is not a rider or driver', (done) => {
      request(app)
        .post('/match/notrider')
        .expect(404, done);
    });
    it('should respond with 200 if parameter is rider', (done) => {
      request(app)
        .post('/match/riders')
        .send({'rider':
          {
            'rider_id': 45423,
            'username': 'mishfish'
          }
        })
        .expect(200, done);
    });
    it('should respond with 200 if parameter is driver', (done) => {
      request(app)
        .post('/match/drivers')
        .send({'driver':
          {
            'driver_id': 45423,
            'username': 'mishfish'
          }
        })
        .expect(200, done);
    });
    it('should respond with 400 if post data does not contain data', (done) => {
      request(app)
        .post('/match/drivers')
        .expect(400, done);
    });
    it('should respond with 400 if post data does not contain data', (done) => {
      request(app)
        .post('/match/riders')
        .expect(400, done);
    });
  });
  describe('POST /surge', () => {
    it('should exist', (done) => {
      request(app)
        .post('/surge')
        .expect(200, done);
    });
  });
});


describe('Redis Queue Workers', () => {
  describe('Driver Worker', () => {
    // it('should poll the driver queue', done => {

    // });
    // it('should not make a match if no rider available', done => {

    // });
    // it('should make a match if rider is availble', done => {

    // });
    // it('should delete the driver and rider once match is made', done => {

    // });
    it('rider should not be removed from queue before matched', done => {
      rsmq.getQueueAttributes({qname: 'riders'}, (err, resp) => {
        expect(resp.msgs).to.equal(1);
      });
      done();
    });
    it('driver should not be removed from queue before matched', done => {
      rsmq.getQueueAttributes({qname: 'drivers'}, (err, resp) => {
        expect(resp.msgs).to.equal(1);
      });
      done();
    });
    it('rider should be removed from queue once matched', done => {
      rsmq.getQueueAttributes({qname: 'riders'}, (err, resp) => {
        expect(resp.msgs).to.equal(0);
      });
      done();
    });
    it('driver should be removed from queue once matched', done => {
      rsmq.getQueueAttributes({qname: 'drivers'}, (err, resp) => {
        expect(resp.msgs).to.equal(0);
      });
      done();
    });

  });
  describe('Matching Worker', () => {
    it('rider and driver should be matched and have all data fields', (done) => {
      rsmq.getQueueAttributes({qname: 'matches'}, (err, resp) => {
        expect(resp.msgs).to.equal(1);
      });
      rsmq.receiveMessage({qname: 'matches'}, (err, resp) => {
        expect(resp.msg).to.have.property('request_id');
        expect(resp.msg).to.have.property('rider');
        expect(resp.msg).to.have.property('driver');
      });
      done();
    });
    it('rider and driver should make multiple matches', done => {
      request(app)
        .get('/generateQueue/5');
      rsmq.getQueueAttributes({qname: 'matches'}, (err, resp) => {
        expect(resp.msgs).to.equal(5);
      });
      done();
    });
    it('should delete all matches from queue once complete', done => {
      rsmq.getQueueAttributes({qname: 'matches'}, (err, resp) => {
        expect(resp.msgs).to.equal(0);
      });
      done();
    });

  });
});

describe('Redis Cache Workers', () => {
  describe('Surge Price', () => {
    it('surge price should exist in cache', done => {
      client.get('surgeRatio', (err, resp) => {
        expect(resp);
      });
      done();
    });
  });
});