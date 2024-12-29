"use client";

import useZeroDev from "@/hooks/useZeroDev";
import { PASSKEY_AUTHORIZED_ADDRESS, TOKEN_ADDRESS, TOKEN_DECIMALS } from "@/lib/constants";
import { useEffect, useState } from "react";
import { zeroAddress } from "viem";
import { useAccount, useBalance } from "wagmi";

export default function Home() {
  const { address } = useAccount();
  const { genSmartAccountAddress, signSessionKey, sendUserOp } = useZeroDev();
  const [kernelAddress, setKernelAddress] = useState<string>();
  const [sessionKey, setSessionKey] = useState<string>();
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");

  const { data: tokenBalance } = useBalance({
    address: kernelAddress as `0x${string}`,
    token: TOKEN_ADDRESS,
    query: { refetchInterval: 5_000 },
  });

    // Add ETH balance hook
    const { data: ethBalance } = useBalance({
      address: kernelAddress as `0x${string}`,
      query: { refetchInterval: 5_000 },
    });

  useEffect(() => {
    const getKernelAddress = async () => {
      if (!address) return;
      const kernel = await genSmartAccountAddress(address as `0x${string}`);
      setKernelAddress(kernel);
    };
    getKernelAddress();
  }, [address, genSmartAccountAddress]);

  const handleSignSessionKey = async () => {
    try {
      const key = await signSessionKey({authorizedAddress: PASSKEY_AUTHORIZED_ADDRESS});
      if (key) {
        setSessionKey(key);
      }
    } catch (error) {
      console.error("Error signing session key:", error);
    }
  };

  const amountOut = Boolean(withdrawAmount) ? BigInt(Math.floor(Number(withdrawAmount) * 10 ** Number(TOKEN_DECIMALS))) : BigInt(0);
  const handleWithdrawAsOwner = () => {
    console.log("Withdraw as owner:", amountOut);
    console.log("Going to send tokens");
    try {
      const hash = sendUserOp(
        PASSKEY_AUTHORIZED_ADDRESS,
        TOKEN_ADDRESS,
        amountOut
      );
      console.log(`Sent tokens ${hash}`);
    } catch (error) {
      console.error("Error sending tokens:", error);
    }
  };

  const handleWithdrawWithKey = () => {
    console.log("Withdraw with session key:", amountOut);
    fetch("/api/send-erc20", {
      method: "POST",
      body: JSON.stringify({
        amount: amountOut.toString(),
        tokenAddress: TOKEN_ADDRESS,
        sessionKey,
        toAddress: PASSKEY_AUTHORIZED_ADDRESS,
      }),
    });
  };

  const handleWithdrawEthAsOwner = () => {
    const amountOutEth = Boolean(withdrawAmount) 
      ? BigInt(Math.floor(Number(withdrawAmount) * 10 ** 18)) 
      : BigInt(0);
    
    console.log("Withdraw ETH as owner:", amountOutEth);
    try {
      const hash = sendUserOp(
        PASSKEY_AUTHORIZED_ADDRESS,
        zeroAddress,
        amountOutEth
      );
      console.log(`Sent ETH ${hash}`);
    } catch (error) {
      console.error("Error sending ETH:", error);
    }
  };

  if (!address) {
    return (
      <div className="flex flex-col items-center gap-4 mt-8">
        <p className="text-lg">Please connect your wallet to continue</p>
        <w3m-button />

      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 mt-8">
      <div className="text-center">
        <p className="text-lg mb-2">Connected Wallet: {address}</p>
        <p className="text-lg">ZeroDev Kernel Address: {kernelAddress || "Loading..."}</p>
        <p className="text-lg">Token Address: {TOKEN_ADDRESS}</p>
        <p className="text-lg">Withdraw to Address: {PASSKEY_AUTHORIZED_ADDRESS}</p>
      </div>
      
      {kernelAddress && (
        <div className="text-center">
          <p className="text-lg">
            Token Balance: {tokenBalance?.formatted || "0"} {tokenBalance?.symbol}
          </p>
          <p className="text-lg">
              ETH Balance: {ethBalance?.formatted || "0"} ETH
            </p>
          <div className="mt-4">
            <input
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="Enter withdrawal amount"
              className="border p-2 rounded-lg mr-2 text-black"
            />
            <button
              onClick={handleWithdrawAsOwner}
              className="bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600 transition-colors"
            >
              Withdraw ERC20 as Owner
            </button>
            <button
        onClick={handleWithdrawEthAsOwner}
        className="bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600 transition-colors ml-2"
      >
        Withdraw ETH as Owner
      </button>
            {sessionKey && (
              <button
                onClick={handleWithdrawWithKey}
                className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors ml-2"
              >
                Withdraw with Key
              </button>
            )}
          </div>
        </div>
      )}

      {!sessionKey ? (
        <div className="flex flex-col items-center gap-2">
          <p className="text-center max-w-md">
            By signing the session key, you authorize the forwarding of funds to the designated address.
          </p>
          <button
            onClick={handleSignSessionKey}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Sign Session Key
          </button>
        </div>
      ) : (
        <p className="text-green-600">Session key signed successfully!</p>
      )}
    </div>
  )
}