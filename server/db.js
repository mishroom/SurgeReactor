const mongoose = require('mongoose');

mongoose.connect('mongodb://54.183.229.105:21017/surge');
const db = mongoose.connection;

const schedule = require('node-schedule');

var redis = require('redis');
var client = redis.createClient('6379','18.144.40.171');
// var client = redis.createClient('18.144.40.171');

client.on('connect', () => {
  console.log('redis connected successfully');
});



db.once('open', () => {
  console.log('mongoose connected successfully');
});

const supply_demandSchema = mongoose.Schema({
  time_stamp: String,
  year: Number,
  month: Number,
  day: Number,
  hour: Number,
  minute: Number,
  seconds: Number,
  rider: Number,
  driver: Number, 
});

const surgeSchema = new mongoose.Schema({
  is_surged: Boolean,
  surge_ratio: Number, 
});


const Supply_Demand = mongoose.model('Supply_Demand', supply_demandSchema);
const Surge = mongoose.model('Surge', surgeSchema);


const convertTimeToNearest15Minutes = (time, minutes) => {
  let newMins = null;
  if (minutes > 45) {
    newMins = '45';
  } else if (minutes > 30) {
    newMins = '30';
  } else if (minutes > 15) {
    newMins = '15';
  } else if (minutes > 0) {
    newMins = '00';
  }
  time.setMinutes(newMins);
  return time;
};

const determineSurge = (demand, supply) => {
  let ratio = demand / supply;

  client.set('surgeRatio', ratio, (err, resp) => {
    console.log('setting surge ratio ', resp);
  });

};

const getAverage = (data) => {

  // average out the  rider and driver counts counts
  if (data.length) {
    let riderDemandSum = 0;
    let driverSupplySum = 0;
    data.forEach( object => {
      riderDemandSum += object.rider;
      driverSupplySum += object.driver;
    });

    const riderDemandAvg = Math.floor(riderDemandSum / data.length);
    const driverSupplyAvg = Math.floor(driverSupplySum / data.length);
    determineSurge(riderDemandAvg, driverSupplyAvg);
  }
};

const collectData = (fireDate) => {
  console.log('In Collect Data', fireDate);
  const year = fireDate.getFullYear();
  const month = fireDate.getMonth() + 1;
  const day = fireDate.getDate();
  const hour = fireDate.getUTCHours();
  const minute = fireDate.getMinutes();
  const seconds = fireDate.getSeconds();

  // determine max
  let max = 45;
 
  if (minute === 0) {
    max = 15;
  } else if (minute === 15) {
    max = 30;
  } else if (minute === 30) {
    max = 45;
  } else if (minute === 45) {
    max = 59;
  }

  Supply_Demand.find({year: year, month: month, day: day, hour: hour, minute: { $gt: minute, $lt: max}}, (err, data) => {
    if (err) {
      console.log(err);
    } else {
      getAverage(data);
    }
  });
};

const zero = schedule.scheduleJob('00 * * * *', collectData);
const fifteen = schedule.scheduleJob('15 * * * *', collectData);
const thirty = schedule.scheduleJob('30 * * * *', collectData);
const fortyfive = schedule.scheduleJob('45 * * * *', collectData);
// const now = schedule.scheduleJob('37 * * * *', collectData);

module.exports = {
  generateData: () => {
    const t = process.hrtime();
    var data = [];

    const getRandomInt = (min, max) => {
      min = Math.ceil(min);
      max = Math.floor(max);
      return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
    };

    const getRandomTime = () => {
      //generate randome month (0-12)
      const monthDays = {
        1: 31,
        2: 28,
        3: 31,
        4: 30,
        5: 31,
        6: 30,
        7: 31,
        8: 31,
        9: 30,
        10: 31,
        11: 30,
        12: 31
      };

      const validateDoubleDigits = (num) => {
        return num < 10 ? '0' + num : num;
      };

      const month = Math.floor(Math.random() * 12) + 1;

      const hour = validateDoubleDigits(getRandomInt(0, 24));

      const minute = validateDoubleDigits(getRandomInt(0, 60));

      const day = validateDoubleDigits(getRandomInt(1, monthDays[month] + 1));

      const year = 2018;

      const time = hour + ':' + minute + ':' + validateDoubleDigits(getRandomInt(0, 4) * 15);
      const timeStamp = year + '-' + validateDoubleDigits(month) + '-' + day + 'T' + time;
      return timeStamp;
    };

    const makeData = () => {
      const random = getRandomTime();
      const time = new Date (random);
      // console.log(random);
      return ({
        time_stamp: time,
        year: time.getFullYear(),
        month: time.getMonth() + 1,
        day: time.getDate(),
        hour: time.getUTCHours(),
        minute: time.getMinutes(),
        seconds: time.getSeconds(),
        rider: getRandomInt(0, 3000),
        driver: getRandomInt(0, 3000),
      });
    };

    const saveDataArray = () => {
      // console.log(data.length);
      Supply_Demand.collection.insert(data, (err, resp) => {
        if (err) {
          console.log('Error is inserting data into DB: ', err);
        } else {
          console.log ('saved 1M db entries in this time: ', process.hrtime(t));
        }
      });
    };

    for (var i = 0; i < 1000000; i++) {
      data.push(makeData());
    }
    saveDataArray();
    // console.log(data);
  },

  getEstimate: (cb) => {
    client.get('surgeRatio', (err, reply) => {
      if (reply < 1) {
        reply = 1;
      }
      cb(null, reply);
    });
    // cb(null, ratio);
  }
};