import React, { useState, useEffect } from 'react';
import Box from './system/Box';
import Flex from './system/Flex';

interface Props {
  error: string;
  contracts: any;
}

const Events: React.FC<Props> = ({ error, contracts }: Props) => {
  const [contractNames, setContractNames]: [string[], any] = useState([]);
  useEffect(() => {
    const contractNames = Object.keys(contracts);
    setContractNames(contractNames);
  }, [contracts]);

  return (
    <Box className="Events">
      <Box color="red">{error}</Box>

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
      </Flex>
    </Box>
  );
};

export default Events;
