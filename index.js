'use strict'

const EthAbi = require('ethjs-abi')
const utils = require('ethers/utils')
const map = require('lodash/fp/map')
const find = require('lodash/fp/find')
const every = require('lodash/fp/every')
const zipWith = require('lodash/fp/zipWith')
const isArray = require('lodash/fp/isArray')
const includes = require('lodash/fp/includes')
const isString = require('lodash/fp/isString')
const isUndefined = require('lodash/fp/isUndefined')

class EthEvents {
  constructor(ethjs, contract) {
    this.eth = ethjs
    this.contract = contract
    // https://github.com/ethjs/ethjs-abi
    this.decoder = EthAbi.logDecoder(contract.abi)
    // batch every 75,000 blocks
    this.blockRangeThreshold = 75000
    this.checkCode()

    this.getLogs = this.getLogs.bind(this)
    this.normalizeLogs = this.normalizeLogs.bind(this)
    this.batchGetLogs = this.batchGetLogs.bind(this)
    this.validateBlockNumbers = this.validateBlockNumbers.bind(this)
  }

  // Verifies there's a contract that exists at the specified address & network
  async checkCode() {
    const code = await this.eth.getCode(this.contract.address)
    if (code === '0x') {
      throw new Error('NO CODE')
    }
    return true
  }

  // prettier-ignore
  // Validates block range
  validateBlockNumbers(fromBlock, toBlock, currentBlock) {
    if (fromBlock > currentBlock || fromBlock < 0) {
      throw new Error('Invalid fromBlock. It must be less than the currentBlock || it cannot be negative')
    }
    if (fromBlock > toBlock) {
      throw new Error('Invalid fromBlock. It must be less than toBlock')
    }
    if (toBlock > currentBlock) {
      throw new Error('Invalid toBlock. It must be less than or equal to the currentblock')
    }
  }

  // prettier-ignore
  // Gets logs using a block range
  async getLogs(fromBlock = 0, toBlock = 'latest', eventNames = [], indexedFilterValues = {}, batch = false) {
    try {
      // get the current block number
      const currentBlock = (await this.eth.blockNumber()).toNumber()
      // validate block range
      this.validateBlockNumbers(fromBlock, toBlock, currentBlock)

      // edit toBlock if string is provided
      if (toBlock === 'latest') {
        toBlock = currentBlock
      }

      // create a filter with the appropriate block_numbers and topics
      const filter = this.createFilter(
        { fromBlock, toBlock }, eventNames, indexedFilterValues
      )

      // CASE: too large of a gap (OVER 50,000 blocks!)
      if (batch && toBlock - fromBlock >= this.blockRangeThreshold) {
        console.log('batching...')
        // edit the filter
        const newFilter = {
          ...filter,
          toBlock: fromBlock + this.blockRangeThreshold,
        }
        // get logs every 50,000 blocks
        return this.batchGetLogs(newFilter, toBlock)
      }

      console.log(`Getting logs from ${fromBlock} to ${toBlock}...`)
      // CASE: within threshold range. get logs
      const rawLogs = await this.eth.getLogs(filter)
      // decode logs, return normalized logs
      const decodedLogs = this.decoder(rawLogs)
      return this.normalizeLogs(rawLogs, decodedLogs)
    } catch (error) {
      console.log('Error while trying to get and decode logs:', error.toString())
      return error
    }
  }

  // prettier-ignore
  // If block range is not within the threshold, batch getLogs using the threshold value
  async batchGetLogs(filter, finalBlock, logs = []) {
    try {
      console.log('# accLogs:', logs.length)
      console.log(`${filter.fromBlock} .. ${filter.toBlock}`)

      // CASE: to_block is greater than or equal to the final_block. get logs
      if (filter.toBlock >= finalBlock) {
        // do not exceed the finalBlock
        filter.toBlock = finalBlock
        const rawLogs = await this.eth.getLogs(filter)
        // concat the accumulation of logs
        const accLogs = logs.concat(rawLogs)
        // decode logs, return normalized logs
        const decodedLogs = this.decoder(accLogs)
        return this.normalizeLogs(accLogs, decodedLogs)
      }

      // CASE: to_block is less than the final_block. edit the filter
      // from_block = to_block + 1
      // to_block += block_batch_threshold
      const newFilter = {
        ...filter,
        fromBlock: filter.toBlock + 1,
        toBlock: filter.toBlock + this.blockRangeThreshold,
      }
      const rawLogs = await this.eth.getLogs(newFilter)
      // concat the accumulation of logs
      const accLogs = logs.concat(rawLogs)
      // recursion: new_filter, new accumulation of logs
      return this.batchGetLogs(newFilter, finalBlock, accLogs)
    } catch (error) {
      console.log('error:', error)
      throw new Error('Error while recursively batching logs:', error.toString())
    }
  }

