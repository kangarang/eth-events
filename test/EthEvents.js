const Ethjs = require('ethjs')
const test = require('tape')
const EthEvents = require('../lib/index.js')
const Token = require('./EIP20.json')

const contract = {
  abi: Token.abi,
  address: '0xd0d6d6c5fe4a677d343cc433536bb717bae167dd', // ADT
}
const ethjs = new Ethjs(new Ethjs.HttpProvider('https://mainnet.infura.io'))
const ethEvents = new EthEvents(ethjs, contract)

// eth-events
test('EthEvents.getLogs - Transfer', async t => {
  try {
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
  const eventNames = ['Approval']

  const logs = await ethEvents.getLogs(6005000, 'latest', eventNames, {})

  t.notEqual(logs.length, 0, 'should have length')
  t.end()
})

test('EthEvents.getLogs - Transfer to 0xb4b26709f...', async t => {
  const eventNames = ['Transfer']
  const indexedFilterValues = {
    _to: '0xb4b26709ffed2cd165b9b49eea1ac38d133d7975',
  }

  const logs = await ethEvents.getLogs(0, 'latest', eventNames, indexedFilterValues)

  printTransfers(logs)

  t.notEqual(logs.length, 0, 'should have length')
  t.end()
})

function printTransfers(logs) {
  console.log('logs.length:', logs.length)
  logs.forEach(({ logData, txData }) => {
    console.log('from:', logData._from)
    console.log('to:', logData._to)
    console.log('value:', logData._value)
    console.log('txHash:', txData.txHash)
    console.log('blockNumber:', txData.blockNumber)
    console.log('blockTimestamp:', txData.blockTimestamp)
    console.log('')
  })
  console.log('logs.length:', logs.length)
}
