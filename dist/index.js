'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var ethers_1 = require("ethers");
var bluebird_1 = require("bluebird");
var range = require('lodash/range');
var flatten = require('lodash/flatten');
function EthEvents(contractObjects, jsonRpcEndpoint, startBlock, extraneousEventNames) {
    if (startBlock === void 0) { startBlock = 1; }
    if (extraneousEventNames === void 0) { extraneousEventNames = []; }
    var provider = new ethers_1.providers.JsonRpcProvider(jsonRpcEndpoint);
    var contractAddresses = [];
    var initialBlock = startBlock;
    var contracts = contractObjects.map(function (c) {
        var contract = new ethers_1.ethers.Contract(c.address, c.abi, provider);
        // set contract name and address
        if (c.hasOwnProperty('name')) {
            contract.contractName = c.name;
        }
        contractAddresses = contractAddresses.concat(ethers_1.utils.getAddress(c.address));
        return contract;
    });
    /**
     * Gets all events from genesis block (contract) -> current block
     */
    function getEvents(startBlock, endBlock) {
        if (startBlock === void 0) { startBlock = initialBlock; }
        return __awaiter(this, void 0, bluebird_1.Promise, function () {
            var currentBlockNumber, blocksRange, events;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, provider.getBlockNumber()];
                    case 1:
                        currentBlockNumber = _a.sent();
                        // prettier-ignore
                        if (!!endBlock && endBlock > currentBlockNumber) { // specified, out of range
                            console.log('specified endBlock out of range. using currentBlock', currentBlockNumber);
                            endBlock = currentBlockNumber + 1;
                        }
                        else if (startBlock > currentBlockNumber) { // startBlock out of range
                            console.log("specified startBlock (" + startBlock + ") greater than currentBlock " + currentBlockNumber);
                            startBlock = initialBlock;
                            endBlock = currentBlockNumber + 1;
                        }
                        else if (endBlock && endBlock > startBlock) { // specified, in range
                            endBlock = endBlock;
                        }
                        else if (provider.network.chainId === 420) { // devel, (get all blocks)
                            startBlock = 1;
                            endBlock = currentBlockNumber + 1;
                        }
                        else {
                            endBlock = startBlock + 5;
                        }
                        blocksRange = range(startBlock, endBlock);
                        console.log();
                        console.log('current block:', currentBlockNumber);
                        console.log("block range: " + blocksRange[0] + " .. " + blocksRange[blocksRange.length - 1]);
                        console.log();
                        return [4 /*yield*/, bluebird_1.Promise.map(blocksRange, function (blockNumber) { return __awaiter(_this, void 0, void 0, function () {
                                var block, numTxInBlock_1, txReceipts, filtered, logsInBlock, error_1, error_2;
                                var _this = this;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            _a.trys.push([0, 6, , 7]);
                                            return [4 /*yield*/, provider.getBlock(blockNumber, false)];
                                        case 1:
                                            block = _a.sent();
                                            numTxInBlock_1 = block.transactions.length;
                                            console.log(numTxInBlock_1 + " txs in block " + blockNumber);
                                            _a.label = 2;
                                        case 2:
                                            _a.trys.push([2, 4, , 5]);
                                            return [4 /*yield*/, bluebird_1.Promise.map(block.transactions, function (txHash, i) { return __awaiter(_this, void 0, void 0, function () {
                                                    return __generator(this, function (_a) {
                                                        switch (_a.label) {
                                                            case 0: return [4 /*yield*/, bluebird_1.Promise.delay(1000)];
                                                            case 1:
                                                                _a.sent(); // 1 second interval
                                                                console.log("tx " + i + "/" + numTxInBlock_1);
                                                                try {
                                                                    return [2 /*return*/, getTransactionReceipt(provider, txHash)];
                                                                }
                                                                catch (error) {
                                                                    // prettier-ignore
                                                                    console.error('ERROR: tried to get tx receipt 5 times and did not get a response');
                                                                }
                                                                return [2 /*return*/];
                                                        }
                                                    });
                                                }); }, { concurrency: 4 } // 4 max tx queries per interval
                                                )];
                                        case 3:
                                            txReceipts = _a.sent();
                                            filtered = txReceipts.filter(function (receipt) {
                                                return !!receipt.from &&
                                                    !!receipt.to &&
                                                    !!receipt.logs &&
                                                    receipt.logs.length > 0 &&
                                                    (contractAddresses.includes(ethers_1.utils.getAddress(receipt.from)) ||
                                                        contractAddresses.includes(ethers_1.utils.getAddress(receipt.to)));
                                            });
                                            if (filtered.length > 0) {
                                                console.log("found " + filtered.length + " txs in block " + blockNumber);
                                            }
                                            try {
                                                logsInBlock = decodeLogsByTxReceipts(block.timestamp, filtered);
                                                // [[Log, Log]] -> [Log, Log]
                                                // [[]] -> []
                                                return [2 /*return*/, flatten(logsInBlock)];
                                            }
                                            catch (error) {
                                                console.error("ERROR while decoding tx receipts: " + error.message);
                                                throw error;
                                            }
                                            return [3 /*break*/, 5];
                                        case 4:
                                            error_1 = _a.sent();
                                            console.error("ERROR while getting tx receipts: " + error_1.message);
                                            throw error_1;
                                        case 5: return [3 /*break*/, 7];
                                        case 6:
                                            error_2 = _a.sent();
                                            // TODO: retry
                                            console.error("ERROR while getting block " + blockNumber + ": " + error_2.message);
                                            throw error_2;
                                        case 7: return [2 /*return*/];
                                    }
                                });
                            }); }, { concurrency: 1 } // 1 block at a time
                            )];
                    case 2:
                        events = _a.sent();
                        // [[], [], [Log, Log]] -> [Log, Log]
                        return [2 /*return*/, flatten(events)];
                }
            });
        });
    }
    function getTransactionReceipt(provider, txHash, counter) {
        if (counter === void 0) { counter = 1; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                try {
                    return [2 /*return*/, provider.getTransactionReceipt(txHash)];
                }
                catch (error) {
                    console.error('error:', error);
                    console.log('trying again for tx:', txHash);
                    if (counter === 4) {
                        throw error;
                    }
                    else {
                        return [2 /*return*/, getTransactionReceipt(provider, txHash, counter + 1)];
                    }
                }
                return [2 /*return*/];
            });
        });
    }
    /**
     * Gets decoded logs from transaction receipts in a single block
     */
    function decodeLogsByTxReceipts(timestamp, txReceipts) {
        // prettier-ignore
        return txReceipts.map(function (receipt) {
            try {
                var events = contracts.map(function (c) {
                    return decodeLogs(c, timestamp, receipt);
                });
                if (events.length > 0) {
                    console.log("found " + events.length + " logs in block " + receipt.blockNumber);
                }
                return flatten(events);
            }
            catch (error) {
                // prettier-ignore
                var sliced = receipt.transactionHash ? receipt.transactionHash.slice(0, 8) : '[undefined tx hash]';
                console.error("ERROR while decoding tx receipt " + sliced + ": " + error.message);
                throw error;
            }
        });
    }
    /**
     * Decodes raw logs using an ethers.js contract interface
     */
    function decodeLogs(contract, timestamp, receipt) {
        // prettier-ignore
        return receipt.logs
            .map(function (log) {
            var decoded = contract.interface.parseLog(log);
            // return custom, decoded log -OR- null
            if (!!decoded) {
                if (extraneousEventNames.includes(decoded.name)) {
                    return null;
                }
                var name = decoded.name, values = decoded.values;
                var txHash = receipt.transactionHash, blockNumber = receipt.blockNumber, to = receipt.to, from = receipt.from;
                return {
                    name: name,
                    values: values,
                    sender: from,
                    recipient: to,
                    blockNumber: blockNumber,
                    timestamp: timestamp,
                    txHash: txHash,
                    logIndex: log.logIndex,
                    toContract: to && ethers_1.utils.getAddress(to) === contract.address && 'contractName' in contract
                        ? contract.contractName
                        : 'n/a',
                };
            }
            return null;
        })
            .filter(function (l) { return l !== null; });
    }
    return Object.freeze({
        getEvents: getEvents,
    });
}
exports.EthEvents = EthEvents;
//# sourceMappingURL=index.js.map