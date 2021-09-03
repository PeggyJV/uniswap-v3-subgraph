import {
  BigDecimal,
  BigInt,
  log,
} from '@graphprotocol/graph-ts'

import {
  CellarContract,
  CellarContract__cellarTickInfoResult,
} from '../types/Cellar/CellarContract'
import {
  Cellar,
  NFLP,
  Pool,
  Token,
} from '../types/schema'
import {
  ONE_BD,
  ONE_BI,
  ZERO_BD,
  ZERO_BI,
} from './constants'

export function loadCellar(cellarAddress: string): Cellar {
  log.debug('Invoked loadCellar, address: {}', [cellarAddress])
  let cellar = Cellar.load(cellarAddress)
  if (cellar == null) {
    throw new Error('Could not find Cellar:'.concat(cellarAddress))
  }

  return cellar as Cellar
}

export function initCellar(contract: CellarContract, cellarAddress: string): Cellar {
  log.debug('Invoked initCellar', [])
  let cellar = new Cellar(cellarAddress)
  cellar.token0 = contract.token0().toHexString()
  cellar.token1 = contract.token1().toHexString()

  // TODO: derive this from token and fee
  // PORT: https://github.com/Uniswap/uniswap-v3-sdk/blob/main/src/utils/computePoolAddress.ts
  cellar.pool = '0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8' // USDC-ETH 0.3%
  cellar.feeTier = BigInt.fromI32(contract.feeLevel())
  cellar.managementFee = BigInt.fromI32(contract.fee())

  cellar.totalDepositAmount0 = ZERO_BD
  cellar.totalDepositAmount1 = ZERO_BD
  cellar.totalDepositUSD = ZERO_BD
  cellar.totalValueLockedToken0 = ZERO_BD
  cellar.totalValueLockedToken1 = ZERO_BD
  cellar.totalValueLockedUSD = ZERO_BD
  cellar.feesCollectedToken0 = ZERO_BD
  cellar.feesCollectedToken1 = ZERO_BD
  cellar.feesCollectedUSD = ZERO_BD
  cellar.feesReinvestedToken0 = ZERO_BD
  cellar.feesReinvestedToken1 = ZERO_BD
  cellar.feesReinvestedUSD = ZERO_BD

  return cellar
}
export function getCellarTickInfo(contract: CellarContract): CellarContract__cellarTickInfoResult[] {
  log.debug('Invoked getCellarTickInfo', [])
  let result = new Array<CellarContract__cellarTickInfoResult>()

  // TODO: update contract with fn that returns the full array
  let i = ZERO_BI
  let isOutOfBounds = false
  while (isOutOfBounds == false) {
    let tickResult = contract.try_cellarTickInfo(i)

    if (tickResult.reverted) {
      log.debug('getCellarTickInfo reverted', [])
      isOutOfBounds = true
    } else {
      log.debug('the tickResult.value {}', [tickResult.value.value0.toString()])
      result.push(tickResult.value)
      i = i.plus(ONE_BI)
    }
  }

  let len = BigInt.fromI32(result.length).toString()
  log.debug('found {} ticks', [len])
  return result
}

export function saveNFLPs(cellarContract: CellarContract, cellar: Cellar): NFLP[] {
  log.debug('Invoked saveNFLPs', [])
  let ticks = getCellarTickInfo(cellarContract)
  let count = ticks.length

  let nflps = new Array<NFLP>()
  for (let i = 0; i < count; i++) {
    let tick = ticks[i]
    let nflp = new NFLP(tick.value0.toString())
    nflp.tickUpper = BigInt.fromI32(tick.value1)
    nflp.tickLower = BigInt.fromI32(tick.value2)
    nflp.cellar = cellar.id
    nflp.save()

    nflps.push(nflp)
  }

  return nflps
}

export function upsertNFLPs(cellarContract: CellarContract, cellar: Cellar): NFLP[] {
  log.debug('Invoked upsertNFLPs', [])
  let ticks = getCellarTickInfo(cellarContract)
  let count = ticks.length

  let nflps = new Array<NFLP>()
  for (let i = 0; i < count; i++) {
    let tick = ticks[i]
    let tokenId = tick.value0.toString()

    let nflp = NFLP.load(tokenId)
    if (nflp == null) {
      log.debug('Initializing NFLP {}', [tokenId])
      nflp = new NFLP(tick.value0.toString())
      nflp.tickUpper = BigInt.fromI32(tick.value1)
      nflp.tickLower = BigInt.fromI32(tick.value2)
      nflp.cellar = cellar.id
      nflp.save()
    }

    nflps.push(nflp as NFLP)
  }

  return nflps
}

