import { keccak256, encodePacked } from 'viem';

const walletAddress = '0xCf248745d4c1e798110D14d5d81c31aaA63f4DD0';
const smartAccountAddress = `0x${keccak256(
    encodePacked(['address', 'string'], [walletAddress, 'CVTC-SMART-ACCOUNT'])
).slice(26)}`;

console.log('Wallet Address:', walletAddress);
console.log('Smart Account Address:', smartAccountAddress);