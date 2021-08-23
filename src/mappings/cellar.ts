import { BigInt } from '@graphprotocol/graph-ts'

import { NonfungiblePositionManager } from '../types/NonfungiblePositionManager/NonfungiblePositionManager'
import {
  CellarContract,
  AddedLiquidity,
  RemovedLiquidity,
  RebalanceCall,
} from "../types/Cellar/CellarContract"
import { Cellar } from "../types/schema"
import { NONFUNGIBLE_POSITION_MANAGER } from "../utils/constants"
import {
  calculateCurrentTvl,
  initCellar,
  loadCellar,
  saveNFLPs,
  upsertNFLPs,
} from '../utils/cellar'
import { loadBundle } from '../utils/pricing'

export function handleAddedLiquidity(event: AddedLiquidity): void {
  let cellarContract = CellarContract.bind(event.address)
  let nflpManager = NonfungiblePositionManager.bind(NONFUNGIBLE_POSITION_MANAGER)
  let bundle = loadBundle()

  let cellarAddress = event.address.toHex()
  let cellar = Cellar.load(cellarAddress)
  if (cellar == null) {
    cellar = initCellar(cellarContract, cellarAddress)
  }

  // odd that cellar type is Cellar | null here even though we init it above
  let nflps = upsertNFLPs(cellarContract, cellar as Cellar)
  let tokenIds = nflps.map<BigInt>(nflp => BigInt.fromString(nflp.id))
  calculateCurrentTvl(nflpManager, bundle, cellar as Cellar, tokenIds)

  cellar.save()
}

export function handleRemovedLiquidity(event: RemovedLiquidity): void {
  let cellarContract = CellarContract.bind(event.address)
  let nflpManager = NonfungiblePositionManager.bind(NONFUNGIBLE_POSITION_MANAGER)
  let bundle = loadBundle()

  let cellar = loadCellar(event.address.toHex())
  let nflps = upsertNFLPs(cellarContract, cellar)
  let tokenIds = nflps.map<BigInt>(nflp => BigInt.fromString(nflp.id))
  calculateCurrentTvl(nflpManager, bundle, cellar, tokenIds)

  cellar.save()
}

export function handleRebalance(call: RebalanceCall): void {
  let cellarContract = CellarContract.bind(call.from)
  let nflpManager = NonfungiblePositionManager.bind(NONFUNGIBLE_POSITION_MANAGER)
  let bundle = loadBundle()

  let cellar = loadCellar(call.from.toHexString())
  let nflps = saveNFLPs(cellarContract, cellar)
  let tokenIds = nflps.map<BigInt>(nflp => BigInt.fromString(nflp.id))
  calculateCurrentTvl(nflpManager, bundle, cellar, tokenIds)

  cellar.save()
}