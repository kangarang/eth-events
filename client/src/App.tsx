import React, { useState, useEffect } from 'react';
import { providers, Contract } from 'ethers';
import isEmpty from 'lodash/isEmpty';
import './App.css';
import Box from './components/system/Box';
import Button from './components/ui/Button';
import Contracts from './components/Contracts';
import Events from './components/Events';
import Flex from './components/system/Flex';
import { loadState, SAVED_ABIS, saveState } from './utils/localStorage';

declare global {
  interface Window {
    ethereum: any;
  }
}

const App: React.FC = () => {
  const [localAbis, setLocalAbis]: any = useState({});
  const [contracts, setContracts]: any = useState({});
  const [route, setRoute] = useState('Contracts');
  const [error, setError] = useState('');

  useEffect(() => {
    const persisted = loadState(SAVED_ABIS);
    if (
      typeof persisted !== 'undefined' &&
      typeof window !== 'undefined' &&
      typeof window.ethereum !== 'undefined'
    ) {
      const provider = new providers.Web3Provider(window.ethereum);
      const cons = Object.keys(persisted).reduce((acc: any, val: string) => {
        if (!acc[val]) {
          const abi = persisted[val];
          return {
            ...acc,
            [val]: new Contract(abi.address, abi.abi, provider.getSigner()),
          };
        }
        return acc;
      }, {});
      setContracts(cons);
      setLocalAbis(persisted);
    }
  }, []);

  useEffect(() => {
    if (!isEmpty(localAbis)) {
      console.log('localAbis:', localAbis);
      const persisted = loadState(SAVED_ABIS);
      saveState(SAVED_ABIS, {
        ...persisted,
        ...localAbis,
      });
    }
  }, [localAbis]);

  return (
    <Box className="App">
      <Flex p={'2rem 0 0 2rem'}>
        <Button
          bg={route === 'Contracts' ? '#96FF64' : 'white'}
          mr={4}
          onClick={() => setRoute('Contracts')}
        >
          Contracts
        </Button>
        <Button bg={route === 'Events' ? '#96FF64' : 'white'} onClick={() => setRoute('Events')}>
          Events
        </Button>
      </Flex>

      {route === 'Contracts' ? (
        <Contracts
          error={error}
          setError={setError}
          localAbis={localAbis}
          setLocalAbis={setLocalAbis}
          contracts={contracts}
        />
      ) : route === 'Events' ? (
        <Events error={error} contracts={contracts} />
      ) : null}
    </Box>
  );
};

export default App;
