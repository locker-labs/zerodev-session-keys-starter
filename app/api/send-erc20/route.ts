import { NextResponse } from "next/server";
import { execCallDataWithPolicy } from "@/lib/zerodev";
import { encodeFunctionData } from "viem";
import ERC20_TRANSFER_ABI from "@/abi/erc20TransferAbi";
import { CallType } from "@zerodev/sdk/types";

export async function POST(req: Request) {
  try {
    const { amount, tokenAddress, sessionKey, toAddress } = await req.json();

    // Validate required parameters
    if (!amount || !tokenAddress || !sessionKey || !toAddress) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const amountOut = BigInt(amount);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const erc20UnencodedData: any = {
      abi: ERC20_TRANSFER_ABI,
      functionName: "transfer",
      args: [toAddress, amountOut],
    };
    console.log("erc20UnencodedData", erc20UnencodedData);

    const erc20Data = encodeFunctionData(erc20UnencodedData);

    const callDataArgs = [
      {
        to: tokenAddress,
        value: BigInt(0),
        data: erc20Data,
        // callType: "call" as CallType,
      },
    ];

    const scope = "zerodev-session-keys-starter";
    const result = await execCallDataWithPolicy({
      sessionKey,
      callDataArgs,
      scope,
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Error sending ERC20:", error);
    return NextResponse.json(
      { error: "Failed to send ERC20 tokens" },
      { status: 500 }
    );
  }
}
