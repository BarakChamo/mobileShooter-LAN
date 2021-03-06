import 'styles/mobile.scss'

// Dependencies
import SocketIO from 'socket.io-client'

// Controllers
import sounds from 'controllers/Sound'

// Graphics
import clouds  from 'graphics/clouds'
import { Arc } from './components/Shapes'

// Constants
import WORLD  from 'constants/world'

// is on an inconsistent apple device?!?
const ios = navigator.userAgent.match(/iPhone|iPad/)

let id     = (window.localStorage.getItem('playerId') || Math.random().toString(36).substring(2,7)),
    socket = SocketIO.connect(window.location.host + '/controller',{query: 'playerId='+id}),
    player = {id : id},
    connected;

let pole = false,
    calibrated = false

// Set player id for reconnection
window.localStorage.setItem('playerId', id)

let room = 'ROOM';//(location.pathname.replace('/','') || prompt('WHAT ROOM?!?!')).toLowerCase()
// history.replaceState ? history.replaceState(null, null, room) : location.pathname = room

// Canvases
const hud = document.getElementById('hud').getContext('2d')
hud.canvas.width = window.innerWidth
hud.canvas.height = window.innerHeight


/*
  Load sounds
*/

sounds.load('pew',   'sounds/pew.wav')
sounds.load('lazar', 'sounds/lazar.mp3')
sounds.load('sad',   'sounds/sad.mp3')


/*
  Device event handlers
*/

let faya = _.throttle(function() {
  if(!connected) return connectToBluetooth();

  sounds.play('pew')

  socket.emit('device:fire', {
    id: id,
    strength: 1
  })
}, 10)

socket.on('connect', function(){
  pole = false
  calibrated = false
})


/*
  Throttled movement handler
*/

let updateOrientation = _.throttle(function(event) {
  console.log('updateOrientation')
  pole = calibrated ? pole : event.alpha
  calibrated = calibrated || true

  if (!connected) return;

  socket.emit('device:position', {
    event:  {
      alpha: ios ? event.alpha : Math.abs(360 + event.alpha - pole) % 360,
      beta:  event.beta,
      gamma: event.gamma
    },
    p: player
  })
}, 10)


/*
  Game event handlers
*/

function die() {
  sounds.play('sad')
  // navigator.vibrate && navigator.vibrate([200, 100, 200, 100, 200])
  alert('you died')
}

socket.on('trigger:hit', function(params) {
  let newAngle =  params[0].health / WORLD.player.health * 2

   animateValue(health, 'endAngle', newAngle, 10, function(){
    hud.clearRect(0, 0, window.innerWidth, window.innerHeight)
    health.draw(hud, health)

    if (health.endAngle <= 0) die()
  })
})


function animateValue(target, key, value, delay, fn) {
  const interval = setInterval(function(){
    if (target[key] !== value){
      target[key] = Number((target[key] < value ? target[key] + 0.01 : target[key] - 0.01).toFixed(2))
      fn()
    }

    if (target[key] === value) clearInterval(interval)
  }, delay)
}

/*
  Animation for the HUD
*/

const health = new Arc(window.innerWidth / 2, window.innerHeight / 2, 100, -0.5, 2, 'white')
health.draw(hud, health)


/*
  Cloud background
*/

// clouds(document.querySelector('#clouds').getContext('2d'))


/*
  Start game
*/

function join(){
  const _e = localStorage.getItem('emoji'),
        _n = localStorage.getItem('name')

  // Set emoji to player object
  player.e = _e
  player.n = _n

  // Set User Emoji
  document.getElementById('player-emoji').src      = 'images/emoji/' + _e

  // Join console room
  socket.emit('device:join', {
    room: room
  }, function(data){
    window.addEventListener('deviceorientation', updateOrientation);
    document.addEventListener('touchstart', faya);
  })
}

if (localStorage.getItem('emoji')) {
  join();
} else {
  let parser      = new DOMParser(),
      emojiDialog = parser.parseFromString(require('templates/emoji.jade')({
    emoji:require('templates/emoji.json').list
  }), 'text/html').getElementById('emoji')

  parser = undefined;

  document.body.appendChild(emojiDialog);

  emojiDialog.addEventListener('click', function(e) {
    const eElm = e.target.attributes['data-emoji'],
          nElm = document.getElementById('name');
    if (!eElm && !nElm.value) return;

    localStorage.setItem('emoji', e.target.attributes['data-emoji'].value);
    localStorage.setItem('name',    document.getElementById('name').value);

    emojiDialog.remove();
    emojiDialog = undefined;
    join();
  });
}

function connectToBluetooth(){
  navigator
    .bluetooth
    .requestDevice({filters: [{name:'OVERBOARD', services: ['00001815-0000-1000-8000-00805f9b34fb']}]})
    .then(() => {
      console.log('WTF');
      connected = true;
    });
}
