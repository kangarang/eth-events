declare const ethers: any;
declare const utils: any;
declare const find: any;
declare const every: any;
declare const zipWith: any;
declare const isArray: any;
declare const isUndefined: any;
interface ContractDetails {
    abi: any[];
    address: string;
    blockNumber: number;
    network: string;
}
interface EventParser {
    (topics: any, data: any): any;
}
interface EventInfo {
    name: string;
    topics: string[];
    parse: EventParser;
}
interface EthersEventInterfaces {
    [eventName: string]: EventInfo;
}
interface EthersContractInterface {
    events: EthersEventInterfaces;
    abi: any[];
}
interface GetLogsFilter {
    address: string;
    fromBlock: number;
    toBlock: number;
    topics: any[];
}
interface TxData {
    txHash: string;
    logIndex: number;
    blockNumber: number;
    blockTimestamp: number;
}
declare function EthEvents(contractDetails: any, blockRangeThreshold?: number): Readonly<{
    getLogs: (fromBlock?: any, toBlock?: any, eventNames?: string[], indexedFilterValues?: any, batch?: boolean) => Promise<any>;
}>;
