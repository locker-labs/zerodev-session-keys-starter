// ************************************************************* //
// Executes a call data with a policy

import { BUNDLER_URL, CHAIN, PAYMASTER_URL } from "./constants";
import { getEntryPoint, KERNEL_V3_1 } from "@zerodev/sdk/constants";
import { privateKeyToAccount } from "viem/accounts";
import { Address, createPublicClient, Hex, http } from "viem";
import { toECDSASigner } from "@zerodev/permissions/signers";
import { deserializePermissionAccount } from "@zerodev/permissions";
import {
  createKernelAccountClient,
  createZeroDevPaymasterClient,
  getCustomNonceKeyFromString,
  getUserOperationGasPrice,
} from "@zerodev/sdk";
const entryPoint = getEntryPoint("0.7");

export const PASSKEY_AUTHORIZED_PRIVATE_KEY = process.env
  .PASSKEY_AUTHORIZED_PRIVATE_KEY as `0x${string}`;
if (!PASSKEY_AUTHORIZED_PRIVATE_KEY)
  throw new Error("PASSKEY_AUTHORIZED_PRIVATE_KEY is not set");

type ICallDataArgs = {
  to: Address;
  value: bigint;
  data: Hex;
};
// ************************************************************* //
export const execCallDataWithPolicy = async ({
  sessionKey,
  callDataArgs,
  scope,
}: {
  sessionKey: string;
  callDataArgs: ICallDataArgs[];
  scope: string;
}): Promise<string> => {
  // Create signer from locker agent
  const sessionKeyRawAccount = privateKeyToAccount(
    PASSKEY_AUTHORIZED_PRIVATE_KEY
  );
  const sessionKeySigner = await toECDSASigner({
    signer: sessionKeyRawAccount,
  });
  const publicClient = createPublicClient({
    transport: http(BUNDLER_URL),
    chain: CHAIN,
  });

  // console.log("Using session key");
  // console.log(serializedSessionKey);
  const sessionKeyAccount = await deserializePermissionAccount(
    publicClient,
    entryPoint,
    KERNEL_V3_1,
    sessionKey,
    sessionKeySigner
  );
  // Construct user op and paymaster
  const kernelPaymaster = createZeroDevPaymasterClient({
    chain: CHAIN,
    transport: http(PAYMASTER_URL),
  });
  const kernelClient = createKernelAccountClient({
    account: sessionKeyAccount,
    chain: CHAIN,
    bundlerTransport: http(BUNDLER_URL),
    client: publicClient,
    paymaster: {
      getPaymasterData(userOperation) {
        return kernelPaymaster.sponsorUserOperation({
          userOperation,
        });
      },
    },
    userOperation: {
      estimateFeesPerGas: async ({ bundlerClient }) =>
        getUserOperationGasPrice(bundlerClient),
    },
  });

  //   const nonceKey = getCustomNonceKeyFromString(scope, entryPoint.version);
  //   const nonce = await kernelClient.account.getNonce({ key: nonceKey });
  //   console.log("Nonce", nonce, scope, nonceKey);
  // Otherwise is ER20
  // Send user operation
  console.log("Going to send ERC20 transfer", callDataArgs);
  const callData = await sessionKeyAccount.encodeCalls(callDataArgs);
  const userOpHash = await kernelClient.sendUserOperation({
    callData,
    // nonce,
  });

  console.log("Waiting for user operation receipt", userOpHash);
  const txReceipt = await kernelClient.waitForUserOperationReceipt({
    hash: userOpHash,
  });
  console.log("User operation receipt", txReceipt);

  return txReceipt.receipt.transactionHash;
};
