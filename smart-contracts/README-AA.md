# CVTC Smart Contracts - ERC-4337 Account Abstraction Integration

This document explains how the CVTC smart contracts have been aligned with Pimlico's paymaster and bundler for ERC-4337 account abstraction support.

## Overview

The smart contracts are now configured to work seamlessly with ERC-4337 account abstraction, allowing users to interact with them through smart accounts that are sponsored by Pimlico's paymaster and executed via their bundler.

## Architecture

### Components

1. **Smart Contracts**: Standard Solidity contracts deployed on BSC Testnet
   - `CVTCSwap.sol`: AMM-style swap contract
   - `CVTCCompounder.sol`: Automated yield compounding
   - `Lock.sol`: Time-locked contract

2. **Account Abstraction Layer**:
   - **Smart Accounts**: Created using Safe with ERC-4337 support
   - **Paymaster**: Pimlico paymaster handles gas fees
   - **Bundler**: Pimlico bundler executes user operations

3. **Frontend Integration**:
   - React context using `permissionless` library
   - Viem for blockchain interactions
   - Privy for wallet authentication

## Configuration

### Environment Variables

Create a `.env` file in the `smart-contracts/` directory:

```bash
# Smart Contracts Environment Variables
CVTC_ADDRESS=0x... # CVTC token address
FARM_ADDRESS=0x... # Farm contract address
ROUTER_ADDRESS=0x... # PancakeSwap router
REWARD_TOKEN_ADDRESS=0x... # Reward token
LP_TOKEN_ADDRESS=0x... # LP token
WBNB_ADDRESS=0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd

# Deployed contract addresses (after deployment)
CVTC_SWAP_ADDRESS=0x...
LOCK_ADDRESS=0x...
CVTC_COMPOUNDER_ADDRESS=0x...

# Pimlico Configuration
PIMLICO_API_KEY=your_pimlico_api_key
PIMLICO_RPC_URL=https://api.pimlico.io/v2/97/rpc?apikey=your_key

# BSC Configuration
BSC_RPC_URL=https://api.pimlico.io/v2/97/rpc?apikey=pim_32ESGpGsTSAn7VVUj7Frd7
BSCSCAN_API_KEY=your_bscscan_key
PRIVATE_KEY=your_private_key
```

### Hardhat Configuration

The `hardhat.config.ts` includes:
- BSC Testnet network configuration
- Pimlico bundler network for account abstraction
- ERC-4337 dependencies

## Deployment

### Prerequisites

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env`

### Deploy Contracts

Run the deployment script:

```bash
npx hardhat run scripts/deploy-all.ts --network bscTestnet
```

This will:
- Deploy all contracts to BSC Testnet
- Save deployment addresses to `deployments/`
- Generate `.env` file with contract addresses

### Verify Contracts

```bash
npx hardhat verify --network bscTestnet <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

## Testing Account Abstraction

### Run AA Tests

```bash
npx hardhat run scripts/test-aa-interactions.ts --network bscTestnet
```

This test script will:
- Create a smart account using Pimlico
- Test interactions with deployed contracts
- Send transactions via the bundler
- Verify paymaster sponsorship

### Manual Testing

1. **Frontend Integration**: The frontend already includes Pimlico context
2. **Smart Account Creation**: Users can create smart accounts through the UI
3. **Gasless Transactions**: Transactions are sponsored by the paymaster
4. **Batch Operations**: Multiple contract calls can be batched

## ERC-4337 Compatibility

### Contract Requirements

The existing contracts are compatible with ERC-4337 because:

1. **No msg.sender Dependencies**: Contracts use standard access control
2. **No Direct Ether Handling**: Gas is handled by the paymaster
3. **Standard Interfaces**: Compatible with ERC-4337 user operations

### Smart Account Features

- **Gas Abstraction**: Users don't need BNB for gas
- **Batch Transactions**: Multiple operations in one transaction
- **Social Recovery**: Advanced account recovery options
- **Multi-signature**: Enhanced security options

## Integration with Frontend

The frontend (`PimlicoContext.jsx`) provides:

```javascript
const { smartAccount, smartAccountAddress, error } = usePimlico();
```

### Usage Example

```javascript
// Send transaction via smart account
const txHash = await smartAccount.sendTransaction({
  to: contractAddress,
  data: contract.interface.encodeFunctionData('functionName', [args]),
});

// The paymaster will sponsor gas fees
// The bundler will execute the user operation
```

## Security Considerations

1. **Paymaster Limits**: Monitor Pimlico paymaster quotas
2. **Contract Access**: Ensure contracts have proper access controls
3. **Private Key Security**: Never expose private keys in frontend
4. **Network Security**: Use testnet for development

## Troubleshooting

### Common Issues

1. **Paymaster Rejection**: Check Pimlico dashboard for limits
2. **Bundler Errors**: Verify network configuration
3. **Contract Deployment**: Ensure sufficient BNB balance
4. **Environment Variables**: Check all required variables are set

### Debug Commands

```bash
# Check contract deployment
npx hardhat run scripts/deploy-all.ts --network bscTestnet

# Test AA interactions
npx hardhat run scripts/test-aa-interactions.ts --network bscTestnet

# Verify contracts on BSCScan
npx hardhat verify --network bscTestnet <address> <args>
```

## Next Steps

1. Deploy contracts to mainnet
2. Set up monitoring for paymaster usage
3. Implement advanced features (social recovery, etc.)
4. Add comprehensive test coverage
5. Document user-facing features

## Support

For issues related to:
- **Pimlico Services**: Check Pimlico documentation
- **ERC-4337**: Refer to ERC-4337 specification
- **Smart Contracts**: Review contract code and tests
- **Frontend Integration**: Check PimlicoContext implementation