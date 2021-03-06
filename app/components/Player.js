import WORLD       from 'constants/world'
import Marker      from './Marker'
import Triggers    from 'controllers/Triggers'
import Orientation from 'controllers/Orientation'
import Emoji       from './Emoji'

import { Circle, Arc, Polygon }    from './Shapes'
import { movable, collidable, kevin, describe, glow } from 'mixins'
import { minMax } from 'utils/helpers'

// let maxDistance = Math.sqrt(Math.pow(WORLD.width, 2) + Math.pow(WORLD.height, 2))

@movable 
@collidable 
@kevin({health: WORLD.player.damage})
@describe('x', 'y', 'r', 'color', 'rotation', 'marker', 'health', 'emojiName', 'name')
export default class Player extends Circle {
  constructor(x, y, id, emoji, name) {
    super(x, y, WORLD.player.radius, 'transparent')

    this.id = id
    this.controller = new Orientation()
    this.marker = new Marker(200, 200, 5, 'rgba(255, 255, 255, 0.25)')
    this.emojiName = emoji
    this.name = name.toUpperCase()

    this.health = WORLD.player.health

    Triggers.notify(`${this.name} has joined the game`)
  }
  
  update(dt) {
    this.xVelocity = ((this.controller.x - this.x) / WORLD.width) * 2000
    this.yVelocity = ((this.controller.y - this.y) / WORLD.height) * 2000

    this.rotation = this.controller.rotation
    this.move(this.xVelocity * dt, this.yVelocity * dt)

    this.marker.update(this.controller.x, this.controller.y, this.rotation, dt)

    if (this.x > WORLD.width - this.r) {
      this.x = WORLD.width - this.r
    }

    if (this.x < 0 + this.r) {
      this.x = 0 + this.r
    }

    if (this.y < 0 + this.r) {
      this.y = 0 + this.r
    }

    if (this.y > WORLD.height - this.r) {
      this.y = WORLD.height - this.r
    }
  }

  fire(bullet) {
    this.xVelocity -= bullet.xVelocity / 10
    this.yVelocity -= bullet.yVelocity / 10
  }

  collide(component) {
    const a = component.action

    if (component.playerThatFired === this) return
    if (a.health) {
      this.health = minMax(this.health + a.health, WORLD.player.health)
      this.checkLife(component)
    }
  }

  checkLife(bullet){
    Triggers.trigger('hit', this, {health: this.health})

    // Triggers.trigger('dead', this)
    if (this.health <= 0) this.die(bullet)
  }

  die(bullet) {
    Triggers.notify(`${bullet.playerThatFired.name} totally killed ${this.name}`)
    this.remove()
  }

  handleOrientation(event) {
    this.controller.handleOrientation(event)
  }

  draw(ctx, params) {
    super.draw(ctx, params)
      
    ctx.save()

      ctx.translate(params.x, params.y)

      ctx.font = '13px futura'
      ctx.fillStyle = 'rgba(255,255,255,0.75)'
      ctx.fillText(params.name, params.r, params.r * 2)

      ctx.rotate(params.rotation)

      // Draw canon
      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      Polygon.prototype.draw(ctx, {
        color: 'white',
        x: 0,
        y: -params.r * 1.75,
        sides: 3,
        r: params.r / 3,
        rotation: 0.5
      })

      // Draw emoji
      ctx.globalAlpha = 0.9
      Emoji.prototype.draw(ctx, {
        x:     params.r * 2,
        y:     params.r * 2,
        emoji: params.emojiName
      })

    ctx.restore()

    // Line from marker to player
    ctx.beginPath()
      ctx.moveTo(params.x,params.y)
      ctx.lineTo(params.marker.data.x,params.marker.data.y)
      ctx.lineWidth = 1
      ctx.strokeStyle = 'rgba(255,255,255,0.25)'
    ctx.closePath()
    ctx.stroke()

    // Draw health arc
    Arc.prototype.draw(ctx, Object.assign(params, {startAngle: -0.5,endAngle: params.health / WORLD.player.health * 2, color:'rgba(255,255,255,0.4)', r: params.r + 7}))

    // Draw pointer marker
    Marker.prototype.draw(ctx, params.marker.data)
  }
}