const test = require('tape')
const EthEvents = require('../')
const { buildContract } = require('../utils')

test('Should get 8 logs between blocks 5545403 - 5546403 from the correct address', async t => {
  try {
    const contract = buildContract('adChain', 'token')
    const ethEvents = EthEvents(contract, 10000)
    const eventNames = ['Transfer', 'Approval']

    const logs = await ethEvents.getLogs(5545403, 5546403, eventNames, {}, true)
    // prettier-ignore
    t.equal(logs.length, 8, 'should have gotten 8 ADT logs between blocks 5545403 - 5546403')

    logs.map(log => {
      t.equal(
        log.contractAddress,
        contract.address,
        'should have gotten logs from the correct contract'
      )
    })

    t.end()
  } catch (error) {
    console.log('Get 8 logs error:', error)
  }
})

test('Should get logs with specified indexed values', async t => {
  try {
    const contract = buildContract('adChain', 'token')
    const ethEvents = EthEvents(contract, 10000)

    const fromBlock = 5545403
    const toBlock = 5646403
    const eventNames = ['Transfer']

    // Note: only applies to the first eventName
    const indexedFilterValues = {
      _to: '0xb4b26709FFed2cd165B9b49eeA1AC38d133d7975',
    }

    // prettier-ignore
    const logs = await ethEvents.getLogs(fromBlock, toBlock, eventNames, indexedFilterValues, true)
    t.notEqual(logs.length, 0, 'should have length')

    logs.map(log => {
      t.equal(
        log.logData._to,
        indexedFilterValues._to,
        'should have gotten logs with the correct _to indexed filter value'
      )
    })

    t.end()
  } catch (error) {
    console.log('Get Transfer logs to PLCRVoting error:', error)
  }
})
