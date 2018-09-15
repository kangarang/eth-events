# eth-events

`eth-events` is a library for querying and decoding Ethereum event logs

## Install

`npm install eth-events`

## Usage

```ts
const EthEvents = require('eth-events')
const Token = require('./abis/EIP20.json')

// abi/address/network
const contract: any = {
  abi: Token.abi,
  address: '0xDEADBEEFCAFE12345678912456789',
  network: 'mainnet',
  blockNumber: 5000000 // optional, default start block of the contract to query
}
// eth-events will batch getLogs every 5000 blocks by default
// optionally you can specify a different threshold here
const blockRangeThreshold: number = 20000

// init eth-events
const ethEvents = new EthEvents(contract, blockRangeThreshold)

// block range
const fromBlock: number = 6000000
const toBlock: number|string = 'latest'

// event name(s)
const eventNames: string[] = ['Transfer', 'Approval']

// indexed event emission arg values (un-hashed filter topics)
const indexedFilterValues: any = {
  _to: '0xCAFEDEADBEEF12345678912456789',
}

// async
ethEvents.getLogs(fromBlock, toBlock, eventNames, indexedFilterValues).then(logs => {
  logs.map(log => {
    console.log(log)
    // {
    //   logData: {
    //     _from: '0xDEADBEEFCAFE12345678912456789',
    //     _to: '0xCAFEDEADBEEF12345678912456789',
    //     _value: BigNumber { _bn: <BN: 16bcc41e90> },
    //   },
    //   txData: {
    //     txHash: '0xBEEFDEADCAFE12345678912456789',
    //     logIndex: 53,
    //     blockNumber: 6000000,
    //     blockTimestamp: 12341234,
    //   },
    //   contractAddress: '0xDEADBEEFCAFE12345678912456789',
    //   eventName: 'Transfer'
    // }
  })
})
```

## Test

`yarn test`
