import {
  CellarContract,
  AddedLiquidity,
  RemovedLiquidity,
} from "../types/Cellar/CellarContract"
import { Bundle, Cellar, Token } from "../types/schema"
import { convertTokenToDecimal } from "../utils"
import { ZERO_BD } from "../utils/constants"

export function handleAddedLiquidity(event: AddedLiquidity): void {
  let bundle = Bundle.load('1')

  let cellarAddress = event.address.toHex()
  let cellar = Cellar.load(cellarAddress)

  if (cellar == null) {
    cellar = new Cellar(cellarAddress)
    cellar.token0 = event.params.token0
    cellar.token1 = event.params.token1

    cellar.totalValueLockedToken0 = ZERO_BD
    cellar.totalValueLockedToken1 = ZERO_BD
    cellar.totalValueLockedUSD = ZERO_BD
  }

  let token0 = Token.load(event.params.token0.toHexString())
  let token1 = Token.load(event.params.token1.toHexString())

  let amount0 = convertTokenToDecimal(event.params.amount0, token0.decimals)
  let amount1 = convertTokenToDecimal(event.params.amount1, token1.decimals)

  // Sum up total token counts
  cellar.totalValueLockedToken0 = cellar.totalValueLockedToken0.plus(amount0)
  cellar.totalValueLockedToken1 = cellar.totalValueLockedToken1.plus(amount1)

  // Calculcate TVL in USD
  let token0USD = cellar.totalValueLockedToken0.times(token0.derivedETH.times(bundle.ethPriceUSD))
  let token1USD = cellar.totalValueLockedToken1.times(token1.derivedETH.times(bundle.ethPriceUSD))
  cellar.totalValueLockedUSD = token0USD.plus(token1USD)

  cellar.save()

  // Note: If a handler doesn't require existing field values, it is faster
  // _not_ to load the entity from the store. Instead, create it fresh with
  // `new Entity(...)`, set the fields that should be updated and save the
  // entity back to the store. Fields that were not set or unset remain
  // unchanged, allowing for partial updates to be applied.

  // It is also possible to access smart contracts from mappings. For
  // example, the contract that has emitted the event can be connected to
  // with:
  //
  // let contract = Contract.bind(event.address)
  //
  // The following functions can then be called on this contract to access
  // state variables and other data:
  //
  // - contract.allowance(...)
  // - contract.approve(...)
  // - contract.balanceOf(...)
  // - contract.cellarTickInfo(...)
  // - contract.decimals(...)
  // - contract.fee(...)
  // - contract.feeLevel(...)
  // - contract.lastLockedBlock(...)
  // - contract.name(...)
  // - contract.owner(...)
  // - contract.symbol(...)
  // - contract.token0(...)
  // - contract.token1(...)
  // - contract.totalSupply(...)
  // - contract.transfer(...)
  // - contract.transferFrom(...)
  // - contract.validator(...)
}

export function handleRemovedLiquidity(event: RemovedLiquidity): void {
  let bundle = Bundle.load('1')

  let cellarAddress = event.address.toHex()
  let cellar = Cellar.load(cellarAddress)

  let token0 = Token.load(event.params.token0.toHexString())
  let token1 = Token.load(event.params.token1.toHexString())

  let amount0 = convertTokenToDecimal(event.params.amount0, token0.decimals)
  let amount1 = convertTokenToDecimal(event.params.amount1, token1.decimals)

  // Sum up total token counts
  cellar.totalValueLockedToken0 = cellar.totalValueLockedToken0.minus(amount0)
  cellar.totalValueLockedToken1 = cellar.totalValueLockedToken1.minus(amount1)

  // Remove token from TVL
  let token0USD = cellar.totalValueLockedToken0.times(token0.derivedETH.times(bundle.ethPriceUSD))
  let token1USD = cellar.totalValueLockedToken1.times(token1.derivedETH.times(bundle.ethPriceUSD))
  cellar.totalValueLockedUSD = token0USD.plus(token1USD)

  cellar.save()
}