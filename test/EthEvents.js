const Ethjs = require('ethjs')
const test = require('tape')
const EthEvents = require('../lib/index.js')
const { buildContract, printLogsBlockRange } = require('../src/utils')

test('EthEvents.getLogs - Transfer', async t => {
  try {
    const ethjs = new Ethjs(new Ethjs.HttpProvider('https://mainnet.infura.io'))
    const contract = buildContract('adChain', 'token')
    const ethEvents = new EthEvents(ethjs, contract)
    const currentBlock = (await ethjs.blockNumber()).toNumber()

    const fromBlock = 6023781
    const toBlock = 'latest'
    const eventNames = ['Transfer']
    const indexedFilterValues = {
      _to: '0xb4b26709ffed2cd165b9b49eea1ac38d133d7975',
    }

    // prettier-ignore
    const logs = await ethEvents.getLogs(fromBlock, toBlock, eventNames, indexedFilterValues, true)

    if (logs.length) {
      printLogsBlockRange(fromBlock, toBlock, currentBlock, logs)
    }

    t.notEqual(logs.length, 0, 'should have length')
    t.end()
  } catch (error) {
    console.log('ddd error:', error)
  }
})

test('EthEvents.getLogs - Approval', async t => {
  const ethjs = new Ethjs(new Ethjs.HttpProvider('https://mainnet.infura.io'))
  const contract = buildContract('adChain', 'token')
  const ethEvents = new EthEvents(ethjs, contract)

  const fromBlock = 6150000
  const toBlock = 'latest'
  const eventNames = ['Approval']

  const logs = await ethEvents.getLogs(fromBlock, toBlock, eventNames, {}, true)

  t.notEqual(logs.length, 0, 'should have length')
  t.end()
})

test('EthEvents.getLogs - Transfer to 0xb4b26709f...', async t => {
  const ethjs = new Ethjs(new Ethjs.HttpProvider('https://mainnet.infura.io'))
  const contract = buildContract('adChain', 'token')
  const ethEvents = new EthEvents(ethjs, contract)
  const currentBlock = (await ethjs.blockNumber()).toNumber()

  const fromBlock = 6150000
  const toBlock = 'latest'
  const eventNames = ['Transfer']
  const indexedFilterValues = {
    _to: '0xb4b26709ffed2cd165b9b49eea1ac38d133d7975',
  }

  const logs = await ethEvents.getLogs(fromBlock, toBlock, eventNames, indexedFilterValues)

  if (logs.length) {
    printLogsBlockRange(fromBlock, toBlock, currentBlock, logs)
  }

  t.notEqual(logs.length, 0, 'should have length')
  t.end()
})
