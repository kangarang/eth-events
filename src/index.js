import { h, app } from 'hyperapp'

import './styles.css'

const state = {
  count: 0,
}

const actions = {
  down: value => state => ({ count: state.count - value }),
  up: value => state => ({ count: state.count + value }),
}

const view = (state, actions) => (
  <div>
    eth-events
    {console.log('hello?')}
    <h1>{state.count}</h1>
    <button onclick={() => actions.down(1)}>-</button>
    <button onclick={() => actions.up(1)}>+</button>
  </div>
)

app(state, actions, view, document.body)
