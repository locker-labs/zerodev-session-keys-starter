import { sepolia } from "viem/chains";

export const CHAIN = sepolia;
export const BUNDLER_URL = process.env.NEXT_PUBLIC_BUNDLER_URL;
if (!BUNDLER_URL) throw new Error("NEXT_PUBLIC_BUNDLER_URL is not set");

export const PAYMASTER_URL = process.env.NEXT_PUBLIC_PAYMASTER_URL;
if (!PAYMASTER_URL) throw new Error("NEXT_PUBLIC_PAYMASTER_URL is not set");

export const PASSKEY_AUTHORIZED_ADDRESS = process.env
  .NEXT_PUBLIC_PASSKEY_AUTHORIZED_ADDRESS as `0x${string}`;
if (!PASSKEY_AUTHORIZED_ADDRESS)
  throw new Error("NEXT_PUBLIC_PASSKEY_AUTHORIZED_ADDRESS is not set");

export const ZERODEV_SEED = BigInt(0);

export const TOKEN_ADDRESS = process.env
  .NEXT_PUBLIC_TOKEN_ADDRESS as `0x${string}`;
if (!TOKEN_ADDRESS) throw new Error("NEXT_PUBLIC_TOKEN_ADDRESS is not set");

export const TOKEN_DECIMALS = process.env
  .NEXT_PUBLIC_TOKEN_DECIMALS as `0x${string}`;
if (!TOKEN_DECIMALS) throw new Error("NEXT_PUBLIC_TOKEN_DECIMALS is not set");
