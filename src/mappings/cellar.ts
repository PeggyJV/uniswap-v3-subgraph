import { BigInt, log } from '@graphprotocol/graph-ts'

import {
  CellarContract,
  AddedLiquidity,
  RemovedLiquidity,
  Rebalance,
} from "../types/Cellar/CellarContract"
import { Cellar, CellarInvest, Token } from "../types/schema"
import {
  initCellar,
  loadCellar,
  upsertNFLPs,
} from '../utils/cellar'
import { loadBundle } from '../utils/pricing'
import { convertTokenToDecimal } from '../utils'

let FEE_DEONOMINATOR = BigInt.fromI32(10000)

export function handleAddedLiquidity(event: AddedLiquidity): void {
  log.debug('Invoked handleAddedLiquidity', [])
  let cellarContract = CellarContract.bind(event.address)
  let bundle = loadBundle()

  let cellarAddress = event.address.toHex()
  let cellar = Cellar.load(cellarAddress)
  if (cellar == null) {
    log.debug('Initialize Cellar: ', [cellarAddress])
    cellar = initCellar(cellarContract, cellarAddress)
  }

  // odd that cellar type is Cellar | null here even though we init it above
  upsertNFLPs(cellarContract, cellar as Cellar)

  // TODO: DRY UP
  let token0 = Token.load(cellar.token0)
  let token1 = Token.load(cellar.token1)
  log.debug('token0: {}, token1: {}', [cellar.token0, cellar.token1])

  let amount0 = convertTokenToDecimal(event.params.amount0, token0.decimals)
  let amount1 = convertTokenToDecimal(event.params.amount1, token1.decimals)

  cellar.totalDepositAmount0 = cellar.totalDepositAmount0.plus(amount0)
  cellar.totalDepositAmount1 = cellar.totalDepositAmount1.plus(amount1)

  cellar.totalValueLockedToken0 = cellar.totalValueLockedToken0.plus(amount0)
  cellar.totalValueLockedToken1 = cellar.totalValueLockedToken1.plus(amount1)

  let amount0USD = amount0.times(token0.derivedETH).times(bundle.ethPriceUSD)
  let amount1USD = amount1.times(token1.derivedETH).times(bundle.ethPriceUSD)
  cellar.totalDepositUSD = cellar.totalDepositUSD.plus(amount0USD).plus(amount1USD)
  cellar.totalValueLockedUSD = cellar.totalValueLockedUSD.plus(amount0USD).plus(amount1USD)

  cellar.save()
}

export function handleRemovedLiquidity(event: RemovedLiquidity): void {
  log.debug('Invoked handleRemovedLiquidity', [])
  let bundle = loadBundle()
  let cellar = loadCellar(event.address.toHex())

  let token0 = Token.load(cellar.token0)
  let token1 = Token.load(cellar.token1)

  let amount0 = convertTokenToDecimal(event.params.amount0, token0.decimals)
  let amount1 = convertTokenToDecimal(event.params.amount1, token1.decimals)

  cellar.totalValueLockedToken0 = cellar.totalValueLockedToken0.minus(amount0)
  cellar.totalValueLockedToken1 = cellar.totalValueLockedToken1.minus(amount1)

  let amount0USD = amount0.times(token0.derivedETH).times(bundle.ethPriceUSD)
  let amount1USD = amount1.times(token1.derivedETH).times(bundle.ethPriceUSD)
  cellar.totalValueLockedUSD = cellar.totalValueLockedUSD.minus(amount0USD).minus(amount1USD)

  cellar.save()
}

