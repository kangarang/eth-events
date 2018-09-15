'use strict'

const ethers = require('ethers')
const utils = require('ethers/utils')
const find = require('lodash/fp/find')
const every = require('lodash/fp/every')
const zipWith = require('lodash/fp/zipWith')
const isArray = require('lodash/fp/isArray')
const isUndefined = require('lodash/fp/isUndefined')

class EthEvents {
  constructor(contractDetails, blockRangeThreshold = 5000) {
    this.contractAddress = utils.getAddress(contractDetails.address)
    this.contractAbi = contractDetails.abi
    this.blockRangeThreshold = blockRangeThreshold
    this.provider = new ethers.providers.InfuraProvider(contractDetails.network)
    // Verifies there's a contract that exists at the specified address & network
    this.provider.getCode(this.contractAddress).then(code => {
      if (code === '0x') {
        throw new Error('NO CODE')
      }
    })
    const contract = new ethers.Contract(
      this.contractAddress,
      contractDetails.abi,
      this.provider
    )
    this.blockStart = contract.blockNumber || 1
    this.eventIFaces = contract.interface.events
  }

  // Verifies there's a contract that exists at the specified address & network
  async checkCode() {
    const code = await this.provider.getCode(this.contractAddress)
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
      throw new Error('Invalid blockRange. fromBlock must be less than toBlock')
    }
    if (toBlock > currentBlock) {
      throw new Error('Invalid toBlock. It must be less than or equal to the currentblock')
    }
  }

  // prettier-ignore
  // Gets logs using a block range
  async getLogs(
    fromBlock = this.blockStart,
    toBlock = 'latest',
    eventNames = [],
    indexedFilterValues = {},
    batch = true
  ) {
    // Get the current block number
    const currentBlock = await this.provider.getBlockNumber()
    console.log(`
        Get logs from: ${this.contractAddress}
        Current block: ${currentBlock}
        `)
    try {
      // Validate block range
      await this.validateBlockNumbers(fromBlock, toBlock, currentBlock)
    } catch (error) {
      console.log('Error while validating block numbers:', error.toString())
      console.log(`
        New block range: ${this.blockStart} - ${currentBlock}
        `)
      fromBlock = this.blockStart
      toBlock = 'latest'
    }
    // Reset block to start looking for logs
    this.provider.resetEventsBlock(fromBlock)

    // Edit toBlock if string is provided
    if (toBlock === 'latest') {
      toBlock = currentBlock
    }
    // Create a filter with the appropriate block_numbers and topics
    const filter = this.createFilter(
      { fromBlock, toBlock }, eventNames, indexedFilterValues
    )

    // CASE: Too large of a gap -- over the block range threshold!
    if (batch && toBlock - fromBlock > this.blockRangeThreshold) {
      console.log(`
        Batching logs from ${fromBlock} to ${toBlock}...
        `)
      // Edit the filter for the first batched set of blocks
      const newFilter = {
        ...filter,
        toBlock: fromBlock + this.blockRangeThreshold,
      }
      return this.batchGetLogs(newFilter, toBlock)
    }

    try {
      console.log(`Getting logs from ${fromBlock} to ${toBlock}...`)
      // CASE: within threshold range. get logs
      return this.getDecodedNormalizedLogs(filter)
    } catch (error) {
      throw new Error('Error while trying to get logs:', error)
    }
  }

  // If block range is not within the threshold, batch getLogs using the threshold value
  async batchGetLogs(filter, finalBlock, logs = []) {
    if (filter.toBlock < finalBlock) {
      try {
        // toBlock is less than the finalBlock, Get logs with the incoming filter
        const normalizedLogs = await this.getDecodedNormalizedLogs(filter)
        const accLogs = logs.concat(normalizedLogs)
        // Set new filter
        const newFilter = {
          ...filter,
          fromBlock: filter.toBlock + 1,
          toBlock: filter.toBlock + this.blockRangeThreshold,
        }
        console.log(`Found ${normalizedLogs.length} logs`)
        console.log('Subtotal logs:', accLogs.length)
        console.log('Remaining blocks:', finalBlock - newFilter.fromBlock)
        console.log()

        // Recurse: new filter, new accumulation of logs
        return this.batchGetLogs(newFilter, finalBlock, accLogs)
      } catch (error) {
        console.log('Error while getting batched logs:', error)
        return this.batchGetLogs(filter, finalBlock, logs)
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
      const lastNormalizedLogs = await this.getDecodedNormalizedLogs(lastFilter)
      console.log(`Found ${lastNormalizedLogs.length} logs`)
      // Return final array of decoded normalized logs
      const finalLogs = logs.concat(lastNormalizedLogs)
      console.log(`
        Total logs: ${finalLogs.length}
      `)
      return finalLogs
    } catch (error) {
      console.log('Error while getting final logs:', error)
      return this.batchGetLogs(filter, finalBlock, logs)
    }
  }

  async getDecodedNormalizedLogs(filter) {
    console.log(`Search: ${filter.fromBlock} - ${filter.toBlock}`)
    let rawLogs
    try {
      rawLogs = (await this.provider.getLogs(filter)).filter(log =>
        this.matchesFilter(log, filter)
      )
    } catch (error) {
      console.log('Error while decoding and normalizing logs:', error)
      return this.getDecodedNormalizedLogs(filter)
    }

    const decodedLogs = await Promise.all(
      rawLogs.map(async log => {
        const eventInfo = this.getEventInfoFromLog(log)
        return eventInfo.parse(log.topics, log.data)
      })
    )
    return this.normalizeLogs(rawLogs, decodedLogs)
  }

  // Normalize/consolidate return data
  // Return: { logData, txData, eventName, contractAddress }
  async normalizeLogs(rawLogs, decodedLogs) {
    try {
      return Promise.all(
        rawLogs.map(async (log, index) => {
          let block
          try {
            block = await this.provider.getBlock(log.blockHash)
          } catch (err) {
            console.log('Error while trying to get block:', err.toString())
            if (err.responseText) {
              console.log(err.responseText)
            }
            console.log('Block:', log.blockHash)
            console.log('Log:', rawLogs[index])
            console.log('Index:', index)
            console.log('Trying again')
            block = await this.provider.getBlock(log.blockHash)
          }
          // Decoded log
          const logData = decodedLogs[index]
          // Block and transaction essentials
          const txData = {
            txHash: log.transactionHash,
            logIndex: log.logIndex,
            blockNumber: block.number,
            blockTimestamp: block.timestamp,
          }
          return {
            logData,
            txData,
            contractAddress: log.address,
            eventName: Object.keys(this.eventIFaces).filter(
              ev => this.eventIFaces[ev].topics[0] === log.topics[0]
            )[0],
          }
        })
      )
    } catch (error) {
      console.log('Error while trying to get blocks for logs:', error.toString())
      console.log('Trying again')
      setTimeout(() => {
        return this.normalizeLogs(rawLogs, decodedLogs)
      }, 500)
    }
  }

  createFilter(blockRange, eventNames = [], indexFilterValues = {}) {
    const { fromBlock, toBlock } = blockRange
    const filter = {
      fromBlock,
      toBlock,
      address: this.contractAddress,
    }

    let topics = [this.getEventSignatureTopicsByEventNames(eventNames)]

    if (eventNames.length === 0) {
      topics = [this.getAllEventSignatureTopics()]
    }

    if (Object.keys(indexFilterValues).length > 0) {
      // prettier-ignore
      const eventAbi = find({ 'name': eventNames[0] }, this.contractAbi)
      topics = [...topics, ...this.getTopicsForIndexedArgs(eventAbi, indexFilterValues)]
    }

    return { ...filter, topics }
  }

  getEventInfoFromLog(log) {
    const eventName = find(
      eventName => this.eventIFaces[eventName].topics[0] === log.topics[0],
      Object.keys(this.eventIFaces)
    )
    return this.eventIFaces[eventName]
  }

  getEventSignatureTopicsByEventNames(eventNames) {
    return eventNames.map(eventName => this.eventIFaces[eventName].topics[0])
  }

  getAllEventSignatureTopics() {
    return Object.keys(this.eventIFaces).map(eventName => {
      return this.eventIFaces[eventName].topics[0]
    })
  }

  getTopicsForIndexedArgs(abi, indexFilterValues) {
    const indexedInputs = abi.inputs.filter(input => input.indexed)
    return indexedInputs.map(indexedInput => {
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

  matchesFilter(log, filter) {
    if (
      !isUndefined(log) &&
      !isUndefined(log.address) &&
      !isUndefined(filter.address) &&
      log.address !== filter.address
    ) {
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
      return filterTopic.includes(logTopic)
    }
    if (typeof filterTopic === 'string') {
      return filterTopic === logTopic
    }
    // null topic is a wildcard
    return true
  }
}

module.exports = EthEvents
