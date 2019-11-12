import { ethers } from 'ethers';
export interface IEthEvent {
    name?: string;
    values?: any;
    sender?: string;
    recipient?: string;
    txHash?: string;
    logIndex?: number;
    timestamp?: number;
    blockNumber?: number;
    toContract?: string;
}
export interface IContractDetails {
    abi: any[];
    address: string;
    name?: string;
}
export interface DecodedLog {
    name: string;
    values: any;
    blockNumber?: number;
    txHash?: string;
    logIndex?: number;
}
export declare function EthEvents(contractObjects: IContractDetails[], jsonRpcEndpoint: string, startBlock?: number, extraneousEventNames?: string[]): Readonly<{
    getEvents: (startBlock?: number, endBlock?: number | undefined) => any;
    getEventsByFilter: (filter: ethers.providers.Filter, counter?: number) => any;
}>;
