/*
  Mobile WebBluetooth / WebRTC connection manager

  WebBluetooth client for communicating with the
  Bluetooth peripheral-based TURN server

  Exposes an event emitter for event triggering and handling
 */

window.RTCPeerConnection = window.webkitRTCPeerConnection || window.RTCPeerConnection;

var EventEmitter = require('EventEmitter2').EventEmitter2;
var emitter = new EventEmitter();

// Get strings from buffers
DataView.prototype.getUTF8String = function(offset, length) {
    var utf16 = new ArrayBuffer(length * 2);
    var utf16View = new Uint16Array(utf16);
    for (var i = 0; i < length; ++i) {
        utf16View[i] = this.getUint8(offset + i);
    }
    return String.fromCharCode.apply(null, utf16View);
};

// Create a new WebRTC Peer and data channel
var peer = new RTCPeerConnection({'iceServers': [{'url': 'stun:23.21.150.121'}]},{ 'optional': [{'DtlsSrtpKeyAgreement': true}] });
var channel = peer.createDataChannel('game', {ordered: true, reliable:false});

// Assign handler to channel's messages
channel.onmessage = receiveDataChannelMessage;

// wait for connection to be established
channel.onopen = function (e) {
  // READY TO GO! WOOT!
  emitter.emit('ready');
};

// Initialize new connection
function sendOffer(offer){
  // 1. Get bluettoth device
  //    filter by name and service
  return navigator.bluetooth.requestDevice({filters: [{name:'OVERBOARD', services: ['00001815-0000-1000-8000-00805f9b34fb']}]})

    // 2. connect to device
    .then(device => device.gatt.connect())

    // 3. Get the peripheral's 'automation-io' service
    .then(server => server.getPrimaryService('00001815-0000-1000-8000-00805f9b34fb'))

    // 4. Get all Characteristics from the service
    //    These will be offer and answer by id
    //    1111 and 2222 respectively
    .then(service => service.getCharacteristics())
    .then(chars => {
      return new Promise(function(resolve, reject){

        // Get offer and answer Characteristics by UUID
        var offerCharacteristic  = chars.filter(char => char.uuid.split('-')[0] === '00001111')[0];
        var answerCharacteristic = chars.filter(char => char.uuid.split('-')[0] === '00002222')[0];

        // Subscribe to value change notifications
        answerCharacteristic.startNotifications().then(_ => {

          function handler(event) {
            myCharacteristic.removeEventListener('characteristicvaluechanged');
            handlerAnswer(JSON.parse(event.target.data), answerCharacteristic);
          }

          // Assign handler to value change notifications
          myCharacteristic.addEventListener('characteristicvaluechanged', handler);

          // Write the offer value to the offer Characteristic
          offerCharacteristic
            .writeValue(offer)
            .then(() => {
              resolve();
            });
         });
       });
    });
}

// Handle answer offer ready from bluetooth event
function handlerAnswer(event, answerCharacteristic) {
  var answer = event.target.value;

  // Read the answer's value
  answerCharacteristic
    .readValue()
    .then(buffer => {
      // get remote answer
      var remoteDesc = buffer.getUTF8String(0, buffer.byteLength);

      // Set remote description
      peer.setRemoteDescription(remoteDesc);
    });

}

// Initialize connection
function connect(){
    // Create a WebRTC offer
    peer.createOffer()
      .then(function(offer){
        // Good ice candidate found
        pc1.onicecandidate = function (e) {
          if (e.candidate === null) {
            // Send offer over da blue wayaaarrr
            sendOffer(peer.localDescription);
          }
        };

        // Set the local description
        peer.setLocalDescription(offer);
      });
}

function receiveDataChannelMessage(event) {
  emitter.emit('serverEvent', JSON.parse(event.data));
}

emitter.on('clientEvent', function(data){
  channel.send(JSON.stringify(data));
});

// Initialize a session connection
emitter.on('connect', function(){
  connect();
});

module.exports = emitter;
