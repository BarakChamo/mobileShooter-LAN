/*
  WebRTC TURN Bluetooth Peripheral Manager

  Initializes a GATT compliant BLE service.
  Piggybacks the 'automation-io' standard service.

  # Service properties:
    name:  OVERBOARD
    alias: automation-io
    UUID:  00001815-0000-1000-8000-00805f9b34fb

  Exposes the following service characteristics:

    # Offer Characteristic:
      UUID:  1111
      props: write

    # Answer Characteristic:
      UUID: 2222
      props: read, notify, broadcast
 */

var bleno = require('bleno');
var Service = require('./service');
var Emitter = require('events');

var data = {
  offer: '',
  answer: ''
};

// Create event emitter, will be the main export of the module
// Provides an event-based interface for the rest of the app
var emitter = new Emitter();


emitter.setAnswer = function(answer){
  data.answer = answer;
};

// Listen for SDP answers from the WebRTC module
emitter.on('answer', function(answer){
  data.answer = answer;

  answerCharacteristic.updateValueCallback(data);
});

// Export the emitter
module.exports = emitter;

// Offer Characteristic
// UUID:  1111
// props: read

var offerCharacteristic = new bleno.Characteristic({
  uuid: '1111',
  properties: ['read', 'write', 'notify', 'broadcast', 'indicate'],
  onWriteRequest: function(offset, data, withoutResponse, callback){
    emitter.emit('offer', data);
    data.offer = data;
  }
});

// Answer Characteristic
// UUID:  2222
// props: write, notify

var answerCharacteristic = new bleno.Characteristic({
  uuid: '2222',
  properties: ['read', 'write', 'notify', 'broadcast', 'indicate'],
  onReadRequest: function(offset, callback){
    callback(bleno.Characteristic.RESULT_SUCCESS, new Buffer(data.answer));
  },
  onSubscribe: function(maxValueSize, updateValueCallback) {
    this.maxValueSize = maxValueSize;
    this.updateValueCallback = updateValueCallback;
  }
});

// Primary Service
// UUID:  00001815-0000-1000-8000-00805f9b34fb
// alias: automation-io
// characteristics: offer, answer

var primaryService = new bleno.PrimaryService({
  uuid: '00001815-0000-1000-8000-00805f9b34fb',
  characteristics: [
    offerCharacteristic,
    answerCharacteristic
  ]
});

// Listen for bluetooth to be ready
bleno.on('stateChange', function(state) {
  console.log('on -> stateChange: ' + state);

  if (state === 'poweredOn') {
    // Start advertising peripheral
    bleno.startAdvertising('OVERBOARD', [primaryService.uuid]);
  } else {
    bleno.stopAdvertising();
  }
});

// After advertising, set services
bleno.on('advertisingStart', function(error) {
  console.log('on -> advertisingStart: ' + (error ? 'error ' + error : 'success'));

  if (!error) {
    // Apply the primary service to the connection
    bleno.setServices([primaryService], function(error){
      console.log('setServices: '  + (error ? 'error ' + error : 'success'));
    });
  }
});
