'use strict'

module.exports = function fsm ({ verbose } = { }) {
  const states = { }
  let currentState

  const addState = function (stateName, state) {
    states[stateName] = state
  }

  const getCurrentState = function () {
    return states[currentState]
  }

  const setState = async function (stateName, ...args) {
    if (stateName === currentState)
      return // already in the state

    if (!states[stateName])
      return // new state doesn't exist

    if (currentState) {
      if (verbose)
        console.log('exiting state', currentState)
      if (states[currentState].exit)
        await states[currentState].exit()
    }

    if (verbose)
      console.log('entering state', stateName)
    currentState = stateName
    if (states[currentState].enter)
      await states[currentState].enter(...args)
  }

  return Object.freeze({ addState, getCurrentState, setState })
}
