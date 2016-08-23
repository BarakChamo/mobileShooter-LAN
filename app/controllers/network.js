var ble = require('ble/main.js');
var Emitter = require('events');

var emitter = new Emitter();

var channels = [];

/*
  Serverless Peer-to-Peer networking manager
  using WebRTC DataChannels
  session initialized by a Bletooth LE service
 */

 // Normalize WebRTC interface
 window.RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection;


/*
  Accept WebRTC Connection
 */

// Create SDP offer answer:
// 1. initialize new Peer connection
// 2. create data channel for that peer
// 3. create SDP answer
// 4. set remote description from the offer
// 5. set local description
function createAnswer(offer, cb) {
  var peer = new RTCPeerConnection({'iceServers': [{'url': 'stun:stun.l.google.com:19302'}]},{ optional:[{ RtpDataChannels:true }]});

   // Create data channel, no id provided, rely on player UUID
   var channel = peer.createDataChannel('game', {ordered: true, reliable:false});

   // Add new channel to channel pool
   channels.push(channel);

   var remoteDesc = new RTCSessionDescription(offer);

  //  Set up peer connection and data channel
   return peer.setRemoteDescription(remoteDesc)
    .then(function(){
      // return answer
      return peer.createAnswer()
       .then(function(answer){
        //  Listen for channel messages
         channel.onmessage = receiveDataChannelMessage;

         // Set local description
         peer.setLocalDescription(answer);
         return answer;
       });
    });
}


/*
  Event Handlers
 */

// Listen for game events from the connected clients
// Handler clients events, emit an internal event
// to update game state
function receiveDataChannelMessage(event) {
  emitter.emit('clientEvent', JSON.parse(event.data));
}

// Emit game events back to all clients
// distribute server game events to all connected clients
emitter.on('serverEvent', function(data){
  channels.forEach(channel => channel.send(JSON.stringify(data)));
});

// Listen for offers from the Web Bluetooth manager
// Create an asnwer and emit it back to bluetooth
ble.on('offer', function(offer){
  createAnswer(offer).then(function(answer){
    ble.emit('answer', answer);
  });
});

module.exports = emitter;
