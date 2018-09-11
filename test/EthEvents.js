const test = require('tape')
const EthEvents = require('../lib/index.js')
const {
  buildContract,
  printLogsBlockRange,
  printTxHashBlockNumbers,
} = require('../src/utils')

test('EthEvents.getLogs - Transfer', async t => {
  try {
    const contract = buildContract('adChain', 'token')
    const ethEvents = new EthEvents(contract, 5000)

    const fromBlock = 6270678
    const toBlock = 'latest'
    const eventNames = ['Transfer']
    const indexedFilterValues = {
      _to: '0xb4b26709ffed2cd165b9b49eea1ac38d133d7975',
    }

    // prettier-ignore
    const logs = await ethEvents.getLogs(fromBlock, toBlock, eventNames, indexedFilterValues, true)
    console.log(logs.length)

    t.notEqual(logs.length, 0, 'should have length')
    t.end()
  } catch (error) {
    console.log('ddd error:', error)
  }
})

test('EthEvents.getLogs - Approval', async t => {
  const contract = buildContract('adChain', 'token')
  const ethEvents = new EthEvents(contract, 5000)

  const fromBlock = 6150000
  const toBlock = 'latest'
  const eventNames = ['Approval']

  const logs = await ethEvents.getLogs(fromBlock, toBlock, eventNames, {}, true)

  t.notEqual(logs.length, 0, 'should have length')
  t.end()
})

test('EthEvents.getLogs - Transfer to 0xb4b26709f...', async t => {
  const contract = buildContract('adChain', 'token')
  const ethEvents = new EthEvents(contract, 5000)

  const fromBlock = 6150000
  const toBlock = 'latest'
  const eventNames = ['Transfer']
  const indexedFilterValues = {
    _to: '0xb4b26709ffed2cd165b9b49eea1ac38d133d7975',
  }

  const logs = await ethEvents.getLogs(fromBlock, toBlock, eventNames, indexedFilterValues)

  t.notEqual(logs.length, 0, 'should have length')
  t.end()
})
