let TRACKED_POOLS: string[] = [
    '0x4e68ccd3e89f51c3074ca5072bbac773960dfa36', // USDT / ETH
    '0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8', // USDC / ETH 0.3 for Bundle ETH price
]

export function isTrackedPool(poolAddress: string): boolean {
    return TRACKED_POOLS.includes(poolAddress);
}