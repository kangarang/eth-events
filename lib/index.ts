'use strict';

import { ethers, providers, utils } from 'ethers';
import { Block, Log, TransactionReceipt } from 'ethers/providers';
import { LogDescription } from 'ethers/utils';
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
  let fromBlock: number = startBlock;
  const contracts: ethers.Contract[] = contractObjects.map((c: IContractDetails) => {
    let contract: any = new ethers.Contract(c.address, c.abi, provider);
    // set contract name and address
    if ('name' in c) {
      contract.contractName = c.name;
    }
    contractAddresses = contractAddresses.concat(utils.getAddress(c.address));
    return contract;
  });

  /**
   * Gets all events from genesis block (contract) -> current block
   */
  async function getAllEvents(startBlock?: number, endBlock?: number): Promise<IEthEvent[]> {
    const currentBlockNumber: number = await provider.getBlockNumber();
    if (startBlock) {
      fromBlock = startBlock;
    }
    // TODO: >1 block on mainnet
    let toBlock: number =
      endBlock || (provider.network.chainId === 420 ? currentBlockNumber : fromBlock + 1);
    const blocksRange: number[] = range(fromBlock, toBlock);

    console.log();
    console.log('current block:', currentBlockNumber);
    console.log('blocksRange:', blocksRange);
    console.log();

    const events: IEthEvent[] = await Promise.all(
      blocksRange.map(async blockNumber => {
        try {
          // get block
          const block: Block = await provider.getBlock(blockNumber, false);

          try {
            // get block tx receipts
            const txReceipts: TransactionReceipt[] = await Promise.all(
              block.transactions.map((tx: string) => provider.getTransactionReceipt(tx))
            );
            // FILTER: only txs w/ Logs & to/from Contract addresses
            const filtered: TransactionReceipt[] = txReceipts.filter(
              (receipt: TransactionReceipt) =>
                receipt.from &&
                receipt.to &&
                receipt.logs &&
                receipt.logs.length > 0 &&
                (contractAddresses.includes(utils.getAddress(receipt.from)) ||
                  contractAddresses.includes(utils.getAddress(receipt.to)))
            );

            try {
              // get decoded logs
              const logsInBlock: IEthEvent[] = decodeLogsByTxReceipts(block.timestamp, filtered);
              // [[Log, Log]] -> [Log, Log]
              // [[]] -> []
              return flatten(logsInBlock);
            } catch (error) {
              console.error(`ERROR while decoding tx receiptS: ${error.message}`);
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
      })
    );
    // [[], [], [Log, Log]] -> [Log, Log]
    return flatten(events);
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
        return flatten(events);
      } catch (error) {
        // prettier-ignore
        const sliced: string = receipt.transactionHash ? receipt.transactionHash.slice(0, 8) : 'undefined tx hash';
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
      .map((log: Log): IEthEvent => {
        const decoded: LogDescription = contract.interface.parseLog(log);

        if (decoded) {
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

        // null || custom, decoded log
        return decoded;
      })
      .filter(l => l !== null);
  }

  return Object.freeze({
    getAllEvents,
  });
}
