'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const ethers = require('ethers');
const utils = require('ethers/utils');
const find = require('lodash/fp/find');
const every = require('lodash/fp/every');
const zipWith = require('lodash/fp/zipWith');
const isArray = require('lodash/fp/isArray');
const isUndefined = require('lodash/fp/isUndefined');
function EthEvents(contractDetails, blockRangeThreshold = 5000) {
    const { abi, address, blockNumber, network } = contractDetails;
    const contractAddress = utils.getAddress(address);
    const provider = new ethers.providers.InfuraProvider(network);
    // Verifies there's a contract that exists at the specified address & network
    provider.getCode(contractAddress).then((code) => {
        if (code === '0x') {
            throw new Error('NO CODE');
        }
    });
    const eventIFaces = new ethers.Contract(contractAddress, abi, provider).interface.events;
    const blockStart = blockNumber || 1;
    // prettier-ignore
    // Validates block range
    function validateBlockNumbers(fromBlock, toBlock, currentBlock) {
        if (fromBlock > currentBlock || fromBlock < 0) {
            throw new Error('Invalid fromBlock. It must be less than the currentBlock || it cannot be negative');
        }
        if (fromBlock > toBlock) {
            throw new Error('Invalid blockRange. fromBlock must be less than toBlock');
        }
        if (toBlock > currentBlock) {
            throw new Error('Invalid toBlock. It must be less than or equal to the currentblock');
        }
    }
    // prettier-ignore
    // Gets logs using a block range
    function getLogs(fromBlock = blockStart, toBlock = 'latest', eventNames = [], indexedFilterValues = {}, batch = true) {
        return __awaiter(this, void 0, void 0, function* () {
            // Get the current block number
            const currentBlock = yield provider.getBlockNumber();
            console.log(`
        Get logs from: ${contractAddress}
        Current block: ${currentBlock}
        `);
            try {
                // Validate block range
                validateBlockNumbers(fromBlock, toBlock, currentBlock);
            }
            catch (error) {
                console.log('Error while validating block numbers:', error.toString());
                console.log(`
        New block range: ${blockStart} - ${currentBlock}
        `);
                fromBlock = blockStart;
                toBlock = 'latest';
            }
            // Reset block to start looking for logs
            provider.resetEventsBlock(fromBlock);
            // Edit toBlock if string is provided
            if (toBlock === 'latest') {
                toBlock = currentBlock;
            }
            // Create a filter with the appropriate block_numbers and topics
            const filter = createFilter({ fromBlock, toBlock }, eventNames, indexedFilterValues);
            // CASE: Too large of a gap -- over the block range threshold!
            if (batch && toBlock - fromBlock > blockRangeThreshold) {
                console.log(`
        Batching logs from ${fromBlock} to ${toBlock}...
        `);
                // Edit the filter for the first batched set of blocks
                const newFilter = Object.assign({}, filter, { toBlock: fromBlock + blockRangeThreshold });
                return batchGetLogs(newFilter, toBlock);
            }
            try {
                console.log(`Getting logs from ${fromBlock} to ${toBlock}...`);
                // CASE: within threshold range. get logs
                return getDecodedNormalizedLogs(filter);
            }
            catch (error) {
                throw new Error('Error while trying to get logs:');
            }
        });
    }
    // If block range is not within the threshold, batch getLogs using the threshold value
    function batchGetLogs(filter, finalBlock, logs = []) {
        return __awaiter(this, void 0, void 0, function* () {
            if (filter.toBlock < finalBlock) {
                try {
                    // toBlock is less than the finalBlock, Get logs with the incoming filter
                    const normalizedLogs = yield getDecodedNormalizedLogs(filter);
                    const accLogs = logs.concat(normalizedLogs);
                    // Set new filter
                    const newFilter = Object.assign({}, filter, { fromBlock: filter.toBlock + 1, toBlock: filter.toBlock + blockRangeThreshold });
                    console.log(`Found ${normalizedLogs.length} logs`);
                    console.log('Subtotal logs:', accLogs.length);
                    console.log('Remaining blocks:', finalBlock - newFilter.fromBlock);
                    console.log();
                    // Recurse: new filter, new accumulation of logs
                    return batchGetLogs(newFilter, finalBlock, accLogs);
                }
                catch (error) {
                    console.log('Error while getting batched logs:', error);
                    return batchGetLogs(filter, finalBlock, logs);
                }
            }
            // ----------------------------------------
            // toBlock is > finalBlock
            // Get final logs from the remaining blocks
            // ----------------------------------------
            try {
                const lastFilter = Object.assign({}, filter, { toBlock: finalBlock });
                const lastNormalizedLogs = yield getDecodedNormalizedLogs(lastFilter);
                console.log(`Found ${lastNormalizedLogs.length} logs`);
                // Return final array of decoded normalized logs
                const finalLogs = logs.concat(lastNormalizedLogs);
                console.log(`
        Total logs: ${finalLogs.length}
      `);
                return finalLogs;
            }
            catch (error) {
                console.log('Error while getting final logs:', error);
                return batchGetLogs(filter, finalBlock, logs);
            }
        });
    }
    function getDecodedNormalizedLogs(filter) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Search: ${filter.fromBlock} - ${filter.toBlock}`);
            let rawLogs;
            try {
                rawLogs = (yield provider.getLogs(filter)).filter((log) => matchesFilter(log, filter));
            }
            catch (error) {
                console.log('Error while decoding and normalizing logs:', error);
                return getDecodedNormalizedLogs(filter);
            }
            const decodedLogs = yield Promise.all(rawLogs.map((log) => {
                const eventInfo = getEventInfoFromLog(log);
                return eventInfo.parse(log.topics, log.data);
            }));
            return normalizeLogs(rawLogs, decodedLogs);
        });
    }
    // Normalize/consolidate return data
    // Return: { logData, txData, eventName, contractAddress }
    function normalizeLogs(rawLogs, decodedLogs) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return Promise.all(rawLogs.map((log, index) => __awaiter(this, void 0, void 0, function* () {
                    let block;
                    try {
                        block = yield provider.getBlock(log.blockHash);
                    }
                    catch (err) {
                        console.log('Error while trying to get block:', err.toString());
                        if (err.responseText) {
                            console.log(err.responseText);
                        }
                        console.log('Block:', log.blockHash);
                        console.log('Log:', rawLogs[index]);
                        console.log('Index:', index);
                        console.log('Trying again');
                        block = yield provider.getBlock(log.blockHash);
                    }
                    // Decoded log
                    const logData = decodedLogs[index];
                    // Block and transaction essentials
                    const txData = {
                        txHash: log.transactionHash,
                        logIndex: log.logIndex,
                        blockNumber: block.number,
                        blockTimestamp: block.timestamp,
                    };
                    return {
                        logData,
                        txData,
                        contractAddress: log.address,
                        eventName: Object.keys(eventIFaces).filter(ev => eventIFaces[ev].topics[0] === log.topics[0])[0],
                    };
                })));
            }
            catch (error) {
                console.log('Error while trying to get blocks for logs:', error.toString());
                console.log('Trying again');
                setTimeout(() => {
                    return normalizeLogs(rawLogs, decodedLogs);
                }, 500);
            }
        });
    }
    function createFilter(blockRange, eventNames = [], indexFilterValues = {}) {
        const { fromBlock, toBlock } = blockRange;
        const filter = {
            fromBlock,
            toBlock,
            address: contractAddress,
        };
        let topics = [getEventSignatureTopicsByEventNames(eventNames)];
        if (eventNames.length === 0) {
            topics = [getAllEventSignatureTopics()];
        }
        if (Object.keys(indexFilterValues).length > 0) {
            // prettier-ignore
            const eventAbi = find({ 'name': eventNames[0] }, abi);
            topics = [...topics, ...getTopicsForIndexedArgs(eventAbi, indexFilterValues)];
        }
        return Object.assign({}, filter, { topics });
    }
    function getEventInfoFromLog(log) {
        const eventName = find((eventName) => eventIFaces[eventName].topics[0] === log.topics[0], Object.keys(eventIFaces));
        return eventIFaces[eventName];
    }
    function getEventSignatureTopicsByEventNames(eventNames) {
        return eventNames.map(eventName => eventIFaces[eventName].topics[0]);
    }
    function getAllEventSignatureTopics() {
        return Object.keys(eventIFaces).map(eventName => {
            return eventIFaces[eventName].topics[0];
        });
    }
    function getTopicsForIndexedArgs(abi, indexFilterValues) {
        const indexedInputs = abi.inputs.filter((input) => input.indexed);
        return indexedInputs.map((indexedInput) => {
            const { name } = indexedInput;
            if (isUndefined(indexFilterValues[name])) {
                return null;
            }
            const value = indexFilterValues[name];
            const arrayish = utils.arrayify(value);
            // Zeros prepended to 32 bytes
            const padded = utils.padZeros(arrayish, 32);
            const topic = utils.hexlify(padded);
            return topic;
        });
    }
    function matchesFilter(log, filter) {
        if (!isUndefined(log) &&
            !isUndefined(log.address) &&
            !isUndefined(filter.address) &&
            log.address !== filter.address) {
            return false;
        }
        if (!isUndefined(filter.topics)) {
            return matchesTopics(log.topics, filter.topics);
        }
        return true;
    }
    function matchesTopics(logTopics, filterTopics) {
        const matchTopic = zipWith(matchesTopic, logTopics, filterTopics);
        const matchesTopics = every(matchTopic);
        return matchesTopics;
    }
    function matchesTopic(logTopic, filterTopic) {
        if (isArray(filterTopic)) {
            return filterTopic.includes(logTopic);
        }
        if (typeof filterTopic === 'string') {
            return filterTopic === logTopic;
        }
        // null topic is a wildcard
        return true;
    }
    return Object.freeze({
        getLogs,
    });
}
module.exports = EthEvents;
//# sourceMappingURL=index.js.map