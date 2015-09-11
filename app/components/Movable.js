import Base  from './Base'
import WORLD from '../constants/world'

/*
  Movable
 */ 

export default class Movable extends Base {
  constructor(x, y) {
    super()

    this.x = x;
    this.y = y;
    this.rotation = 0;
    this.xVelocity = 0;
    this.yVelocity = 0;
    this.moveLeft = false;
    this.moveUp = false;
    this.moveRight = false;
    this.moveDown = false;
  }

  move(dx, dy) {
    this.x += dx || this.xVelocity;
    this.y += dy || this.yVelocity;
  }

  inBoundries() {
    return !(this.x > WORLD.width - this.height || this.x < 0 + this.height || this.y <= 0 + this.height || this.y > WORLD.height - this.height)
  }

  intersects(b) {
    // console.log(this.x < b.x + b.width, this.x + this.width > b.x, this.y < b.y + b.height, this.y + this.height > b.y);
    return  this.x < b.x + (b.width || b.r * 2) && 
            this.x + (this.width || this.r * 2) > b.x &&
            this.y < b.y + (b.height || b.r * 2) &&
            this.y + (this.height || this.r * 2) > b.y;
  }

  collides(shape) {
    if (shape.id === this.id) return
    if (this.intersects(shape)) {
      if (shape.constructor.name === 'Player') {
        console.log("MOVE IT!")
      }
      else if (shape.constructor.name === 'Bullet' && shape.playerThatFired !== this.id) {
        console.log("I'M HIT!!")
      }
    }
  }
}