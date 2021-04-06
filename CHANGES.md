# V2 -> V3 Subgraph Changes

## Major Changes

* Replaced all refs to `pair` with `pool` (e.g. renamed entity)
* New fields for `Pool`
  * `feeTier`
  * `tickSpacing`
  * `liquidity`
  * `sqrtPrice`
  * `uncollected`/`collectedFees` (needed? Maybe just for `Position`)?
  * `createdAtBlockNumber`
  * `ticks` - see below
* New `Tick` entity
  * A _lot_ of extra data, but seems unavoidable
  * Seems important to have `Tick` to be able to easily determine liquidity/trade distribution
  * Special fields: `sqrtPriceLower`/`sqrtPriceUpper`
  * Otherwise similar to `pool` in terms of liquidity/reserve/volume fields
  * **Mapping Question:** how to initialize ticks? All of them at the time of pool creation (with `isActive: false`)? Or only when `Mint` emits a position at that tick?
* `Mint`/`Burn` unchanged except for added `tickLower`/`tickUpper` fields
  * Since this is core only, this really tracks tick creation/destruction
  * It's our understanding we will need to index periphery to get user-level mints/burns
* `Swap` gets new fields `sqrtPriceX96` and `Tick`
  * **Question:** What does the `X96` part represent again?
  * **Question:** is there a way to determine _all_ ticks crossed in a particular swap?
* New `Collect` entity - missing any important fields here?

## Minor/Sommelier-Specific Changes

* Added `combinedXXX` fields e.g. (`combinedVolumeUSD`)
* High-fidelity minute-level time window, in addition to hour/day - `PoolMinuteData` - could do more but worried about size of the tables. With highest-fidelity option, one could also aggregate on the client side to get e.g. 10-minute ticker data. Also normalized some fields across themes:
  * took our `hourlyXXX`/`dailyXXX` and replaced it with `periodXXX` across all time windows
  * Changed all dates to `periodStartUnix`
  * Removed `poolAddress` from DayData and made everything reference `Pool`
* Thinking about doing OHLC for `PoolDayData`, `PoolHourData`, `PoolMinuteData` - all straightforward to calculate except close