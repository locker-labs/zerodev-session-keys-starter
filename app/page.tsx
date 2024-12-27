"use client";

import useZeroDev from "@/hooks/useZeroDev";
import { FORWARDING_FRACTION } from "@/lib/constants";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

export default function Home() {
  const { address } = useAccount();
  const { genSmartAccountAddress, signSessionKey } = useZeroDev();
  const [kernelAddress, setKernelAddress] = useState<string>();
  const [sessionKey, setSessionKey] = useState<string>();

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
      const key = await signSessionKey();
      if (key) {
        setSessionKey(key);
      }
    } catch (error) {
      console.error("Error signing session key:", error);
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
      </div>
      
      {!sessionKey ? (
        <div className="flex flex-col items-center gap-2">
          <p className="text-center max-w-md">
            By signing the session key, you authorize the forwarding of funds to the designated address.
            This permission is limited to {FORWARDING_FRACTION * 100}% of incoming funds.
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