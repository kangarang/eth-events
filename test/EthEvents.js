const test = require('tape')
const Ethjs = require('ethjs')
const EthEvents = require('../')
const Token = require('./EIP20.json')

const provider = new Ethjs.HttpProvider(`https://mainnet.infura.io`)
const ethjs = new Ethjs(provider)

const contract = {
  abi: Token.abi,
  address: '0xd0d6d6c5fe4a677d343cc433536bb717bae167dd',
}

const logger = new EthEvents(ethjs, contract)

test('EthEvents.getLogs - Approval', async t => {
  const eventNames = ['Approval']

  const logs = await logger.getLogs(6005000, 'latest', eventNames, {})

  t.notEqual(logs.length, 0, 'should have length')
  t.end()
})

test('EthEvents.getLogs - Transfer', async t => {
  const eventNames = ['Transfer']
  const indexedFilterValues = {
    _to: '0xb4b26709ffed2cd165b9b49eea1ac38d133d7975',
  }

  const logs = await logger.getLogs(6000000, 'latest', eventNames, indexedFilterValues)

  t.notEqual(logs.length, 0, 'should have length')
  t.end()
})
