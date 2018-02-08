const chai = require('chai');
const request = require('supertest');

const { expect } = chai;
const app = require('../server/index.js');

// var request = supertest.agent(app);

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
      .expect(200, done);
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
});

describe('supply demand endpoint', () => {
  it('should exist', (done) => {
    request(app)
      .post('/surge')
      .expect(200, done);
  });
});