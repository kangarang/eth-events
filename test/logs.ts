import * as test from 'tape';
import { EthEvents } from '../dist';
import { printEvent } from '../utils/print';

const Gatekeeper = require('./abis/Gatekeeper.json');
const Registry = require('./abis/Registry.json');

test('should get events by filter on rinkeby', async t => {
  try {
    const gkAddress = process.env.RINKEBY_GATEKEEPER_ADDRESS;
    const gatekeeper = {
      abi: Gatekeeper.abi,
      address: gkAddress,
      name: 'Gatekeeper',
    };
    const contracts = [gatekeeper];
    const rpcEndpoint = 'https://rinkeby.infura.io';
    const startBlock = 4555363;
    const ignore = ['PermissionRequested', 'SlateCreated', 'SlateStaked', 'VotingTokensDeposited'];
    const ethEvents = EthEvents(contracts, rpcEndpoint, startBlock, ignore);

    const filter = {
      fromBlock: 4555363,
      toBlock: 'latest',
      address: gkAddress,
      topics: [],
    };

    try {
      const events = await ethEvents.getLogs(filter);

      let tokens = utils.bigNumberify('0');
      events.forEach(e => {
        printEvent(e);
        if (e.name === 'BallotCommitted') {
          tokens = tokens.add(e.values.numTokens.toString());
        }
      });
      console.log('total tokens committed:', utils.formatUnits(tokens, 18).toString());
    } catch (error) {
      console.error(error);
    }
    t.end();
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
});

test.skip('should get events by filter on mainnet', async t => {
  try {
    const registry = {
      abi: Registry.abi,
      address: '0x5E2Eb68A31229B469e34999C467b017222677183',
      name: 'Registry',
    };

    const contracts = [registry];
    const jsonRpcEndpoint = 'https://mainnet.infura.io';
    const startBlock = 5470807;
    const extras = ['_Deposit', '_Withdrawal'];

    const ethEvents = EthEvents(contracts, jsonRpcEndpoint, startBlock, extras);

    const filter = {
      fromBlock: 5470807,
      toBlock: 'latest',
      address: registry.address,
      topics: [],
    };

    try {
      const events = await ethEvents.getEventsByFilter(filter);

      events.forEach(e => printEvent(e));
    } catch (error) {
      console.error(error);
    }

    t.end();
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
});
