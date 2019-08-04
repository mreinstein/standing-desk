// https://medium.com/@yelouafi/react-less-virtual-dom-with-snabbdom-functions-everywhere-53b672cb2fe3
// https://github.com/yelouafi/snabbdom-starter/blob/counter-3/app/js/counterList.js
import { h, init } from 'snabbdom'
import classModule from 'snabbdom/es/modules/class.js'
import propsModule from 'snabbdom/es/modules/props.js'
import styleModule from 'snabbdom/es/modules/style.js'
import attrsModule from 'snabbdom/es/modules/attributes.js'
import eventModule from 'snabbdom/es/modules/eventlisteners.js'


// init patch function with chosen modules
const patch = init([
    classModule,  // makes it easy to toggle classes
    propsModule,  // for setting properties on DOM elements
    styleModule,  // handles styling on elements with support for animations
    attrsModule,
    eventModule   // attaches event listeners
])


let oldVnode = document.querySelector('main')


const model = {
  height: -1,
  state: ''
}


const connection = new EventSource('/state') //, { withCredentials: true })

connection.addEventListener('error', function (e) {
  console.log('there was an error in the connection listener SSE:', e)
  if (e.readyState == EventSource.CLOSED)
    console.log('SSE connection was closed')
})

connection.addEventListener('open', function(e) {
  console.log('SSE Connection is opened', e)
}, false)

connection.addEventListener('message', function (e) {
  console.log('msg:', e.data)
  const data = JSON.parse(e.data)
  model.height = data.deskState.height.toFixed(1)
  model.state = data.deskState.state
  render(model)
})


function setHeight (height) {
  if (height < 0)
    return
  console.log('sending:', height)
  const xhr = new XMLHttpRequest()
  xhr.open('POST', '/height?height='+height, true)
  xhr.setRequestHeader('Content-Type', 'application/json')
  xhr.send(JSON.stringify({ height }))
}


function render (model) {
  const newVnode = h('main', [
      h('h3', 'Standing Desk'),
      h('input', {
        attrs: {
          disabled: (model.state !== 'ready'),
          type: 'text'
        },
        on: {
          keyup: function (e) {
            if (e.key === 'Enter' && !isNaN(parseFloat(e.target.value)))
              setHeight(parseFloat(e.target.value))
          }
        }
      }),
      h('button', {
        attrs: {
          disabled: (model.state !== 'ready'),
          type: 'submit'
        },
        on: {
          click: function (e) {
            e.preventDefault()
            setHeight(model.height)
            return false
          }
        }
      }, 'Set Height'),
      h('label', model.state ? `height: ${model.height.toFixed(1)}"  state: ${model.state}` : 'retrieving state')
  ])

  oldVnode = patch(oldVnode, newVnode)
}


render(model)
