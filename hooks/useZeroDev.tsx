"use client";
import { toSudoPolicy } from "@zerodev/permissions/policies";

import {
	getKernelAddressFromECDSA,
	signerToEcdsaValidator,
} from "@zerodev/ecdsa-validator";
import {
	serializePermissionAccount,
	toPermissionValidator,
} from "@zerodev/permissions";
import { toECDSASigner } from "@zerodev/permissions/signers";
import {
	addressToEmptyAccount,
	createKernelAccount,
	createKernelAccountClient,
	createZeroDevPaymasterClient,
	getUserOperationGasPrice,
} from "@zerodev/sdk";
import { getEntryPoint, KERNEL_V3_1 } from "@zerodev/sdk/constants";
import {
	Address,
	encodeFunctionData,
	erc20Abi,
	Hex,
	http,
	type PublicClient,
	zeroAddress,
} from "viem";
import { usePublicClient, useWalletClient } from "wagmi";

import { getTransferPolicy } from "@/lib/policies";
import { CHAIN, BUNDLER_URL, PAYMASTER_URL, ZERODEV_SEED } from "@/lib/constants";

const entryPoint = getEntryPoint("0.7");

const useZeroDev = () => {
	const publicClient = usePublicClient();
	// console.log("!publicClient", publicClient);
	const { data: walletClient } = useWalletClient();

	// ************************************************************* //
	// Prompts user to sign session key for current chain
	// ************************************************************* //
	const signSessionKey = async ({authorizedAddress}: {authorizedAddress: `0x${string}`}): Promise<string | undefined> => {
		console.log(
			"signSessionKey",
		);
		if (!walletClient) {
			throw new Error("Wallet client is not available");
		}

		// const smartAccountSigner =
		// 	walletClientToSmartAccountSigner(walletClient);

		const ecdsaValidator = await signerToEcdsaValidator(
			publicClient as PublicClient,
			{
				signer: walletClient,
				entryPoint,
				kernelVersion: KERNEL_V3_1,
			}
		);

		const emptyAccount = addressToEmptyAccount(
			authorizedAddress
		);

		const emptySessionKeySigner = await toECDSASigner({
			signer: emptyAccount,
		});

		// Policies to allow authorized address to send erc20 to authorized address
		const combinedPolicy = getTransferPolicy(authorizedAddress)

		// THI FAILS
		const policies = [combinedPolicy];
		// THIS WORKS
		// const policies = [toSudoPolicy({})]

		const permissionPlugin = await toPermissionValidator(
			publicClient as PublicClient,
			{
				entryPoint,
				signer: emptySessionKeySigner,
				policies,
				kernelVersion: KERNEL_V3_1,
			}
		);
		const index = ZERODEV_SEED;
		console.log("index", index);
		console.log("ENTRYPOINT_ADDRESS_V07", entryPoint);
		console.log("KERNEL_V3_1", KERNEL_V3_1);
		console.log("ecdsaValidator", ecdsaValidator);
		console.log("permissionPlugin", permissionPlugin);
		const kernelAccountObj = await createKernelAccount(
			publicClient as PublicClient,
			{
				kernelVersion: KERNEL_V3_1,
				index,
				entryPoint,
				plugins: {
					sudo: ecdsaValidator,
					regular: permissionPlugin,
				},
			}
		);

		let sig;
		try {
			sig = await serializePermissionAccount(kernelAccountObj);
		} catch (error) {
			const acceptableErrorMessages = [
				"rejected",
				"request reset",
				"denied",
			];
			if (
				!acceptableErrorMessages.some((msg) =>
					(error as Error).message.includes(msg)
				)
			) {
				// eslint-disable-next-line no-console
				console.error(error);
			}
		}

		return sig;
	};
	// ************************************************************* //


	// ************************************************************* //
	// Constructs and submits userOp to send money out of locker
	// ************************************************************* //
	const sendUserOp = async (
		recipient: `0x${string}`,
		token: `0x${string}`,
		amount: bigint
	): Promise<`0x${string}` | undefined> => {
		if (!walletClient) {
			throw new Error("Wallet client is not available");
		}

		const ecdsaValidator = await signerToEcdsaValidator(
			publicClient as PublicClient,
			{
				signer: walletClient,
				entryPoint,
				kernelVersion: KERNEL_V3_1,
			}
		);
		const index = BigInt(0);
		console.log("sendUserOp");
		console.log("index", index);
		console.log("publicClient", publicClient);
		console.log("ecdsaValidator", ecdsaValidator);
		console.log("ENTRYPOINT_ADDRESS_V07", entryPoint);

		const kernelAccountObj = await createKernelAccount(
			publicClient as PublicClient,
			{
				kernelVersion: KERNEL_V3_1,
				index,
				entryPoint,
				plugins: {
					sudo: ecdsaValidator,
				},
			}
		);


		const zerodevPaymaster = createZeroDevPaymasterClient({
			chain: CHAIN,
			transport: http(PAYMASTER_URL),
		});

		const kernelAccountClient = createKernelAccountClient({
			account: kernelAccountObj,
			chain: CHAIN,
			bundlerTransport: http(BUNDLER_URL),
			client: publicClient,
			paymaster: {
				getPaymasterData(userOperation) {
					return zerodevPaymaster.sponsorUserOperation({
						userOperation,
					});
				},
			},
			userOperation: {
				estimateFeesPerGas: async ({ bundlerClient }) =>
					getUserOperationGasPrice(bundlerClient),
			},
		});

		let hash;
		try {
			if (
				token === zeroAddress ||
				token === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
			) {
				const sendParams = {
					to: recipient,
					value: amount,
					data: "0x00000000", // default to 0x
				} as {
					to: Address;
					value: bigint;
					data: Hex;
				};
				console.log("sendParams", sendParams);
				// Native token
				hash = await kernelAccountClient.sendTransaction({
					calls: [sendParams],
				});
			} else {
				// ERC-20 token
				hash = await kernelAccountClient.sendUserOperation({
					callData: await kernelAccountObj.encodeCalls([
						{
							to: token,
							value: BigInt(0),
							data: encodeFunctionData({
								abi: erc20Abi,
								functionName: "transfer",
								args: [recipient, amount],
							}),
						},
					]),
				});
			}

			console.log("hash", hash);
			return hash;
		} catch (error) {
			const acceptableErrorMessages = [
				"rejected",
				"request reset",
				"denied",
			];
			if (
				!acceptableErrorMessages.some((msg) =>
					(error as Error).message.includes(msg)
				)
			) {
				// eslint-disable-next-line no-console
				console.error(error);
			}
		}

		return hash;
	};
	// ************************************************************* //

	// ************************************************************* //
	// Generates a smart account address from an EOA address and
	// a locker index
	// ************************************************************* //
	const genSmartAccountAddress = async (
		eoaAddress: `0x${string}`,
	): Promise<`0x${string}`> =>
		getKernelAddressFromECDSA({
			publicClient: publicClient as PublicClient,
			eoaAddress,
			index: ZERODEV_SEED,
			kernelVersion: KERNEL_V3_1,
			entryPoint,
		});
	// ************************************************************* //



	return {
		genSmartAccountAddress,
		signSessionKey,
		sendUserOp,
	};
};

export default useZeroDev;