export function handleRebalance(event: Rebalance): void {
  log.debug('Invoked handleRebalance', [])
  let bundle = loadBundle()
  let cellar = loadCellar(event.address.toHex())

  let token0 = Token.load(cellar.token0)
  let token1 = Token.load(cellar.token1)

  log.debug('Rebalance Event Params - fees0: {}, fees1: {}, amount0: {}, amount1: {}', [
    event.params.fees0.toString(),
    event.params.fees1.toString(),
    event.params.amount0.toString(),
    event.params.amount1.toString(),
  ])

  // Calculate total fees from 'performance fee'
  let totalFees0 = event.params.fees0.times(FEE_DEONOMINATOR).div(cellar.managementFee)
  let totalFees1 = event.params.fees1.times(FEE_DEONOMINATOR).div(cellar.managementFee)

  // Convert all amounts to decimal
  let fees0 = convertTokenToDecimal(totalFees0, token0.decimals)
  let fees1 = convertTokenToDecimal(totalFees1, token1.decimals)
  let reinvestedFees0 = convertTokenToDecimal(totalFees0.minus(event.params.fees0), token0.decimals)
  let reinvestedFees1 = convertTokenToDecimal(totalFees1.minus(event.params.fees1), token1.decimals)
  let amount0 = convertTokenToDecimal(event.params.amount0, token0.decimals)
  let amount1 = convertTokenToDecimal(event.params.amount1, token1.decimals)

  log.debug('fees0: {}, fees1: {}, amount0: {}, amount1: {}', [
    fees0.toString(),
    fees1.toString(),
    amount0.toString(),
    amount1.toString()
  ])

  // accumulate collected Fees
  let fees0USD = fees0.times(token0.derivedETH).times(bundle.ethPriceUSD)
  let fees1USD = fees1.times(token1.derivedETH).times(bundle.ethPriceUSD)
  let feesUSD = fees0USD.plus(fees1USD)
  cellar.feesCollectedUSD = cellar.feesCollectedUSD.plus(feesUSD)
  cellar.feesCollectedToken0 = cellar.feesCollectedToken0.plus(fees0)
  cellar.feesCollectedToken1 = cellar.feesCollectedToken1.plus(fees1)

  // accumulate fees reinvested
  let reinvestedFees0USD = reinvestedFees0.times(token0.derivedETH).times(bundle.ethPriceUSD)
  let reinvestedFees1USD = reinvestedFees1.times(token1.derivedETH).times(bundle.ethPriceUSD)
  cellar.feesReinvestedToken0 = cellar.feesReinvestedToken0.plus(reinvestedFees0)
  cellar.feesReinvestedToken1 = cellar.feesReinvestedToken1.plus(reinvestedFees1)
  cellar.feesReinvestedUSD = cellar.feesReinvestedUSD.plus(reinvestedFees0USD).plus(reinvestedFees1USD)

  // set new TVL
  let amount0USD = amount0.times(token0.derivedETH).times(bundle.ethPriceUSD)
  let amount1USD = amount1.times(token1.derivedETH).times(bundle.ethPriceUSD)
  cellar.totalValueLockedUSD = amount0USD.plus(amount1USD)
  cellar.totalValueLockedToken0 = amount0
  cellar.totalValueLockedToken1 = amount1

  cellar.save()

  // Record a Rebalance entity
  // entity id = cellar contract + block timestamp
  let rebalanceId = cellar.id.concat('-').concat(event.block.timestamp.toString())
  let rebalance = new CellarInvest(rebalanceId)
  rebalance.type = 'rebalance'
  rebalance.cellar = cellar.id
  rebalance.date = event.block.timestamp.toI32()
  rebalance.feesCollected0 = fees0
  rebalance.feesCollected1 = fees1
  rebalance.feesCollectedUSD = feesUSD
  rebalance.feesReinvested0 = reinvestedFees0
  rebalance.feesReinvested1 = reinvestedFees1
  rebalance.feesReinvestedUSD = reinvestedFees0USD.plus(reinvestedFees1USD)
  rebalance.amount0 = amount0
  rebalance.amount1 = amount1
  rebalance.amountUSD = cellar.totalValueLockedUSD
  rebalance.save()
}

