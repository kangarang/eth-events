import * as test from 'tape';
import { EthEvents } from '../dist';

const Gatekeeper = require('./abis/Gatekeeper.json');
const Registry = require('./abis/Registry.json');
const TokenCapacitor = require('./abis/TokenCapacitor.json');

test.skip('Should initialize and get events from localhost', async t => {
  try {
    const gkAddress = process.env.GATEKEEPER_ADDRESS;
    const tcAddress = process.env.TOKEN_CAPACITOR_ADDRESS;
    if (gkAddress && tcAddress) {
      const gatekeeper = {
        abi: Gatekeeper.abi,
        address: gkAddress,
        name: 'Gatekeeper',
      };
      const tokenCapacitor = {
        abi: TokenCapacitor.abi,
        address: tcAddress,
        name: 'Token Capacitor',
      };

      const contracts = [gatekeeper, tokenCapacitor];
      const jsonRpcEndpoint = 'http://localhost:8545';
      const startBlock = 1;

      const ethEvents = EthEvents(contracts, jsonRpcEndpoint, startBlock);

      const events = await ethEvents.getEvents();
      console.log('events:', events);
      console.log();
      console.log(`${events.length} events`);
      console.log();
    }
    t.end();
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
});

test.skip('Should initialize and get events from mainnet', async t => {
  try {
    const registry = {
      abi: Registry.abi,
      address: '0x5E2Eb68A31229B469e34999C467b017222677183',
      name: 'Registry',
    };

    const contracts = [registry];
    const jsonRpcEndpoint = 'https://mainnet.infura.io';
    const startBlock = 5470807;

    const ethEvents = EthEvents(contracts, jsonRpcEndpoint, startBlock);

    const events = await ethEvents.getEvents(startBlock, startBlock + 5);
    t.is(events.length, 1, 'sould have returned 1 event');

    t.end();
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
});
