const chai = require('chai');
const request = require('supertest');

const { expect } = chai;
const app = require('../server/index.js');

const RedisSMQ = require('rsmq');
const rsmq = new RedisSMQ( {host: "127.0.0.1", port: 6379, ns: "rsmq"} );

describe('server', () => {
  it('Server should load 200', (done) => {
    request(app)
      .get('/')
      .expect(200, done);
  });
});

describe('price endpoint', () => {
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

describe('matching endpoint', () => {
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
  it('rider and driver should be matched', (done) => {
    rsmq.getQueueAttributes({qname: 'matches'}, (err, resp) => {
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


describe('supply demand endpoint', () => {
  it('should exist', (done) => {
    request(app)
      .post('/surge')
      .expect(200, done);
  });
});