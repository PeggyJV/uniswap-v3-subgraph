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
  ONE_BI,
  ZERO_BD,
  ZERO_BI,
} from './Constants'
import { convertTokenToDecimal } from '../utils'

export function loadCellar(cellarAddress: string): Cellar {
  let cellar = Cellar.load(cellarAddress)
  if (cellar == null) throw new Error('Could not find Cellar:'.concat(cellarAddress))

  return cellar as Cellar
}

export function initCellar(contract: CellarContract, cellarAddress: string): Cellar {
  let cellar = new Cellar(cellarAddress)
  cellar.token0 = contract.token0()
  cellar.token1 = contract.token1()

  cellar.totalValueLockedToken0 = ZERO_BD
  cellar.totalValueLockedToken1 = ZERO_BD
  cellar.totalValueLockedUSD = ZERO_BD

  return cellar
}

export function getCellarTickInfo(contract: CellarContract): CellarContract__cellarTickInfoResult[] {
  let result = new Array<CellarContract__cellarTickInfoResult>(0)

  let i = ZERO_BI
  let reverted = false
  while (reverted === false) {
    let tickResult = contract.try_cellarTickInfo(i)
    if (tickResult.reverted) {
      reverted = true
    } else {
      result.push(tickResult.value)
      i.plus(ONE_BI)
    }
  }

  return result
}

export function saveNFLPs(cellarContract: CellarContract, cellar: Cellar): NFLP[] {
  let ticks = getCellarTickInfo(cellarContract)
  let count = ticks.length

  let nflps = new Array<NFLP>(count)
  for (let i = 0; i < count; i++) {
    let tick = ticks[0]
    let nflp = new NFLP(tick.value0.toString())
    nflp.tickUpper = BigInt.fromI32(tick.value1)
    nflp.tickLower = BigInt.fromI32(tick.value2)
    nflp.save()

    nflps.push(nflp)
  }

  return nflps
}

export function upsertNFLPs(cellarContract: CellarContract, cellar: Cellar): NFLP[] {
  let ticks = getCellarTickInfo(cellarContract)
  let count = ticks.length

  let nflps = new Array<NFLP>(count)
  for (let i = 0; i < count; i++) {
    let tick = ticks[0]
    let tokenId = tick.value0.toString()

    let nflp = NFLP.load(tokenId)
    if (nflp == null) {
      nflp = new NFLP(tick.value0.toString())
      nflp.tickUpper = BigInt.fromI32(tick.value1)
      nflp.tickLower = BigInt.fromI32(tick.value2)
      nflp.save()
    }

    nflps.push(nflp as NFLP)
  }

  return nflps
}

export function calculateCurrentTvl(
  nflpManager: NonfungiblePositionManager,
  bundle: Bundle,
  cellar: Cellar,
  nflpIds: BigInt[], // list of nflp tokenIds
): Cellar {
  let nflpCount = nflpIds.length

  let token0 = Token.load(cellar.token0.toHexString())
  let token1 = Token.load(cellar.token1.toHexString())

  let tvl0 = ZERO_BD
  let tvl1 = ZERO_BD
  let tvlUSD = ZERO_BD
  for (let i = 0; i < nflpCount; i++) {
    let position = nflpManager.positions(nflpIds[i])

    let amount0 = convertTokenToDecimal(position.value10, token0.decimals)
    let amount1 = convertTokenToDecimal(position.value11, token1.decimals)
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