// These init fns are used for initializing entities during local dev
// to avoid unnecessary grafts and to keep a tight feedback loop
export function initPool(cellar: Cellar): Pool {
  log.debug('Initializing pool', [])
  let p = new Pool(cellar.pool)

  p.createdAtTimestamp = BigInt.fromString('1629792611096')
  p.createdAtBlockNumber = BigInt.fromString('1629792611096')
  p.token0 = cellar.token0
  p.token1 = cellar.token1
  p.feeTier = cellar.feeTier
  p.liquidity = ZERO_BI
  p.sqrtPrice = BigInt.fromString('1369233786243271037337267759247908')
  p.feeGrowthGlobal0X128 = ZERO_BI
  p.feeGrowthGlobal1X128 = ZERO_BI
  p.token0Price = ZERO_BD
  p.token1Price = ZERO_BD
  p.tick = ZERO_BI
  p.observationIndex = ZERO_BI
  p.volumeToken0 = ZERO_BD
  p.volumeToken1 = ZERO_BD
  p.volumeUSD = ZERO_BD
  p.untrackedVolumeUSD = ZERO_BD
  p.feesUSD = ZERO_BD
  p.txCount = ZERO_BI!
  p.collectedFeesToken0 = ZERO_BD
  p.collectedFeesToken1 = ZERO_BD
  p.collectedFeesUSD = ZERO_BD
  p.totalValueLockedToken0 = ZERO_BD
  p.totalValueLockedToken1 = ZERO_BD
  p.totalValueLockedETH = ZERO_BD
  p.totalValueLockedUSD = ZERO_BD
  p.totalValueLockedUSDUntracked = ZERO_BD
  p.liquidityProviderCount = ZERO_BI

  p.save()
  return p
}

export function initWETH (): Token {
  let t = new Token('0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2');

  t.symbol = 'WETH'
  t.name = 'Wrapped Ether'
  t.decimals = BigInt.fromI32(18)
  t.totalSupply = BigInt.fromI32(19376)
  t.volume = ZERO_BD
  t.volumeUSD = ZERO_BD
  t.untrackedVolumeUSD = ZERO_BD
  t.feesUSD = ZERO_BD
  t.txCount = ZERO_BI
  t.poolCount = ZERO_BI
  t.totalValueLocked = ZERO_BD
  t.totalValueLockedUSD = ZERO_BD
  t.totalValueLockedUSDUntracked = ZERO_BD
  t.derivedETH = ONE_BD
  t.whitelistPools = []

  t.save()
  return t
}

export function initUSDT (): Token {
  let t = new Token('0xdac17f958d2ee523a2206206994597c13d831ec7')

  t.symbol = 'USDT'
  t.name = 'Tether USD'
  t.decimals = BigInt.fromI32(6)
  t.totalSupply = BigInt.fromI32(17768)
  t.volume = ZERO_BD
  t.volumeUSD = ZERO_BD
  t.untrackedVolumeUSD = ZERO_BD
  t.feesUSD = ZERO_BD
  t.txCount = ZERO_BI
  t.poolCount = ZERO_BI
  t.totalValueLocked = ZERO_BD
  t.totalValueLockedUSD = ZERO_BD
  t.totalValueLockedUSDUntracked = ZERO_BD
  t.derivedETH = BigDecimal.fromString('0.0003023957971778731707111332969285618')
  t.whitelistPools = []

  t.save()
  return t
}

export function initUSDC (): Token {
  let t = new Token('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48')

  t.symbol = 'USDC'
  t.name = 'USD Coin'
  t.decimals = BigInt.fromI32(6)
  t.totalSupply = BigInt.fromI32(18840)
  t.volume = ZERO_BD
  t.volumeUSD = ZERO_BD
  t.untrackedVolumeUSD = ZERO_BD
  t.feesUSD = ZERO_BD
  t.txCount = ZERO_BI
  t.poolCount = ZERO_BI
  t.totalValueLocked = ZERO_BD
  t.totalValueLockedUSD = ZERO_BD
  t.totalValueLockedUSDUntracked = ZERO_BD
  t.derivedETH = BigDecimal.fromString('0.0002805880864452721369994738141981872')
  t.whitelistPools = []

  t.save()
  return t
}