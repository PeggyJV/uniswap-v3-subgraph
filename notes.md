The following is a list of files in [`uniswap-v3-core`](https://github.com/Uniswap/uniswap-v3-core) and the events they emit as well as the events they define. All file descriptions are from the `contracts/` directory 

> NOTE: We will need to index some data from the [`uniswap-v3-periphery`](https://github.com/Uniswap/uniswap-v3-periphery) especially for data about individual LP positions. The contracts there are still WIP and we aren't able to get the correct data out of them right now.

### TODO:
- [ ] Import ABIs for each file below
- [ ] Write `subgraph.yaml`
    * [ ] TODO: subtasks
- [ ] Write `schema.graphql`
    * [ ] TODO: subtasks
- [ ] Write functions in `src/mappings`
    * [ ] TODO: subtasks

## Uniswap V3 Core Events
### `UniswapV3Factory.sol`

Emit:
- `FeeAmountEnabled`
- `OwnerChanged`
- `PoolCreated`
Events:

### `UniswapV3Pool.sol`

Emit:
- `IncreaseObservationCardinalityNext`
- `Initialize`
- `Mint`
- `Collect`
- `Burn`
- `Swap`
- `Flash`
- `SetFeeProtocol`
- `CollectProtocol`
Events:

### `interfaces/IERC20Minimal.sol`

Emit:
Events:
- `Transfer`
    - `address indexed from`
    - `address indexed to`
    - `uint256 value`
- `Approval`
    - `address indexed owner`
    - `address indexed spender`
    - `uint256 value`

### `interfaces/IUniswapV3Factory.sol`

Emit:
Events:
- `OwnerChanged`
    - `address indexed oldOwner`
    - `address indexed newOwner`
- `PoolCreated`
    - `address indexed token0`
    - `address indexed token1`
    - `uint24 indexed fee`
    - `int24 tickSpacing`
    - `address pool`
- `FeeAmountEnabled`
    - `uint24 indexed fee`
    - `int24 indexed tickSpacing`

### `interfaces/pool/IUniswapV3PoolEvents.sol`

Emit:
Events:
- `Initialize`
    - `uint160 sqrtPriceX96`
    - `int24 tick`
- `Mint`
    - `address sender`
    - `address indexed owner`
    - `int24 indexed tickLower`
    - `int24 indexed tickUpper`
    - `uint128 amount`
    - `uint256 amount0`
    - `uint256 amount1`
- `Collect`
    - `address indexed owner`
    - `address recipient`
    - `int24 indexed tickLower`
    - `int24 indexed tickUpper`
    - `uint128 amount0`
    - `uint128 amount1`
- `Burn`
    - `address indexed owner`
    - `int24 indexed tickLower`
    - `int24 indexed tickUpper`
    - `uint128 amount`
    - `uint256 amount0`
    - `uint256 amount1`
- `Swap`
    - `address indexed sender`
    - `address indexed recipient`
    - `int256 amount0`
    - `int256 amount1`
    - `uint160 sqrtPriceX96`
    - `int24 tick`
- `Flash`
    - `address indexed sender`
    - `address indexed recipient`
    - `uint256 amount0`
    - `uint256 amount1`
    - `uint256 paid0`
    - `uint256 paid1`
- `IncreaseObservationCardinalityNext`
    - `uint16 observationCardinalityNextOld`
    - `uint16 observationCardinalityNextNew`
- `SetFeeProtocol`
    - `uint8 feeProtocol0Old`
    - `uint8 feeProtocol1Old`
    - `uint8 feeProtocol0New`
    - `uint8 feeProtocol1New`
- `CollectProtocol`
    - `address indexed sender`
    - `address indexed recipient`
    - `uint128 amount0`
    - `uint128 amount1`