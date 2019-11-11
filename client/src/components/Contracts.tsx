import React, { useState, useEffect } from 'react';
import Box from './system/Box';
import Flex from './system/Flex';
import Button from './ui/Button';
import Input from './ui/Input';
import VisibleMethods from './VisibleMethods';
import { saveState, loadState, SAVED_HIDDEN_METHODS } from '../utils/localStorage';
import A from './ui/A';
import { Field } from './ui/Field';
import { formatMethodTypes } from '../utils/format';
import isEmpty from 'lodash/isEmpty';

interface Props {
  error: string;
  setError(err: string): void;
  localAbis: any;
  setLocalAbis(localAbis: any): void;
  contracts: any;
}

const Contracts: React.FC<Props> = ({
  error,
  setError,
  localAbis,
  setLocalAbis,
  contracts,
}: Props) => {
  const [name, setName]: [string, any] = useState('');
  const [abi, setAbi]: [string, any] = useState('');
  const [address, setAddress]: [string, any] = useState('');
  const [hiddenMethods, setHiddenMethods]: [any, any] = useState({});

  function resetForm() {
    setError('');
    setName('');
    setAbi('');
    setAddress('');
  }

  useEffect(() => {
    const savedHiddenMethods = loadState(SAVED_HIDDEN_METHODS);
    if (savedHiddenMethods) {
      setHiddenMethods(savedHiddenMethods);
    }
  }, []);

  useEffect(() => {
    const savedHiddenMethods = loadState(SAVED_HIDDEN_METHODS);
    saveState(SAVED_HIDDEN_METHODS, {
      ...savedHiddenMethods,
      ...hiddenMethods,
    });
  }, [hiddenMethods]);

  function handleHideMethod(methodName: string, contractName: string) {
    setHiddenMethods({
      ...hiddenMethods,
      [contractName]: {
        ...hiddenMethods[contractName],
        [methodName]: true,
      },
    });
  }

  function handleSubmit(e: any) {
    e.preventDefault();
    if (typeof abi !== 'undefined') {
      try {
        const json = JSON.parse(abi);
        const newLocalAbis = {
          ...localAbis,
          [name]: {
            abi: json,
            address: address,
          },
        };

        setLocalAbis(newLocalAbis);
        resetForm();
      } catch (error) {
        setError('Invalid JSON abi');
      }
    }
  }

  return (
    <Box className="Contracts">
      <Box color="red">{error}</Box>

      <Flex p={4}>
        <Box width={0.5} mr={4}>
          {typeof localAbis !== 'undefined' && !isEmpty(localAbis) ? (
            Object.keys(localAbis).map(contractName => {
              const { abi: contractAbi, address: contractAddress } = localAbis[contractName];
              const txsAbi = contractAbi.filter((m: any) => m.type === 'function' && !m.constant);
              const callsAbi = contractAbi.filter((m: any) => m.type === 'function' && m.constant);
              const eventsAbi = contractAbi.filter((m: any) => m.type === 'event');

              const txs = txsAbi.map(formatMethodTypes);
              const calls = callsAbi.map(formatMethodTypes);
              const events = eventsAbi.map(formatMethodTypes);
              const visibleCalls = visibilityFilter(calls, hiddenMethods, contractName);
              const visibleTxs = visibilityFilter(txs, hiddenMethods, contractName);
              const visibleEvents = visibilityFilter(events, hiddenMethods, contractName);

              return (
                <Box mb={4} key={contractName}>
                  <Box mb={1} p={2} fontSize={3} border="1px solid black">
                    {contractName}
                  </Box>
                  <Box p={2} border="1px solid black">
                    <Box pb={2} fontSize={0}>
                      Address:{' '}
                      <A href={`https://etherscan.io/address/${contractAddress}`} target="_blank">
                        {contractAddress}
                      </A>
                    </Box>
                    <VisibleMethods
                      methodType="Calls"
                      methods={visibleCalls}
                      contract={contracts[contractName]}
                      contractName={contractName}
                      handleHideMethod={handleHideMethod}
                    />
                    <VisibleMethods
                      methodType="Transactions"
                      methods={visibleTxs}
                      contractName={contractName}
                      handleHideMethod={handleHideMethod}
                    />
                    <VisibleMethods
                      methodType="Events"
                      methods={visibleEvents}
                      contractName={contractName}
                      handleHideMethod={handleHideMethod}
                    />
                  </Box>
                </Box>
              );
            })
          ) : (
            <Box>Nothing here. Save a new contract --></Box>
          )}
        </Box>

        <Box width={0.5}>
          <Box fontSize={36} fontWeight="bold" mb={3}>
            Save new contract
          </Box>
          <form onSubmit={handleSubmit}>
            <Flex column>
              <Field label="Contract name" value={name} handleChange={setName} />
              <Field label="Contract address" value={address} handleChange={setAddress} />
              <Field
                label="Contract ABI"
                inputComponent={
                  <Input
                    width={0.6}
                    type="textarea"
                    rows="10"
                    cols="100"
                    value={abi}
                    handleChange={setAbi}
                  />
                }
              />
              <Button>Save</Button>
            </Flex>
          </form>
        </Box>
      </Flex>
    </Box>
  );
};

function visibilityFilter(methods: any[], hiddenMethods: any, contractName: string) {
  return methods.filter(
    (m: any) => !hiddenMethods[contractName] || !hiddenMethods[contractName].hasOwnProperty(m.name)
  );
}

export default Contracts;
