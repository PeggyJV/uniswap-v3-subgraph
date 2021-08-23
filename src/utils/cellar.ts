import { Address, BigInt, ethereum, log } from '@graphprotocol/graph-ts'

import { CellarContract, CellarContract__cellarTickInfoResult } from '../types/Cellar/CellarContract'
import { NonfungiblePositionManager } from '../types/NonfungiblePositionManager/NonfungiblePositionManager'
import { Bundle, Pool, Position, PositionSnapshot, Token, List, NFLP, Cellar } from '../types/schema'
import {
  ONE_BI,
  ZERO_BD,
  ZERO_BI,
} from './constants'
import { convertTokenToDecimal } from '../utils'

export function initCellar(contract: CellarContract, cellarAddress: string): Cellar {
  const cellar = new Cellar(cellarAddress)
  cellar.token0 = contract.token0()
  cellar.token1 = contract.token1()

  cellar.totalValueLockedToken0 = ZERO_BD
  cellar.totalValueLockedToken1 = ZERO_BD
  cellar.totalValueLockedUSD = ZERO_BD

  return cellar
}

export function getCellarTickInfo(contract: CellarContract): CellarContract__cellarTickInfoResult[] {
  const result = []

  let i = ZERO_BI
  let tickInfo = {}
  while (tickInfo != null) {
    try {
      tickInfo = contract.cellarTickInfo(i)
    } catch (e) {
      log.info('getCellarTickInfo: NFLP length was {}', [i.minus(ONE_BI).toString()])
      tickInfo = null
    }

    result.push(tickInfo)
    i.plus(ONE_BI)
  }

  return result
}

export function saveNFLPs(cellarContract: CellarContract, cellar: Cellar): NFLP[] {
  const ticks = getCellarTickInfo(cellarContract)
  const count = ticks.length

  const nflps = []
  for (let i = 0; i < count; i++) {
    const tick = ticks[0]
    const nflp = new NFLP(tick.value0.toString())
    nflp.tickUpper = BigInt.fromI32(tick.value1)
    nflp.tickLower = BigInt.fromI32(tick.value2)
    nflp.save()

    nflps.push(nflp)
  }

  return nflps
}

export function upsertNFLPs(cellarContract: CellarContract, cellar: Cellar): NFLP[] {
  const ticks = getCellarTickInfo(cellarContract)
  const count = ticks.length

  const nflps = []
  for (let i = 0; i < count; i++) {
    const tick = ticks[0]
    const tokenId = tick.value0.toString()

    let nflp = NFLP.load(tokenId)
    if (nflp == null) {
      nflp = new NFLP(tick.value0.toString())
      nflp.tickUpper = BigInt.fromI32(tick.value1)
      nflp.tickLower = BigInt.fromI32(tick.value2)
      nflp.save()
    }

    nflps.push(nflp)
  }

  return nflps
}

export function calculateCurrentTvl(
  nflpManager: NonfungiblePositionManager,
  bundle: Bundle,
  cellar: Cellar,
  nflpIds: BigInt[], // list of nflp tokenIds
): Cellar {
  const nflpCount = nflpIds.length

  const token0 = Token.load(cellar.token0.toHexString())
  const token1 = Token.load(cellar.token1.toHexString())

  let tvl0 = ZERO_BD
  let tvl1 = ZERO_BD
  let tvlUSD = ZERO_BD
  for (let i = 0; i < nflpCount; i++) {
    const position = nflpManager.positions(nflpIds[i])

    const amount0 = convertTokenToDecimal(position.value10, token0.decimals)
    const amount1 = convertTokenToDecimal(position.value11, token1.decimals)
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