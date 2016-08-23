var util = require('util');

var bleno = require('bleno');

var Characteristic = require('./char');

function Service() {
  Service.super_.call(this, {
      // uuid: '1811',
      uuid: 'automation_io',
      characteristics: [
          new Characteristic()
      ]
  });
}

util.inherits(Service, bleno.PrimaryService);

module.exports = Service;
