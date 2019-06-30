'use strict';

import { ethers, providers, utils } from 'ethers';
import { Block, Log, TransactionReceipt } from 'ethers/providers';
import { LogDescription } from 'ethers/utils';
import { Promise } from 'bluebird';

const range = require('lodash/range');
const flatten = require('lodash/flatten');

interface IEthEvent {
  name?: string;
  values?: any;
  sender?: string;
  recipient?: string;
  txHash?: string;
  logIndex?: number;
  timestamp?: number;
  blockNumber?: number;
  toContract?: string;
}
interface IContractDetails {
  abi: any[];
  address: string;
  name?: string;
}

export function EthEvents(
  contractObjects: IContractDetails[],
  jsonRpcEndpoint: string,
  startBlock: number = 1
) {
  const provider: providers.JsonRpcProvider = new providers.JsonRpcProvider(jsonRpcEndpoint);
  let contractAddresses: string[] = [];
  let initialBlock: number = startBlock;
  const contracts: ethers.Contract[] = contractObjects.map((c: IContractDetails) => {
    let contract: any = new ethers.Contract(c.address, c.abi, provider);
    // set contract name and address
    if (c.hasOwnProperty('name')) {
      contract.contractName = c.name;
    }
    contractAddresses = contractAddresses.concat(utils.getAddress(c.address));
    return contract;
  });

  /**
   * Gets all events from genesis block (contract) -> current block
   */
  async function getEvents(
    startBlock: number = initialBlock,
    endBlock?: number
  ): Promise<IEthEvent[]> {
    const currentBlockNumber: number = await provider.getBlockNumber();

    // prettier-ignore
    if (!!endBlock && endBlock > currentBlockNumber) { // specified, out of range
      console.log('specified endBlock out of range. using currentBlock', currentBlockNumber);
      endBlock = currentBlockNumber + 1;
    } else if (startBlock > currentBlockNumber) { // startBlock out of range
      console.log(`specified startBlock (${startBlock}) greater than currentBlock ${currentBlockNumber}`);
      startBlock = initialBlock;
      endBlock = currentBlockNumber + 1;
    } else if (endBlock && endBlock > startBlock) { // specified, in range
      endBlock = endBlock;
    } else if (provider.network.chainId === 420) { // devel, (get all blocks)
      startBlock = 1;
      endBlock = currentBlockNumber + 1;
    } else {
      endBlock = startBlock + 5;
    }

    // NOTE: Ranges of >5 blocks on a public network will take a long ass time
    const blocksRange: number[] = range(startBlock, endBlock);

    console.log();
    console.log('current block:', currentBlockNumber);
    console.log(`block range: ${blocksRange[0]} .. ${blocksRange[blocksRange.length - 1]}`);
    console.log();

    // 1 block at a time, 5 txs at a time
    // 1 second interval between rpc queries
    const events: IEthEvent[] = await Promise.map(
      blocksRange,
      async (blockNumber: number) => {
        try {
          // get block
          const block: Block = await provider.getBlock(blockNumber, false);
          const numTxInBlock = block.transactions.length;
          console.log(`${numTxInBlock} txs in block ${blockNumber}`);

          try {
            // get tx receipts
            const txReceipts = await Promise.map(
              block.transactions,
              async (txHash: string, i: number) => {
                await Promise.delay(1250); // 1.25 second interval

                console.log(`tx ${i}/${numTxInBlock}`);
                return getTransactionReceipt(provider, txHash);
              },
              { concurrency: 5 } // 5 tx queries per interval
            );
            // FILTER: only txs w/ Logs && to/from Contract addresses
            const filtered: TransactionReceipt[] = txReceipts.filter(
              (receipt: TransactionReceipt) =>
                !!receipt.from &&
                !!receipt.to &&
                !!receipt.logs &&
                receipt.logs.length > 0 &&
                (contractAddresses.includes(utils.getAddress(receipt.from)) ||
                  contractAddresses.includes(utils.getAddress(receipt.to)))
            );

            if (filtered.length > 0) {
              console.log(`found ${filtered.length} txs in block ${blockNumber}`);
            }

            try {
              // get decoded logs
              const logsInBlock: IEthEvent[] = decodeLogsByTxReceipts(block.timestamp, filtered);
              // [[Log, Log]] -> [Log, Log]
              // [[]] -> []
              return flatten(logsInBlock);
            } catch (error) {
              console.error(`ERROR while decoding tx receipts: ${error.message}`);
              throw error;
            }
          } catch (error) {
            console.error(`ERROR while getting tx receipts: ${error.message}`);
            throw error;
          }
        } catch (error) {
          // TODO: retry
          console.error(`ERROR while getting block ${blockNumber}: ${error.message}`);
          throw error;
        }
      },
      { concurrency: 1 } // 1 block at a time
    );
    // [[], [], [Log, Log]] -> [Log, Log]
    return flatten(events);
  }

  async function getTransactionReceipt(
    provider: providers.JsonRpcProvider,
    txHash: string,
    counter: number = 1
  ) {
    try {
      return provider.getTransactionReceipt(txHash);
    } catch (error) {
      console.error('error:', error);
      console.log('trying again for tx:', txHash);
      if (counter === 4) {
        throw error;
      } else {
        return getTransactionReceipt(provider, txHash, counter + 1);
      }
    }
  }

  /**
   * Gets decoded logs from transaction receipts in a single block
   */
  function decodeLogsByTxReceipts(
    timestamp: number,
    txReceipts: TransactionReceipt[]
  ): IEthEvent[] {
    // prettier-ignore
    return txReceipts.map((receipt: TransactionReceipt) => {
      try {
        const events: IEthEvent[][] = contracts.map((c: ethers.Contract) =>
          decodeLogs(c, timestamp, receipt)
        );
        if (events.length > 0) {
          console.log(`found ${events.length} logs in block ${receipt.blockNumber}`);
        }
        return flatten(events);
      } catch (error) {
        // prettier-ignore
        const sliced: string = receipt.transactionHash ? receipt.transactionHash.slice(0, 8) : '[undefined tx hash]';
        console.error(`ERROR while decoding tx receipt ${sliced}: ${error.message}`);
        throw error;
      }
    });
  }

  /**
   * Decodes raw logs using an ethers.js contract interface
   */
  function decodeLogs(
    contract: ethers.Contract,
    timestamp: number,
    receipt: TransactionReceipt
  ): IEthEvent[] {
    // prettier-ignore
    return (receipt as any).logs
      .map((log: Log): IEthEvent | null => {
        const decoded: LogDescription = contract.interface.parseLog(log);
        // return custom, decoded log -OR- null
        if (!!decoded) {
          const { name, values } = decoded;
          const { transactionHash: txHash, blockNumber, to, from } = receipt;

          return {
            name,
            values,
            sender: from,
            recipient: to,
            blockNumber,
            timestamp,
            txHash,
            logIndex: log.logIndex,
            toContract:
              to && utils.getAddress(to) === contract.address && 'contractName' in contract
                ? contract.contractName
                : 'n/a',
          };
        }
        return null;
      })
      .filter(l => l !== null);
  }

  return Object.freeze({
    getEvents,
  });
}
