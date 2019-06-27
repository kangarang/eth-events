# eth-events

[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fkangarang%2Feth-events.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2Fkangarang%2Feth-events?ref=badge_shield) [![Build Status](https://travis-ci.org/kangarang/eth-events.svg?branch=master)](https://travis-ci.org/kangarang/eth-events) [![npm package](https://img.shields.io/npm/v/eth-events.svg?type=shield)](https://www.npmjs.org/package/eth-events)

`eth-events` is a library for querying and decoding Ethereum event logs

## Install

    npm install eth-events

## Usage

```js
import { EthEvents } from 'eth-events';
import Token from './abis/EIP20.json';

// abi/address/network
const token = {
  abi: Token.abi,
  address: '0xDEADBEEFCAFE12345678912456789',
  name: 'Basic Token',
};

const contracts = [token];

// init eth-events
const ethEvents = EthEvents(contracts, jsonRpcEndpoint, startBlock);

// async
ethEvents.getEvents().then(events => {
  events.map(e => {
    console.log(e);
    // {
    //   name: 'Transfer',
    //   values: {
    //     _from: '0xDEADBEEFCAFE12345678912456789',
    //     _to: '0xCAFEDEADBEEF12345678912456789',
    //     _value: BigNumber { _bn: <BN: 16bcc41e90> },
    //   },
    //   sender: '0xDEADBEEFCAFE12345678912456789',
    //   recipient: '0xDEADBEEFCAFE12345678912456789',
    //   blockNumber: 6000000,
    //   timestamp: 12341234,
    //   txHash: '0x333333333a3b3560a72fa72013fe6bc48f8a33924e748335cb203adfd441a635',
    //   logIndex: 42,
    //   toContract: 'Basic Token',
    // }
  });
});
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
