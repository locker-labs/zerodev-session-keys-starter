import { parseAbi } from "viem";

const ERC20_TRANSFER_ABI = parseAbi([
  "function transfer(address _to, uint256 _value) public",
]);

export default ERC20_TRANSFER_ABI;
