require('dotenv').config();
const { ethers } = require('ethers');

// Load environment variables
const RPC_URL = process.env.RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// Initialize provider and wallet
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// Constants
const USDT_CONTRACT = "0x6cDdd437CeD8a9Af4D53Ee51B1645Bbd08F9B702";
const WART_CONTRACT = "0x557CEB8739640B02A547a04643089acCB3b88E03";
const ROUTER_CONTRACT = "0x135a7E31B86832b6e3f73dA2ecf72588Fa5E00B9";

// ABI for the router contract
const routerAbi = [
  "function swapExactTokensForETH(uint256 amountIn, uint256 amountOutMin, address[] calldata path, address to, uint256 deadline) external returns (uint256[] memory amounts)"
];

// Create contract instance
const routerContract = new ethers.Contract(ROUTER_CONTRACT, routerAbi, wallet);

// Function to generate a random amount between 0.001 and 0.01 USDT
function getRandomAmount() {
  const min = 0.001;
  const max = 0.01;
  const randomAmount = Math.random() * (max - min) + min;
  return ethers.utils.parseUnits(randomAmount.toFixed(6), 6); // Convert to appropriate units
}

// Initialize counter
let counter = 1;

async function swapTokens() {
  const amountIn = getRandomAmount(); // Generate a random amount  
  const path = [USDT_CONTRACT, WART_CONTRACT];
  const amountOutMin = 0; // Minimal amount to receive (set to 0 for simplicity)
  const deadline = Math.floor(Date.now() / 1000) + 60 * 10; // 10 minutes from now
  const to = wallet.address;

  try {
    // Perform the swap
    const gasPrice = await provider.getGasPrice(); // Get current gas price

    const swapTx = await routerContract.swapExactTokensForETH(
      amountIn,
      amountOutMin,
      path,
      to,
      deadline,
      {
        gasLimit: 500000, // Adjust if necessary
        gasPrice: gasPrice // Use current gas price
      }
    );

    // Log transaction hash and block number
    //console.log(`${counter}. Sukses | Tx hash: ${swapTx.hash.slice(0, 10)}........ | Block: menunggu konfirmasi`);

    // Wait for swap transaction to be mined
    const receipt = await swapTx.wait();
    console.log(`${counter}. Sukses | Tx hash: ${swapTx.hash.slice(0, 10)}........ | Block: ${receipt.blockNumber}`);

    // Increment counter
    counter++;

  } catch (error) {
    console.error(`${counter}. Error during swap:`, error);
    counter++;
  }
}

// Continuous loop to keep swapping tokens
async function startSwapping() {
  while (true) {
    await swapTokens();
  }
}

// Start the swapping process
startSwapping().catch(console.error);
