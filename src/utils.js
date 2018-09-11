const Ethjs = require('ethjs')
const Token = require('./abis/EIP20.json')
const Registry = require('./abis/Registry.json')
const PLCRVoting = require('./abis/PLCRVoting.json')

const baseToConvertedUnit = (value, decimal) => {
  if (decimal === 0) {
    return value
  }
  const integerPart = value.slice(0, -decimal)
  const fractionPart = value.slice(-decimal)
  return fractionPart ? `${integerPart}.${fractionPart.slice(0, 3)}` : `${integerPart}`
}

const fromTokenBase = (value, decimal) => baseToConvertedUnit(value.toString(), decimal)

const contracts = {
  abis: {
    token: Token.abi,
    voting: PLCRVoting.abi,
    registry: Registry.abi,
  },
  addresses: {
    adChain: {
      token: '0xd0d6d6c5fe4a677d343cc433536bb717bae167dd',
      voting: '0xb4b26709ffed2cd165b9b49eea1ac38d133d7975',
      registry: '0x5e2eb68a31229b469e34999c467b017222677183',
      network: 'mainnet',
    },
    ethaireum: {
      token: '0x73064ef6b8aa6d7a61da0eb45e53117718a3e891',
      network: 'rinkeby',
    },
  },
}

function buildContract(tcr = 'adChain', contract) {
  return {
    abi: contracts.abis[contract],
    address: contracts.addresses[tcr][contract],
    network: contracts.addresses[tcr].network,
    blockNumber: 3000000
  }
}

function printTxHashBlockNumbers(logs) {
  logs.forEach(log => {
    console.log(log.txData.txHash.slice(0, 12), log.txData.blockNumber)
  })
}

function printLogsBlockRange(fromBlock, toBlock, currentBlock, logs) {
  console.log('')
  console.log('=======================================')
  console.log(`logs searched between ${fromBlock} - ${toBlock}`)
  console.log('currentBlock:', currentBlock)
  console.log(
    `logs found between: ${logs[0].txData.blockNumber} - ${
      logs[logs.length - 1].txData.blockNumber
    }`
  )
  console.log('=======================================')
  console.log('')
}

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

function diffBalances(logs) {
  let addressBalances = {}

  logs.forEach(({ logData }) => {
    if (
      addressBalances.hasOwnProperty(logData._to) &&
      addressBalances.hasOwnProperty(logData._from)
    ) {
      addressBalances[logData._to] = new Ethjs.BN(addressBalances[logData._to])
        .add(logData._value)
        .toString()
      addressBalances[logData._from] = new Ethjs.BN(addressBalances[logData._from])
        .sub(logData._value)
        .toString()
    } else if (
      !addressBalances.hasOwnProperty(logData._to) &&
      addressBalances.hasOwnProperty(logData._from)
    ) {
      addressBalances[logData._to] = logData._value.toString()
      addressBalances[logData._from] = new Ethjs.BN(addressBalances[logData._from])
        .sub(logData._value)
        .toString()
    } else {
      addressBalances[logData._to] = logData._value.toString()
      addressBalances[logData._from] = logData._value.toString()
    }
  })

  return addressBalances
}

function printCommitVote(logData, txData) {
  console.log('pollID:', logData.pollID.toString())
  console.log('numTokens:', logData.numTokens.toString())
  console.log('voter:', logData.voter)
  console.log('txHash:', txData.txHash)
  console.log('blockNumber:', txData.blockNumber)
  console.log('blockTimestamp:', txData.blockTimestamp)
  console.log('')
}

function printClaimReward(logData) {
  console.log('pollID:', logData.challengeID.toString())
  console.log('voter:', logData.voter)
  console.log('reward:', fromTokenBase(logData.reward, '9'))
  console.log('reward:', logData.reward.toString())
  console.log('')
}

function loadState() {
  try {
    const serializedState = localStorage.getItem('state')
    if (serializedState === null) {
      return undefined
    }
    return JSON.parse(serializedState)
  } catch (err) {
    return undefined
  }
}

function saveState(state) {
  try {
    const serializedState = JSON.stringify(state)
    localStorage.setItem('state', serializedState)
  } catch (err) {
    // Ignore write errors.
  }
}

module.exports = {
  printTxHashBlockNumbers,
  printTransfers,
  buildContract,
  diffBalances,
  printLogsBlockRange,
  printCommitVote,
  printClaimReward,
  loadState,
  saveState,
}
