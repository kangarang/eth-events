# eth-events
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fkangarang%2Feth-events.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2Fkangarang%2Feth-events?ref=badge_shield)


`eth-events` is a library for querying and decoding Ethereum event logs

## Install

    npm install eth-events

## Usage

```js
import EthEvents from 'eth-events'
import Token from './abis/EIP20.json'

// abi/address/network
const contract = {
  abi: Token.abi,
  address: '0xDEADBEEFCAFE12345678912456789',
  network: 'mainnet',
  blockNumber: 5000000, // optional, default start block of the contract to query
}
// eth-events will batch getLogs every 5000 blocks by default
// optionally you can specify a different threshold here
const blockRangeThreshold = 20000

// init eth-events
const ethEvents = EthEvents(contract, blockRangeThreshold)

// block range
const fromBlock = 6000000
const toBlock = 'latest'

// event name(s)
const eventNames = ['Transfer', 'Approval']

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

## Development

Test

    npm test

Compile typescript files and watch for changes

    npm run dev

Compile typescript files & declarations

    npm run build


## License
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fkangarang%2Feth-events.svg?type=large)](https://app.fossa.io/projects/git%2Bgithub.com%2Fkangarang%2Feth-events?ref=badge_large)