export function handleReinvest(event: Rebalance): void {
  log.debug('Invoked handleReinvest', [])
  let bundle = loadBundle()
  let cellar = loadCellar(event.address.toHex())

  let token0 = Token.load(cellar.token0)
  let token1 = Token.load(cellar.token1)

  log.debug('Reinvest Event Params - fees0: {}, fees1: {}, amount0: {}, amount1: {}', [
    event.params.fees0.toString(),
    event.params.fees1.toString(),
    event.params.amount0.toString(),
    event.params.amount1.toString(),
  ])

  // Calculate total fees from 'performance fee'
  let totalFees0 = event.params.fees0.times(FEE_DEONOMINATOR).div(cellar.managementFee)
  let totalFees1 = event.params.fees1.times(FEE_DEONOMINATOR).div(cellar.managementFee)

  // Convert all amounts to decimal
  let fees0 = convertTokenToDecimal(totalFees0, token0.decimals)
  let fees1 = convertTokenToDecimal(totalFees1, token1.decimals)
  let reinvestedFees0 = convertTokenToDecimal(totalFees0.minus(event.params.fees0), token0.decimals)
  let reinvestedFees1 = convertTokenToDecimal(totalFees1.minus(event.params.fees1), token1.decimals)
  let amount0 = convertTokenToDecimal(event.params.amount0, token0.decimals)
  let amount1 = convertTokenToDecimal(event.params.amount1, token1.decimals)

  log.debug('fees0: {}, fees1: {}, amount0: {}, amount1: {}', [
    fees0.toString(),
    fees1.toString(),
    amount0.toString(),
    amount1.toString()
  ])

  // accumulate collected Fees
  let fees0USD = fees0.times(token0.derivedETH).times(bundle.ethPriceUSD)
  let fees1USD = fees1.times(token1.derivedETH).times(bundle.ethPriceUSD)
  let feesUSD = fees0USD.plus(fees1USD)
  cellar.feesCollectedUSD = cellar.feesCollectedUSD.plus(feesUSD)
  cellar.feesCollectedToken0 = cellar.feesCollectedToken0.plus(fees0)
  cellar.feesCollectedToken1 = cellar.feesCollectedToken1.plus(fees1)

  // accumulate fees reinvested
  let reinvestedFees0USD = reinvestedFees0.times(token0.derivedETH).times(bundle.ethPriceUSD)
  let reinvestedFees1USD = reinvestedFees1.times(token1.derivedETH).times(bundle.ethPriceUSD)
  cellar.feesReinvestedToken0 = cellar.feesReinvestedToken0.plus(reinvestedFees0)
  cellar.feesReinvestedToken1 = cellar.feesReinvestedToken1.plus(reinvestedFees1)
  cellar.feesReinvestedUSD = cellar.feesReinvestedUSD.plus(reinvestedFees0USD).plus(reinvestedFees1USD)

  // accumulate TVL
  // the reinvest call collects accumulated fees and reinvests them into the pool
  // therefore we must add amount0 and amount1 to current TVL
  let amount0USD = amount0.times(token0.derivedETH).times(bundle.ethPriceUSD)
  let amount1USD = amount1.times(token1.derivedETH).times(bundle.ethPriceUSD)
  cellar.totalValueLockedUSD = cellar.totalValueLockedUSD.plus(amount0USD).plus(amount1USD)
  cellar.totalValueLockedToken0 = cellar.totalValueLockedToken0.plus(amount0)
  cellar.totalValueLockedToken1 = cellar.totalValueLockedToken1.plus(amount1)

  cellar.save()

  // Record a CellarInvest entity
  // entity id = cellar contract + block timestamp
  let reinvestId = cellar.id.concat('-').concat(event.block.timestamp.toString())
  let reinvest = new CellarInvest(reinvestId)
  reinvest.type = 'reinvest'
  reinvest.cellar = cellar.id
  reinvest.date = event.block.timestamp.toI32()
  reinvest.feesCollected0 = fees0
  reinvest.feesCollected1 = fees1
  reinvest.feesCollectedUSD = feesUSD
  reinvest.feesReinvested0 = reinvestedFees0
  reinvest.feesReinvested1 = reinvestedFees1
  reinvest.feesReinvestedUSD = reinvestedFees0USD.plus(reinvestedFees1USD)
  reinvest.amount0 = amount0
  reinvest.amount1 = amount1
  reinvest.amountUSD = cellar.totalValueLockedUSD
  reinvest.save()
}