const test = require('tape')
const EthEvents = require('../lib/index.js')
const { buildContract } = require('../src/utils')

test('EthEvents.getLogs - Transfer', async t => {
  try {
    const contract = buildContract('adChain', 'token')
    const ethEvents = new EthEvents(contract, 10000)

    const fromBlock = 6060000
    const toBlock = 6080000
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
