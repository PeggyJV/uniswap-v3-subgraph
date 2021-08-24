import {
  BigInt,
  log,
} from '@graphprotocol/graph-ts'

import {
  CellarContract,
  CellarContract__cellarTickInfoResult,
} from '../types/Cellar/CellarContract'
import { NonfungiblePositionManager } from '../types/NonfungiblePositionManager/NonfungiblePositionManager'
import {
  Bundle,
  Token,
  NFLP,
  Cellar,
} from '../types/schema'
import {
  ONE_BD,
  ONE_BI,
  ZERO_BD,
  ZERO_BI,
} from './constants'
import { convertTokenToDecimal } from '../utils'

export function loadCellar(cellarAddress: string): Cellar {
  log.info('ERT: invoked loadCellar', [])
  let cellar = Cellar.load(cellarAddress)
  if (cellar == null) throw new Error('Could not find Cellar:'.concat(cellarAddress))

  return cellar as Cellar
}

export function initCellar(contract: CellarContract, cellarAddress: string): Cellar {
  log.info('ERT: invoked initCellar', [])
  let cellar = new Cellar(cellarAddress)
  cellar.token0 = contract.token0()
  cellar.token1 = contract.token1()

  cellar.totalValueLockedToken0 = ZERO_BD
  cellar.totalValueLockedToken1 = ZERO_BD
  cellar.totalValueLockedUSD = ZERO_BD

  return cellar
}
export function getCellarTickInfo(contract: CellarContract): CellarContract__cellarTickInfoResult[] {
  log.info('ERT: invoked getCellarTickInfo', [])
  let result = new Array<CellarContract__cellarTickInfoResult>()

  let i = ZERO_BI
  let isOutOfBounds = false
  while (isOutOfBounds == false) {
    let tickResult = contract.try_cellarTickInfo(i)

    if (tickResult.reverted) {
      log.info('ERT: getCellarTickInfo reverted', [])
      isOutOfBounds = true
    } else {
      log.info('ERT: the tickResult.value {}', [tickResult.value.value0.toString()])
      result.push(tickResult.value)
      i = i.plus(ONE_BI)
    }
  }

  return result
}

export function saveNFLPs(cellarContract: CellarContract, cellar: Cellar): NFLP[] {
  log.info('ERT: invoked saveNFLPs', [])
  let ticks = getCellarTickInfo(cellarContract)
  let count = ticks.length

  let nflps = new Array<NFLP>(count)
  for (let i = 0; i < count; i++) {
    let tick = ticks[0]
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
  log.info('ERT: invoked upsertNFLPs', [])
  let ticks = getCellarTickInfo(cellarContract)
  let count = ticks.length

  let nflps = new Array<NFLP>()
  for (let i = 0; i < count; i++) {
    let tick = ticks[0]
    let tokenId = tick.value0.toString()

    let nflp = NFLP.load(tokenId)
    if (nflp == null) {
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

function init0 (): Token {
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

function init1 (): Token {
  let t = new Token('0xdac17f958d2ee523a2206206994597c13d831ec7');

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
  t.derivedETH = ONE_BD
  t.whitelistPools = []

  t.save()
  return t
}

export function calculateCurrentTvl(
  nflpManager: NonfungiblePositionManager,
  bundle: Bundle,
  cellar: Cellar,
  nflpIds: BigInt[], // list of nflp tokenIds
): Cellar | null {
  log.info('ERT: invoked calculateCurrentTvl', [])
  let nflpCount = nflpIds.length

  let token0 = Token.load(cellar.token0.toHexString())
  let token1 = Token.load(cellar.token1.toHexString())

  if (token0 == null) {
    init0()
  }

  if (token1 == null) {
    init1()
  }

  let tvl0 = ZERO_BD
  let tvl1 = ZERO_BD
  let tvlUSD = ZERO_BD
  for (let i = 0; i < nflpCount; i++) {
    let position = nflpManager.try_positions(nflpIds[i])
    if (position.reverted) {
      log.error('Could not fetch positions from NFLP Manager', [])
      return null
    }

    let pos = position.value
    let amount0 = convertTokenToDecimal(pos.value10, token0.decimals)
    let amount1 = convertTokenToDecimal(pos.value11, token1.decimals)
    tvl0 = tvl0.plus(amount0)
    tvl1 = tvl1.plus(amount1)

    tvlUSD = amount0.times(token0.derivedETH.times(bundle.ethPriceUSD)).plus(
      amount1.times(token0.derivedETH.times(bundle.ethPriceUSD))
    )
  }

  cellar.totalValueLockedToken0 = tvl0
  cellar.totalValueLockedToken1 = tvl1
  cellar.totalValueLockedUSD = tvlUSD

  return cellar
}