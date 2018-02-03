const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/surge');
const db = mongoose.connection;
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
  time_stamp: String, //every 15 mins
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

      const time = hour + ':' + minute + ':' + getRandomInt(0, 4) * 15;
      const timeStamp = year + '-' + validateDoubleDigits(month) + '-' + day + 'T' + time + '.511Z';
      return timeStamp;
    };

    const makeData = () => {

      const time = new Date (getRandomTime());
      return ({
        time_stamp: time,
        year: time.getYear(),
        month: time.getMonth(),
        day: time.getDay(),
        hour: time.getHour(),
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
  },



  getEstimate: (data, cb) => {
    let query = data.time_stamp;
    // query.setSeconds(0);
    // const minutes = query.getMinutes();

    // if (minutes !== '00' && minutes !== '15' && minutes !== '30' && minutes !== '45') {
    //   query = convertTimeToNearest15Minutes(query, minutes);
    // }
    
    Supply_Demand.find({ time_stamp: query }, cb);

  }
};