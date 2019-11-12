import React, { useState, useEffect } from 'react';
import { EthEvents } from 'eth-events';

import Box from './system/Box';
import Flex from './system/Flex';
import { saveState, SAVED_EVENTS, loadState } from '../utils/localStorage';
import isEmpty from 'lodash/isEmpty';
import sortBy from 'lodash/sortBy';
import { sanitizeEvents } from '../utils/format';
import SwarmPlot from './SwarmPlot';

interface Props {
  error: string;
  contracts: any;
}

const Events: React.FC<Props> = ({ error, contracts }: Props) => {
  const [contractNames, setContractNames]: [string[], any] = useState([]);
  const [events, setEvents]: any = useState({
    // Gatekeeper: [],
    // TokenCapacitor: [],
    // ParameterStore: [],
  });

  async function getEvents() {
    const gk = contracts.Gatekeeper;
    const tc = contracts.TokenCapacitor;
    const ps = contracts.ParameterStore;

    const gatekeeper = {
      abi: gk.interface.abi,
      address: gk.address,
      name: 'Gatekeeper',
    };
    const tokenCapacitor = {
      abi: tc.interface.abi,
      address: tc.address,
      name: 'TokenCapacitor',
    };
    const parameterStore = {
      abi: ps.interface.abi,
      address: ps.address,
      name: 'ParameterStore',
    };

    const contractObjects = [gatekeeper, tokenCapacitor, parameterStore];
    console.log('contractObjects:', contractObjects);
    const infuraKey = process.env.INFURA_PROJECT_ID;
    let rpcEndpoint = `https://mainnet.infura.io/v3/${infuraKey}`;
    if (!infuraKey) {
      rpcEndpoint = 'https://mainnet.infura.io';
    }
    const startBlock = 8392794;
    const ignore: string[] = [
      // 'PermissionRequested',
      // 'SlateCreated',
      // 'SlateStaked',
      // 'VotingTokensDeposited',
    ];
    const ethEvents = EthEvents(contractObjects, rpcEndpoint, startBlock, ignore);

    const filter = {
      fromBlock: 8392794,
      toBlock: 'latest',
      address: gatekeeper.address,
      topics: [],
    };

    const tcFilter = {
      ...filter,
      address: tokenCapacitor.address,
    };
    const psFilter = {
      ...filter,
      address: parameterStore.address,
    };

    try {
      const gkEvents = await ethEvents.getEventsByFilter(filter);
      const tcEvents = await ethEvents.getEventsByFilter(tcFilter);
      const psEvents = await ethEvents.getEventsByFilter(psFilter);
      const orderedGk = sortBy(gkEvents, 'blockNumber');
      const orderedTc = sortBy(tcEvents, 'blockNumber');
      const orderedPs = sortBy(psEvents, 'blockNumber');
      // console.log('gkEvents:', gkEvents);
      // console.log('orderedGk:', orderedGk);

      const cleanGk = sanitizeEvents(orderedGk);
      const cleanTc = sanitizeEvents(orderedTc);
      const cleanPs = sanitizeEvents(orderedPs);
      console.log('cleanTc:', cleanTc);

      setEvents({
        Gatekeeper: cleanGk,
        TokenCapacitor: cleanTc,
        ParameterStore: cleanPs,
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  // On-load, read events from local storage
  useEffect(() => {
    const savedEvents = loadState(SAVED_EVENTS);
    if (typeof savedEvents !== 'undefined') {
      setEvents(savedEvents);
    }
  }, []);

  // If contracts change, get new events from chain
  // note: only if
  useEffect(() => {
    if (!isEmpty(contracts)) {
      const contractNames = Object.keys(contracts);
      setContractNames(contractNames);

      const savedEvents = loadState(SAVED_EVENTS);
      if (isEmpty(savedEvents)) {
        getEvents();
      }
    }
  }, [contracts]);

  // Save newly retrieved events to local storage
  useEffect(() => {
    const savedEvents = loadState(SAVED_EVENTS);
    if (!isEmpty(events) && !isEmpty(events.Gatekeeper)) {
      saveState(SAVED_EVENTS, events);
    }
  }, [events]);

  return (
    <Box className="Events">
      <Box color="red">{error}</Box>

      {!isEmpty(events) && <SwarmPlot events={events} />}

      <Flex p={4}>
        <Box width={1}>
          <Box fontSize={36} fontWeight="bold" mb={3}>
            Events
          </Box>
          <Flex>
            {contractNames.map((contractName: string) => (
              <div key={contractName}>{contractName}</div>
            ))}
          </Flex>
        </Box>

        <Box>
          {/* {typeof events.TokenCapacitor !== 'undefined' &&
            events.TokenCapacitor.map((ev: any) => (
              <Box key={ev.txHash + ev.logIndex}>
                <DisplayJSON data={ev} />
              </Box>
            ))} */}
        </Box>
      </Flex>
    </Box>
  );
};

export default Events;
