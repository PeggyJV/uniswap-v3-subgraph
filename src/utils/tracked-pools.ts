let TRACKED_POOLS: string[] = [
    '0x4e68ccd3e89f51c3074ca5072bbac773960dfa36'
]

export function isTrackedPool(poolAddress: string): boolean {
    return TRACKED_POOLS.includes(poolAddress);
}