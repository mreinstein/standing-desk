'use strict'

const delay = require('delay')
const finiteStateMachine = require('./finite-state-machine.js')
const fs    = require('fs')
const gpio  = require('rpi-gpio')


const MAX_HEIGHT = 18
const HEIGHT_FILE  = __dirname + '/height'
const HISTORY_FILE = __dirname + '/history'

const SPEED = 0.56 // how fast the desk extends/retracts (inches per second)

const gpiop = gpio.promise

const pins = [ 7, 3, 11, 5 ]

const legsDownPin = 11
const legsUpPin = 5

let currentHeight = 0


function saveHeight (height) {
    fs.writeFileSync(HEIGHT_FILE, height, 'utf8')
    fs.appendFileSync(HISTORY_FILE, `${Date.now()},${height}\n`)
}


function loadHeight () {
    return fs.existsSync(HEIGHT_FILE) ? parseFloat(fs.readFileSync(HEIGHT_FILE, 'utf8')) : 0
}


async function setHeight (oldHeight, newHeight) {
	if (newHeight < 0)
    	newHeight = 0
  	if (newHeight > MAX_HEIGHT)
   	 	newHeight = MAX_HEIGHT

    const travelDistance = Math.abs(oldHeight - newHeight)
    const timeToSleep = Math.floor(travelDistance / SPEED * 1000)

    if (timeToSleep < 50)
        return

    if (newHeight > oldHeight)
        await extend()
    else
        await retract()

    // periodically update the desk state (maybe like every 0.5 seconds?)
    const start = Date.now()

    const interval = setInterval(function () {
    	const delta = (Date.now() - start) / 1000
    	const direction = (newHeight > oldHeight) ? 1 : -1
    	currentHeight = oldHeight + SPEED * delta * direction
    }, 100)
    await delay(timeToSleep)

    clearInterval(interval)

    await stop()

    currentHeight = newHeight 
    saveHeight(newHeight)
}


async function extend () {
    await gpiop.write(legsDownPin, true)
    await gpiop.write(legsUpPin, false)
}


async function retract () {
    await gpiop.write(legsUpPin, true)
    await gpiop.write(legsDownPin, false)
}


async function stop () {
    await gpiop.write(legsUpPin, true)
    await gpiop.write(legsDownPin, true)
}


function noop () { }


module.exports = function () {
	const fsm = finiteStateMachine()
	let _setHeight = noop

	fsm.addState('initializing', {
		enter: async function () {
			currentHeight = loadHeight()
    		console.log('current height:', currentHeight)

			for (const pin of pins)
		        await gpiop.setup(pin, gpio.DIR_OUT)

		    await stop()
		    console.log('initialization complete, pins setup\n')
		    fsm.setState('ready')
		}
	})


	fsm.addState('ready', {
		enter: function () {
			console.log('entering ready state')
			_setHeight = function (height) {
				fsm.setState('moving', height)
			}
		},
		exit: function () {
			_setHeight = noop
		}
	})


	fsm.addState('moving', {
		enter: async function (newHeight) {
			console.log('moving to new height:', newHeight)
			await setHeight(currentHeight, newHeight)
			fsm.setState('ready')
		}
	})


	fsm.setState('initializing')

	return {
		setHeight: (height) => _setHeight(height),
		getState: function () {
			return {
				state: fsm.getCurrentState(), height: currentHeight
			}
		}
	}
}
