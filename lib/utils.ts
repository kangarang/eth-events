'use strict'

const ethUtils = require('ethers/utils')

const Token = require('../abis/EIP20.json')
const Registry = require('../abis/Registry.json')
const PLCRVoting = require('../abis/PLCRVoting.json')

const contracts: any = {
  abis: {
    token: Token.abi,
    voting: PLCRVoting.abi,
    registry: Registry.abi,
  },
  addresses: {
    adChain: {
      token: '0xD0D6D6C5Fe4a677D343cC433536BB717bAe167dD',
      voting: '0xb4b26709FFed2cd165B9b49eeA1AC38d133d7975',
      registry: '0x5E2Eb68A31229B469e34999C467b017222677183',
      network: 'mainnet',
    },
    ethaireum: {
      token: '0x73064ef6b8aa6d7a61da0eb45e53117718a3e891',
      voting: '0x946184cdE118286d46825b866521d0236800C613',
      registry: '0x39cFBe27e99BAFA761Dac4566b4Af3B4C9cc8fBE',
      parameterizer: '0xd71498b67c157927b39900b51b13621e9b106769',
      network: 'rinkeby',
    },
  },
}

function buildContract(tcr: string = 'adChain', contract: string): any {
  return {
    abi: contracts.abis[contract],
    address: ethUtils.getAddress(contracts.addresses[tcr][contract]),
    network: contracts.addresses[tcr].network,
    blockNumber: contract === 'token' ? 2686413 : 5470665,
  }
}

module.exports = {
  buildContract,
}
