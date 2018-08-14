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
    this.decoder = EthAbi.logDecoder(contract.abi)
    this.getLogs = this.getLogs.bind(this)
  }

  // prettier-ignore
  async getLogs(fromBlock = 0, toBlock = 'latest', eventNames, indexedFilterValues = {}) {
    const currentBlock = (await this.eth.blockNumber()).toNumber()
    if (fromBlock > currentBlock || fromBlock < 0) {
      throw new Error('Invalid fromBlock. It must be less than the currentBlock || it cannot be negative')
    }
    if (fromBlock > toBlock) {
      throw new Error('Invalid fromBlock. It must be less than toBlock')
    }
    if (toBlock > currentBlock) {
      throw new Error('Invalid toBlock. It must be less than or equal to the currentblock')
    }

    const filter = this.getFilter(
      { fromBlock, toBlock }, this.contract, eventNames, indexedFilterValues
    )
    const rawLogs = await this.eth.getLogs(filter)
    const decodedLogs = this.decoder(rawLogs)
    return this.normalizeLogs(rawLogs, decodedLogs)
  }

  // consolidate: logData, txData, eventName
  async normalizeLogs(rawLogs, decodedLogs) {
    return Promise.all(
      rawLogs.map(async (log, index) => {
        const block = await this.eth.getBlockByHash(log.blockHash, false)
        const tx = await this.eth.getTransactionByHash(log.transactionHash)
        // log info
        const logData = decodedLogs[index]
        // transaction info
        const txData = {
          txHash: tx.hash,
          txIndex: tx.transactionIndex.toString(),
          logIndex: rawLogs[index].logIndex.toString(),
          blockNumber: block.number.toString(),
          blockTimestamp: block.timestamp.toNumber(),
        }
        return {
          logData,
          txData,
          eventName: logData._eventName,
        }
      })
    )
  }

  // adapted from:
  // https://github.com/0xProject/0x.js/blob/development/packages/0x.js/src/utils/filter_utils.ts#L15
  getFilter(blockRange, contract, eventNames, indexFilterValues = {}) {
    const { abi, address } = contract
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