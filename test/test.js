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