const { providers, Contract } = require('ethers');
const range = require('lodash/range');
const flatten = require('lodash/flatten');

const jsonRpcEndpoint: string;
const contractAddresses: string[];
const contractABIs: any[];
const startBlock: string;

interface EthEvent {
  
}

/**
 * Gets all events from genesis block (contract) -> current block
 */
async function getAllEvents(contractABIs, contractAddresses, jsonRpcEndpoint, startBlock) {
  const provider: providers.JsonRpcProvider = new providers.JsonRpcProvider(jsonRpcEndpoint);
  const contracts: Contract[] = contractABIs.map((abi, i) => new Contract(contractAddresses[i], abi, provider));

// todo: handle errors
  const currentBlockNumber: number = await provider.getBlockNumber();
  console.log('current block:', currentBlockNumber);
  console.log('start block:', startBlock);

  const blocksRange: number[] = range(startBlock, currentBlockNumber + 1);

  const events: EthEvent[] = await Promise.all(
    blocksRange.map(async blockNumber => {
      try {
        const block = await provider.getBlock(blockNumber, true);
        const logsInBlock = await getLogsInBlock(block, provider, contracts, contractAddresses);
      } catch (error) {
        // TODO: retry
        throw error
      }
      // [[Log, Log]] -> [Log, Log]
      // [[]] -> []
      return flatten(logsInBlock);
    })
  );
  // [[], [], [Log, Log]] -> [Log, Log]
  return flatten(events);
}

/**
 * Gets decoded logs from all transactions in a single block
 * @param {*} block
 * @returns {Array}
 */
async function getLogsInBlock(block, provider, contracts, contractAddresses) {
  return Promise.all(
    block.transactions.map(async tx => {
      // filter for to/from contract addresses
      if (contractAddresses.includes(tx.from) || contractAddresses.includes(tx.to)) {
        return provider.getTransactionReceipt(tx.hash).then(receipt => {
          if (receipt.logs.length > 0) {
            const events = contracts.map(c => decodeLogs(c, block, tx, receipt.logs));
            return flatten(events);
          }
          return [];
        });
      }
      return []
    })
  );
}


/**
 * Decodes raw logs using an ethers.js contract interface
 * @param {ethers.Contract} contract ethers.js contract
 * @param {*} block
 * @param {*} tx transaction from a block
 * @param {*} logs raw logs
 * @returns Filtered (!null) array of decoded logs w/ additional transaction information
 */
function decodeLogs(contract, block, tx, logs) {
  return logs.map(log => {
      let decoded = contract.interface.parseLog(log);

      if (decoded) {
        return {
          ...decoded,
          sender: tx.from,
          recipient: tx.to,
          timestamp: block.timestamp,
          blockNumber: block.number,
          txHash: tx.hash,
          logIndex: log.logIndex,
          toContract:
            tx.to === contract.address
              ? contract.name
              : 'n/a',
        };
      }

      // null || custom, decoded log
      return decoded;
    })
    .filter(l => l !== null);
}

module.exports = {
  getAllEvents,
};
