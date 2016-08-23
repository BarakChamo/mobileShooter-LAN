var util = require('util');
var os = require('os');
var exec = require('child_process').exec;

var bleno = require('bleno');

var Characteristic = function() {
  Characteristic.super_.call(this, {
    uuid: '2A56',
    properties: ['read', 'write', 'notify'],
    descriptors: [
      new bleno.Descriptor({
        uuid: '1111',
        value: 'VALUE1'
      }),
      new bleno.Descriptor({
        uuid: '2222',
        value: 'VALUE2'
      })
    ]
  });
};

util.inherits(Characteristic, bleno.Characteristic);

Characteristic.prototype.onReadRequest = function(offset, callback) {
  if (os.platform() === 'darwin') {
    exec('pmset -g batt', function (error, stdout, stderr) {
      var data = stdout.toString();
      // data - 'Now drawing from \'Battery Power\'\n -InternalBattery-0\t95%; discharging; 4:11 remaining\n'
      var percent = data.split('\t')[1].split(';')[0];
      console.log(percent);
      percent = parseInt(percent, 10);
      callback(this.RESULT_SUCCESS, new Buffer([percent]));
    });
  } else {
    // return hardcoded value
    callback(this.RESULT_SUCCESS, new Buffer([98]));
  }
};

module.exports = Characteristic;
