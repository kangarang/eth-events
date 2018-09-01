const Ethjs = require('ethjs')
const test = require('tape')
const EthEvents = require('../lib/index.js')
const { printTransfers, buildContract } = require('../src/utils')

test('EthEvents.getLogs - Transfer', async t => {
  try {
    const ethjs = new Ethjs(new Ethjs.HttpProvider('https://mainnet.infura.io'))
    const contract = buildContract('adChain', 'token')
    const ethEvents = new EthEvents(ethjs, contract)

    const eventNames = ['Transfer']
    const indexedFilterValues = {
      _to: '0xb4b26709ffed2cd165b9b49eea1ac38d133d7975',
    }

    // prettier-ignore
    const logs = await ethEvents.getLogs(5200028, 6225000, eventNames, indexedFilterValues, true)
    printTransfers(logs)

    if (logs.length) {
      console.log('first block number:', logs[0].txData.blockNumber)
      // console.log('last log:', logs[logs.length - 1])
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

  const eventNames = ['Approval']

  const logs = await ethEvents.getLogs(6005000, 'latest', eventNames, {}, true)

  t.notEqual(logs.length, 0, 'should have length')
  t.end()
})

test('EthEvents.getLogs - Transfer to 0xb4b26709f...', async t => {
  const ethjs = new Ethjs(new Ethjs.HttpProvider('https://mainnet.infura.io'))
  const contract = buildContract('adChain', 'token')
  const ethEvents = new EthEvents(ethjs, contract)

  const eventNames = ['Transfer']
  const indexedFilterValues = {
    _to: '0xb4b26709ffed2cd165b9b49eea1ac38d133d7975',
  }

  const logs = await ethEvents.getLogs(0, 'latest', eventNames, indexedFilterValues, true)

  printTransfers(logs)

  t.notEqual(logs.length, 0, 'should have length')
  t.end()
})
