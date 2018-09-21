'use strict'

const ethers = require('ethers')
const utils = require('ethers/utils')
const find = require('lodash/fp/find')
const every = require('lodash/fp/every')
const zipWith = require('lodash/fp/zipWith')
const isArray = require('lodash/fp/isArray')
const isUndefined = require('lodash/fp/isUndefined')

interface ContractDetails {
  abi: any[]
  address: string
  blockNumber: number
  network: string
}
interface EventParser {
  (topics: any, data: any): any
}
// interface RawLog {
//   logIndex: number
//   blockHash: string
//   transactionHash: string
//   address: string
//   topics: string[]
//   data: any
// }
interface EventInfo {
  name: string
  topics: string[]
  parse: EventParser
}
interface EthersEventInterfaces {
  [eventName: string]: EventInfo
}
interface EthersContractInterface {
  events: EthersEventInterfaces
  abi: any[]
}
interface GetLogsFilter {
  address: string
  fromBlock: number
  toBlock: number
  topics: any[]
}
interface TxData {
  txHash: string
  logIndex: number
  blockNumber: number
  blockTimestamp: number
}

function EthEvents(contractDetails: any, blockRangeThreshold: number = 5000) {
  const { abi, address, blockNumber, network }: ContractDetails = contractDetails
  const contractAddress: string = utils.getAddress(address)
  const provider: any = new ethers.providers.InfuraProvider(network)
  // Verifies there's a contract that exists at the specified address & network
  provider.getCode(contractAddress).then((code: string) => {
    if (code === '0x') {
      throw new Error('NO CODE')
    }
  })
  const eventIFaces: EthersEventInterfaces = new ethers.Contract(
    contractAddress,
    abi,
    provider
  ).interface.events
  const blockStart: number = blockNumber || 1

  // prettier-ignore
  // Validates block range
  function validateBlockNumbers(fromBlock: string|number, toBlock: string|number, currentBlock: number) {
    if (fromBlock > currentBlock || fromBlock < 0) {
      throw new Error('Invalid fromBlock. It must be less than the currentBlock || it cannot be negative')
    }
    if (fromBlock > toBlock) {
      throw new Error('Invalid blockRange. fromBlock must be less than toBlock')
    }
    if (toBlock > currentBlock) {
      throw new Error('Invalid toBlock. It must be less than or equal to the currentblock')
    }
  }

  // prettier-ignore
  // Gets logs using a block range
  async function getLogs(
    fromBlock: any = blockStart,
    toBlock: any = 'latest',
    eventNames: string[] = [],
    indexedFilterValues: any = {},
    batch: boolean = true
  ): Promise<any> {
    // Get the current block number
    const currentBlock: number = await provider.getBlockNumber()
    console.log(`
        Get logs from: ${contractAddress}
        Current block: ${currentBlock}
        `)
    try {
      // Validate block range
      validateBlockNumbers(fromBlock, toBlock, currentBlock)
    } catch (error) {
      console.log('Error while validating block numbers:', error.toString())
      console.log(`
        New block range: ${blockStart} - ${currentBlock}
        `)
      fromBlock = blockStart
      toBlock = 'latest'
    }
    // Reset block to start looking for logs
    provider.resetEventsBlock(fromBlock)

    // Edit toBlock if string is provided
    if (toBlock === 'latest') {
      toBlock = currentBlock
    }
    // Create a filter with the appropriate block_numbers and topics
    const filter: GetLogsFilter = createFilter(
      { fromBlock, toBlock }, eventNames, indexedFilterValues
    )

    // CASE: Too large of a gap -- over the block range threshold!
    if (batch && toBlock - fromBlock > blockRangeThreshold) {
      console.log(`
        Batching logs from ${fromBlock} to ${toBlock}...
        `)
      // Edit the filter for the first batched set of blocks
      const newFilter: GetLogsFilter = {
        ...filter,
        toBlock: fromBlock + blockRangeThreshold,
      }
      return batchGetLogs(newFilter, toBlock)
    }

    try {
      console.log(`Getting logs from ${fromBlock} to ${toBlock}...`)
      // CASE: within threshold range. get logs
      return getDecodedNormalizedLogs(filter)
    } catch (error) {
      throw new Error('Error while trying to get logs:')
    }
  }

  // If block range is not within the threshold, batch getLogs using the threshold value
  async function batchGetLogs(
    filter: GetLogsFilter,
    finalBlock: number,
    logs: any[] = []
  ): Promise<any> {
    if (filter.toBlock < finalBlock) {
      try {
        // toBlock is less than the finalBlock, Get logs with the incoming filter
        const normalizedLogs: any[] = await getDecodedNormalizedLogs(filter)
        const accLogs: any[] = logs.concat(normalizedLogs)
        // Set new filter
        const newFilter: GetLogsFilter = {
          ...filter,
          fromBlock: filter.toBlock + 1,
          toBlock: filter.toBlock + blockRangeThreshold,
        }
        console.log(`Found ${normalizedLogs.length} logs`)
        console.log('Subtotal logs:', accLogs.length)
        console.log('Remaining blocks:', finalBlock - newFilter.fromBlock)
        console.log()

        // Recurse: new filter, new accumulation of logs
        return batchGetLogs(newFilter, finalBlock, accLogs)
      } catch (error) {
        console.log('Error while getting batched logs:', error)
        return batchGetLogs(filter, finalBlock, logs)
      }
    }

    // ----------------------------------------
    // toBlock is > finalBlock
    // Get final logs from the remaining blocks
    // ----------------------------------------

    try {
      const lastFilter = {
        ...filter,
        toBlock: finalBlock,
      }
      const lastNormalizedLogs = await getDecodedNormalizedLogs(lastFilter)
      console.log(`Found ${lastNormalizedLogs.length} logs`)
      // Return final array of decoded normalized logs
      const finalLogs = logs.concat(lastNormalizedLogs)
      console.log(`
        Total logs: ${finalLogs.length}
      `)
      return finalLogs
    } catch (error) {
      console.log('Error while getting final logs:', error)
      return batchGetLogs(filter, finalBlock, logs)
    }
  }

  async function getDecodedNormalizedLogs(filter: GetLogsFilter): Promise<any> {
    console.log(`Search: ${filter.fromBlock} - ${filter.toBlock}`)
    let rawLogs
    try {
      rawLogs = (await provider.getLogs(filter)).filter((log: any) =>
        matchesFilter(log, filter)
      )
    } catch (error) {
      console.log('Error while decoding and normalizing logs:', error)
      return getDecodedNormalizedLogs(filter)
    }

    const decodedLogs: any[] = await Promise.all(
      rawLogs.map((log: any) => {
        const eventInfo = getEventInfoFromLog(log)
        return eventInfo.parse(log.topics, log.data)
      })
    )
    return normalizeLogs(rawLogs, decodedLogs)
  }

  // Normalize/consolidate return data
  // Return: { logData, txData, eventName, contractAddress }
  async function normalizeLogs(rawLogs: any[], decodedLogs: any[]) {
    try {
      return Promise.all(
        rawLogs.map(async (log, index) => {
          let block
          try {
            block = await provider.getBlock(log.blockHash)
          } catch (err) {
            console.log('Error while trying to get block:', err.toString())
            if (err.responseText) {
              console.log(err.responseText)
            }
            console.log('Block:', log.blockHash)
            console.log('Log:', rawLogs[index])
            console.log('Index:', index)
            console.log('Trying again')
            block = await provider.getBlock(log.blockHash)
          }
          // Decoded log
          const logData = decodedLogs[index]
          // Block and transaction essentials
          const txData: TxData = {
            txHash: log.transactionHash,
            logIndex: log.logIndex,
            blockNumber: block.number,
            blockTimestamp: block.timestamp,
          }
          return {
            logData,
            txData,
            contractAddress: log.address,
            eventName: Object.keys(eventIFaces).filter(
              ev => eventIFaces[ev].topics[0] === log.topics[0]
            )[0],
          }
        })
      )
    } catch (error) {
      console.log('Error while trying to get blocks for logs:', error.toString())
      console.log('Trying again')
      setTimeout(() => {
        return normalizeLogs(rawLogs, decodedLogs)
      }, 500)
    }
  }

  function createFilter(
    blockRange: any,
    eventNames: any[] = [],
    indexFilterValues: any = {}
  ) {
    const { fromBlock, toBlock } = blockRange
    const filter = {
      fromBlock,
      toBlock,
      address: contractAddress,
    }

    let topics: any[] = [getEventSignatureTopicsByEventNames(eventNames)]

    if (eventNames.length === 0) {
      topics = [getAllEventSignatureTopics()]
    }

    if (Object.keys(indexFilterValues).length > 0) {
      // prettier-ignore
      const eventAbi: any = find({ 'name': eventNames[0] }, abi)
      topics = [...topics, ...getTopicsForIndexedArgs(eventAbi, indexFilterValues)]
    }

    return { ...filter, topics }
  }

  function getEventInfoFromLog(log: any): EventInfo {
    const eventName: string = find(
      (eventName: string) => eventIFaces[eventName].topics[0] === log.topics[0],
      Object.keys(eventIFaces)
    )
    return eventIFaces[eventName]
  }

  function getEventSignatureTopicsByEventNames(eventNames: string[]): string[] {
    return eventNames.map(eventName => eventIFaces[eventName].topics[0])
  }

  function getAllEventSignatureTopics(): any[] {
    return Object.keys(eventIFaces).map(eventName => {
      return eventIFaces[eventName].topics[0]
    })
  }

  function getTopicsForIndexedArgs(abi: any, indexFilterValues: any): string {
    const indexedInputs = abi.inputs.filter((input: any) => input.indexed)
    return indexedInputs.map((indexedInput: any) => {
      const { name } = indexedInput
      if (isUndefined(indexFilterValues[name])) {
        return null
      }
      const value = indexFilterValues[name]
      const arrayish = utils.arrayify(value)
      // Zeros prepended to 32 bytes
      const padded = utils.padZeros(arrayish, 32)
      const topic = utils.hexlify(padded)
      return topic
    })
  }

  function matchesFilter(log: any, filter: GetLogsFilter): boolean {
    if (
      !isUndefined(log) &&
      !isUndefined(log.address) &&
      !isUndefined(filter.address) &&
      log.address !== filter.address
    ) {
      return false
    }
    if (!isUndefined(filter.topics)) {
      return matchesTopics(log.topics, filter.topics)
    }
    return true
  }

  function matchesTopics(logTopics: any[], filterTopics: any[]): boolean {
    const matchTopic = zipWith(matchesTopic, logTopics, filterTopics)
    const matchesTopics = every(matchTopic)
    return matchesTopics
  }

  function matchesTopic(logTopic: string, filterTopic: any): boolean {
    if (isArray(filterTopic)) {
      return filterTopic.includes(logTopic)
    }
    if (typeof filterTopic === 'string') {
      return filterTopic === logTopic
    }
    // null topic is a wildcard
    return true
  }

  return Object.freeze({
    getLogs,
  })
}

module.exports = EthEvents
