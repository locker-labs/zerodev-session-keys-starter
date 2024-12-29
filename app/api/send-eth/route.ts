import { NextResponse } from "next/server";
import { execCallDataWithPolicy } from "@/lib/zerodev";

export async function POST(req: Request) {
  try {
    const { amount, sessionKey, toAddress } = await req.json();

    // Validate required parameters
    if (!amount || !sessionKey || !toAddress) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const amountOut = BigInt(amount);

    const callDataArgs = [
      {
        to: toAddress,
        value: amountOut,
        data: "0x00000000" as `0x${string}`, // default to 0x
        // callType: "call" as CallType,
      },
    ];

    const scope = "zerodev-session-keys-starter";
    const result = await execCallDataWithPolicy({
      sessionKey,
      callDataArgs,
      scope,
      isTransfer: true,
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