  // normalize/consolidate return data
  // return { logData, txData, eventName }
  async normalizeLogs(rawLogs, decodedLogs) {
    try {
      return Promise.all(
        rawLogs.map(async (log, index) => {
          try {
            const block = await this.eth.getBlockByHash(log.blockHash, false)
            const tx = await this.eth.getTransactionByHash(log.transactionHash)
            // log info
            const logData = decodedLogs[index]
            // transaction info
            const txData = {
              txHash: tx.hash,
              logIndex: rawLogs[index].logIndex.toString(),
              blockNumber: block.number.toString(),
              blockTimestamp: block.timestamp.toString(),
            }
            return {
              logData,
              txData,
              eventName: logData._eventName,
            }
          } catch (error) {
            console.log('decoded logs error:', error)
          }
        })
      )
    } catch (error) {
      console.log('Error while trying to normalize logs:', error.toString())
    }
  }

  // adapted from:
  // https://github.com/0xProject/0x.js/blob/development/packages/0x.js/src/utils/filter_utils.ts#L15
  createFilter(blockRange, eventNames = [], indexFilterValues = {}) {
    const { abi, address } = this.contract
    const { fromBlock, toBlock } = blockRange
    if (eventNames.length === 0) {
      return {
        fromBlock,
        toBlock,
        address,
        topics: [],
      }
    }

    const evSigTopics = eventNames.map(eventName => {
      // prettier-ignore
      const eventAbi = find({ 'name': eventName }, abi)
      const eventString = this.getEventStringFromAbiName(eventAbi)
      const eventSignature = utils.id(eventString)
      const eventSignatureTopic = utils.hexlify(eventSignature)
      return eventSignatureTopic
    })

    // prettier-ignore
    const eventAbi = find({ 'name': eventNames[0] }, abi)
    const topicsForIndexedArgs = this.getTopicsForIndexedArgs(eventAbi, indexFilterValues)
    const topics = [evSigTopics, ...topicsForIndexedArgs]

    if (!isUndefined(blockRange)) {
      return { fromBlock, toBlock, address, topics }
    }
    return { address, topics }
  }

  getEventStringFromAbiName(eventAbi) {
    const types = map('type', eventAbi.inputs)
    const signature = `${eventAbi.name}(${types.join(',')})`
    return signature
  }

  getTopicsForIndexedArgs(abi, indexFilterValues) {
    const topics = []
    for (const eventInput of abi.inputs) {
      if (!eventInput.indexed) {
        continue
      }
      if (isUndefined(indexFilterValues[eventInput.name])) {
        // Null is a wildcard topic in a JSON-RPC call
        topics.push(null)
      } else {
        const value = indexFilterValues[eventInput.name]
        // An arrayish object is any such that it:
        // has a length property
        // has a value for each index from 0 up to (but excluding) length
        // has a valid byte for each value; a byte is an integer in the range [0, 255]
        // is NOT a string
        const arrayish = utils.arrayify(value)
        // zeros prepended to 32 bytes
        const padded = utils.padZeros(arrayish, 32)
        const topic = utils.hexlify(padded)
        topics.push(topic)
      }
    }
    return topics
  }

  matchesFilter(log, filter) {
    if (!isUndefined(filter.address) && log.address !== filter.address) {
      return false
    }
    if (!isUndefined(filter.topics)) {
      return this.matchesTopics(log.topics, filter.topics)
    }
    return true
  }

  matchesTopics(logTopics, filterTopics) {
    const matchesTopic = zipWith(this.matchesTopic.bind(this), logTopics, filterTopics)
    const matchesTopics = every(matchesTopic)
    return matchesTopics
  }

  matchesTopic(logTopic, filterTopic) {
    if (isArray(filterTopic)) {
      return includes(logTopic, filterTopic)
    }
    if (isString(filterTopic)) {
      return filterTopic === logTopic
    }
    // null topic is a wildcard
    return true
  }
}

module.exports = EthEvents
