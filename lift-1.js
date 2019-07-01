const delay = require('delay')
const gpio  = require('rpi-gpio')
const fs    = require('fs')


const HEIGHT_FILE  = __dirname + '/height'
const SPEED = 0.56 // how fast the desk extends/retracts (inches per second)

const gpiop = gpio.promise

const pins = [ 7, 3, 11, 5 ]

const legsDownPin = 11
const legsUpPin = 5


function saveHeight (height) {
    fs.writeFileSync(HEIGHT_FILE, height, 'utf8')
}


function loadHeight () {
    return fs.existsSync(HEIGHT_FILE) ? parseFloat(fs.readFileSync(HEIGHT_FILE, 'utf8')) : 0
}


async function setHeight (currentHeight, newHeight) {
    const travelDistance = Math.abs(currentHeight - newHeight)
    const timeToSleep = Math.floor(travelDistance / SPEED * 1000)

    if (newHeight > currentHeight)
        extend()
    else
        retract()

    await delay(timeToSleep)

    stop()
    saveHeight(newHeight)
}


function extend () {
  gpiop.write(legsDownPin, true)
  gpiop.write(legsUpPin, false)
}


function retract () {
  gpiop.write(legsUpPin, true)
  gpiop.write(legsDownPin, false)
}


function stop () {
  const leg = 0;
  gpiop.write(legsUpPin, true)
  gpiop.write(legsDownPin, true)
}


async function main () {
    let height = loadHeight()
    console.log('current height:', height)

    for (const pin of pins)
        await gpiop.setup(pin, gpio.DIR_OUT)

    console.log('pins setup\n')

    console.log('extending legs')

    extend();

    await delay(16500)

    height = (16.5 * SPEED)

    console.log('stopping at the standing position for a minute')

    stop()

    await delay(60000)

    console.log('retracting legs')

    retract()

    //gpiop.destroy()
}


main()
