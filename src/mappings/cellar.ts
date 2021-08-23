import { BigInt, log } from '@graphprotocol/graph-ts'

import { NonfungiblePositionManager } from '../types/NonfungiblePositionManager/NonfungiblePositionManager'
import {
  CellarContract,
  AddedLiquidity,
  RemovedLiquidity,
  RebalanceCall,
} from "../types/Cellar/CellarContract"
import { Bundle, Cellar, Token } from "../types/schema"
import { convertTokenToDecimal } from "../utils"
import {
  NONFUNGIBLE_POSITION_MANAGER,
  ZERO_BD
} from "../utils/constants"
import {
  calculateCurrentTvl,
  initCellar,
  saveNFLPs,
  upsertNFLPs,
} from '../utils/cellar'

export function handleAddedLiquidity(event: AddedLiquidity): void {
  const cellarContract = CellarContract.bind(event.address)
  const nflpManager = NonfungiblePositionManager.bind(NONFUNGIBLE_POSITION_MANAGER)
  const bundle = Bundle.load('1')

  const cellarAddress = event.address.toHex()
  let cellar = Cellar.load(cellarAddress)
  if (cellar == null) {
    cellar = initCellar(cellarContract, cellarAddress)
  }

  const nflps = upsertNFLPs(cellarContract, cellar)
  const tokenIds = nflps.map(nflp => BigInt.fromString(nflp.id))
  calculateCurrentTvl(nflpManager, bundle, cellar, tokenIds)

  cellar.save()
}

export function handleRemovedLiquidity(event: RemovedLiquidity): void {
  const cellarContract = CellarContract.bind(event.address)
  const nflpManager = NonfungiblePositionManager.bind(NONFUNGIBLE_POSITION_MANAGER)
  let bundle = Bundle.load('1')

  const cellar = Cellar.load(event.address.toHex())
  const nflps = upsertNFLPs(cellarContract, cellar)
  const tokenIds = nflps.map(nflp => BigInt.fromString(nflp.id))
  calculateCurrentTvl(nflpManager, bundle, cellar, tokenIds)

  cellar.save()
}

export function handleRebalance(call: RebalanceCall): void {
  const cellarContract = CellarContract.bind(call.from)
  const nflpManager = NonfungiblePositionManager.bind(NONFUNGIBLE_POSITION_MANAGER)
  let bundle = Bundle.load('1')

  const cellar = Cellar.load(call.from.toHexString())
  const nflps = saveNFLPs(cellarContract, cellar)
  const tokenIds = nflps.map(nflp => BigInt.fromString(nflp.id))
  calculateCurrentTvl(nflpManager, bundle, cellar, tokenIds)

  cellar.save()
}