# eth-events

[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fkangarang%2Feth-events.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2Fkangarang%2Feth-events?ref=badge_shield) [![Build Status](https://travis-ci.org/kangarang/eth-events.svg?branch=master)](https://travis-ci.org/kangarang/eth-events) [![npm package](https://img.shields.io/npm/v/eth-events.svg?type=shield)](https://www.npmjs.org/package/eth-events)

`eth-events` is a library for querying and decoding Ethereum event logs

## Install

    npm install eth-events

## API

```ts
interface IContractDetails {
  abi: any[];
  address: string;
  name?: string;
}

interface IFilter {
  fromBlock: number;
  toBlock: number | 'latest';
  address: string | string[];
  topics?: string[];
}

interface IEthEvent {
  name: string;
  values: {
    [key: string]: string | number;
  };
  sender: string;
  recipient: string;
  txHash: string;
  logIndex: number;
  blockNumber: number;
  timestamp: number;
  toContract?: string;
}

// init eth-events
function EthEvents(
  contracts: IContractDetails[],
  jsonRpcEndpoint: string,
  startBlock?: number,
  extraneousEventNames?: string[]
);

// get events by block range
async function getEvents(startBlock?: startBlock, endBlock?: number): Promise<IEthEvent[]>;

// get events by filter (via eth_getLogs)
async function getEventsByFilter(filter: IFilter): Promise<IEthEvent[]>;
```

## Usage

```ts
import { EthEvents } from 'eth-events';
import Token from './abis/EIP20.json';

// contract details
const token: IContractDetails = {
  abi: Token.abi,
  address: '0xDEADBEEFCAFE12345678912456789',
  name: 'Basic Token', // optional
};
const contracts: IContractDetails[] = [token];
// provider endpoint
const jsonRpcEndpoint: string = 'http://localhost:8545';
// either the initial block to begin the query || block number of when the contract was deployed
const startBlock: number = 1;

// init eth-events
const ethEvents = EthEvents(contracts, jsonRpcEndpoint, startBlock);

// get events by block range
ethEvents.getEvents().then((events: IEthEvent[]) => {
  // ...
});

const filter: IFilter = {
  fromBlock: 4555363,
  toBlock: 'latest',
  address: '0xDEADBEEFCAFE12345678912456789',
  topics: [],
};

// get events by filter (via eth_getLogs)
ethEvents.getEventsByFilter(filter).then((events: IEthEvent[]) => {
  // ...
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
