import 'babel-polyfill'
import Ethjs from 'ethjs'
import { h, app } from 'hyperapp'
import EthEvents from '../lib/index.js'
import { diffBalances, buildContract, loadState, saveState } from './utils'
import './styles.css'

const ethjs = new Ethjs(new Ethjs.HttpProvider('https://mainnet.infura.io'))
const contract = buildContract('adChain', 'token')
const ethEvents = new EthEvents(ethjs, contract)

const eventNames = ['Transfer']
const indexedFilterValues = {
  _to: '0xb4b26709ffed2cd165b9b49eea1ac38d133d7975',
}

const state = {
  logs: [],
  balances: {},
}

const actions = {
  getLogs: () => async (state, actions) => {
    // prettier-ignore
    const logs = await ethEvents.getLogs(6032800, 6251530, eventNames, indexedFilterValues)
    console.log('logs:', logs)

    const balances = diffBalances(logs)
    return actions.updateState({ logs, balances })
  },
  updateState: value => () => {
    return value
  },
  persistState: () => state => {
    saveState(state)
    console.log('saved')
  },
  clearState: () => () => {
    saveState({})
    console.log('cleared')
    return {
      logs: [],
      balances: {},
    }
  },
  rehydrateState: () => () => loadState(),
}

const view = (state, actions) => (
  <div>
    {console.log('state', state)}
    <h1>Eth Events ({state.logs.length})</h1>
    <div onclick={actions.persistState}>persist</div>
    <div onclick={actions.rehydrateState}>rehydrate</div>
    <div onclick={actions.clearState}>clear</div>

    {state.logs.map(({ logData, txData, eventName }) => (
      <div className="container">
        {Object.keys(logData).map(
          ldKey =>
            ldKey !== '0' &&
            ldKey !== '1' &&
            ldKey !== '2' &&
            ldKey !== '3' &&
            ldKey !== 'listingHash' &&
            ldKey !== 'challenger' &&
            ldKey !== '_eventName' && (
              <div>{`${ldKey}: ${
                Ethjs.BN.isBN(logData[ldKey]) ? logData[ldKey].toString() : logData[ldKey]
              }`}</div>
            )
        )}

        {Object.keys(txData).map(txKey => (
          <div>{`${txKey}: ${
            txKey === 'blockTimestamp'
              ? new Date(txData.blockTimestamp * 1000).toLocaleDateString()
              : txData[txKey]
          }`}</div>
        ))}
      </div>
    ))}

    {!state.logs.length && <button onclick={() => actions.getLogs()}>getLogs</button>}
  </div>
)

app(state, actions, view, document.body)
