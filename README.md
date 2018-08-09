# eth-events

`eth-events` is a library for querying and decoding Ethereum event logs

## Install

`npm install eth-events`

## Usage

```js
const Ethjs = require('ethjs')
const EthEvents = require('eth-events')
const Token = require('./EIP20.json')

// setup ethjs
const provider = new Ethjs.HttpProvider(`https://mainnet.infura.io`)
const ethjs = new Ethjs(provider)

// abi/address of the contract to query
const contract = {
  abi: Token.abi,
  address: '0xDEADBEEFCAFE12345678912456789',
}

// init eth-events
const ethEvents = new EthEvents(ethjs, contract)

// block range
const fromBlock = '6000000'
const toBlock = 'latest'

// event name(s)
const eventNames = ['Transfer']

// indexed event emission arg values (un-hashed filter topics)
const indexedFilterValues = {
  _to: '0xCAFEDEADBEEF12345678912456789',
}

// async
ethEvents.getLogs(fromBlock, toBlock, eventNames, indexedFilterValues).then(logs => {
  logs.map(log => {
    console.log(log)
    // {
    //   logData: {
    //     _value: <BN: 16bcc41e90>,
    //     _from: '0xDEADBEEFCAFE12345678912456789',
    //     _to: '0xCAFEDEADBEEF12345678912456789',
    //     _eventName: 'Transfer',
    //   },
    //   txData: {
    //     txHash: '0xBEEFDEADCAFE12345678912456789',
    //     logIndex: '53',
    //     blockNumber: '6000000',
    //     blockTimestamp: '12341234',
    //   },
    //   eventName: 'Transfer',
    // }
  })
})
```

## Test

`npm test`
