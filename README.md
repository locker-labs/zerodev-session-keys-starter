# ZeroDev Session Keys Demo

This project demonstrates how to implement [session keys](https://docs.zerodev.app/sdk/advanced/session-keys) using the ZeroDev SDK. Session keys allow you to delegate specific permissions to temporary keys, enabling more efficient and secure transaction signing. It extends the official [ZeroDev examples](https://github.com/zerodevapp/zerodev-examples/tree/11db56da58d113b0028179467272518811824bba/session-keys) by incorporating into a Next.js app. Signing is done via Wagmi instead of a hardcoded signer.

## Overview

This demo shows how to:
- Create session keys with specific permissions
- Use session keys to send ERC20 tokens
- Implement permission policies for session keys

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Configure environment variables:
Create a `.env.local` file with:
```
NEXT_PUBLIC_PROJECT_ID=your_project_id
```

3. Run the development server:
```bash
pnpm run dev
```

## Usage Guide

### 1. Setup Smart Account
- Connect your wallet using the "Connect" button
- This automatically generates a ZeroDev kernel address (smart account)
- Your kernel address will be displayed once connected
- This smart account will be the source of your transfers

### 2. Configure Environment
Create a `.env.local` file with your desired chain and token:
```bash
# Infrastructure
NEXT_PUBLIC_BUNDLER_URL=your_bundler_url
NEXT_PUBLIC_PAYMASTER_URL=your_paymaster_url
NEXT_PUBLIC_PASSKEY_AUTHORIZED_ADDRESS=0x...

# Token Configuration
NEXT_PUBLIC_TOKEN_ADDRESS=0x...  # The token you want to use
NEXT_PUBLIC_TOKEN_DECIMALS=18    # Decimals for your chosen token
```

### 3. Fund Your Smart Account
- Send tokens to your kernel address
- You can copy the kernel address from the UI after connecting
- Ensure you're sending the same token specified in `NEXT_PUBLIC_TOKEN_ADDRESS`

### 4. Transfer Methods

#### Method 1: Regular UserOperation
- Click "Transfer (Regular)" in the UI
- Your connected wallet (kernel owner) will be prompted to sign
- This creates a standard UserOperation for the transfer
- The transfer is executed directly from your kernel address

#### Method 2: Session Key Transfer
1. **Create Session Key**
   - Click "Generate Session Key"
   - Sign the permission policy with your kernel owner wallet
   - This creates a temporary key with limited permissions

2. **Use Session Key**
   - Click "Transfer (Session Key)"
   - The transfer is signed using the session key
   - No wallet signature required for this transfer
   - Must comply with the permissions defined in the session key policy

## Policy Breakdown

The session key policy defines what operations are permitted. Here's a detailed breakdown of the transfer policy:

```typescript
export const getTransferPolicy = (toAddress: `0x${string}`) => 
  toCallPolicy({
    policyVersion: CallPolicyVersion.V0_0_4,
    permissions: [
      {
        // ERC20 Token Permissions
        target: zeroAddress,        // Zero address means policy applies to ALL ERC20 tokens
        abi: erc20Abi,             // Standard ERC20 interface
        functionName: "transfer",   // Only allows transfer function
        args: [
          // First argument (recipient address)
          {
            condition: ParamCondition.EQUAL,
            value: toAddress,       // Must match specified destination
          },
          // Second argument (amount)
          null,                     // Null means any amount is allowed
        ],
      },
      {
        // Native Token (ETH) Permissions
        target: toAddress,
        valueLimit: BigInt("100000000000000000000000000000"), // ~100B ETH limit
      },
    ],
  });
```

### Policy Components

#### 1. Policy Version
- Uses version `V0_0_4` of the call policy
- Ensures compatibility with ZeroDev's permission system

#### 2. ERC20 Token Permissions
- **Target**: `zeroAddress` (0x0)
  - Using zero address means this policy applies to ALL ERC20 tokens
  - More restrictive policies could specify a single token address

- **Function Access**:
  - Limited to only the `transfer` function
  - Uses standard ERC20 ABI
  - Other functions like `approve` or `transferFrom` are not permitted

- **Arguments Control**:
  1. Recipient Address (`to`)
     - Must exactly match the specified destination
     - Cannot transfer to any other address
  2. Amount (`value`)
     - Set to `null`
     - Allows any amount to be transferred
     - Could be restricted by setting a maximum value

#### 3. Native Token (ETH) Permissions
- **Target**: Specified destination address
- **Value Limit**: Set to a very high number
  - Limit of 100 billion ETH
  - Effectively unlimited for practical purposes

### Security Implications

1. **Address Restriction**
   - Transfers can only go to the pre-specified address
   - Prevents unauthorized redirections of funds

2. **Function Limitation**
   - Only basic transfers are allowed
   - No approval or complex operations
   - Reduces potential attack vectors

3. **Token Scope**
   - Policy allows transfers of any ERC20 token
   - Could be restricted to specific tokens by changing `zeroAddress`

4. **Amount Control**
   - No limit on ERC20 transfer amounts
   - Very high limit for ETH transfers
   - Consider adding amount limits for production use

## Key Constants
- `CHAIN`: Set to Linea network (an Ethereum L2 scaling solution)
  - Provides better transaction speeds and lower costs
  - Compatible with Ethereum's EVM
- `BUNDLER_URL`: Endpoint for the transaction bundler service
  - Bundles multiple user operations into a single transaction
  - Required for ERC-4337 account abstraction
  - Set via `NEXT_PUBLIC_BUNDLER_URL` environment variable
- `PAYMASTER_URL`: Endpoint for the paymaster service
  - Enables gasless transactions by sponsoring gas fees
  - Allows users to pay fees in ERC20 tokens
  - Set via `NEXT_PUBLIC_PAYMASTER_URL` environment variable
- `PASSKEY_AUTHORIZED_ADDRESS`: Ethereum address authorized for passkey operations
  - Used for authenticating passkey-based operations
  - Must be a valid Ethereum address (0x format)
  - Set via `NEXT_PUBLIC_PASSKEY_AUTHORIZED_ADDRESS` environment variable
- `ZERODEV_SEED`: Deterministic seed value (set to 0n)
  - Used for generating consistent account addresses
  - Important for account recovery and predictable address generation
- `TOKEN_ADDRESS`: The ERC20 token contract address
  - Address of the token being used in the demo
  - Must be a valid Ethereum address (0x format)
  - Set via `NEXT_PUBLIC_TOKEN_ADDRESS` environment variable
- `TOKEN_DECIMALS`: Number of decimals for the ERC20 token
  - Defines the token's decimal precision
  - Used for proper amount calculations
  - Set via `NEXT_PUBLIC_TOKEN_DECIMALS` environment variable

## API Endpoints

### POST /api/send-erc20
Executes an ERC20 transfer using a session key.

Parameters:
- `amount`: Amount of tokens to transfer
- `tokenAddress`: ERC20 token contract address
- `sessionKey`: The session key to use for signing
- `destination`: Recipient address

## Learn More

- [ZeroDev Session Keys Documentation](https://docs.zerodev.app/sdk/advanced/session-keys)
- [Next.js Documentation](https://nextjs.org/docs)

