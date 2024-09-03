require('dotenv').config();
const { ethers } = require("ethers");

// Load environment variables
const privateKey = process.env.PRIVATE_KEY;
const rpcUrl = process.env.RPC_URL;

// Initialize provider and wallet
const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
const wallet = new ethers.Wallet(privateKey, provider);

// Define the router contract
const routerAddress = "0x135a7e31b86832b6e3f73da2ecf72588fa5e00b9";
const routerAbi = [
    "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) payable returns (uint[] memory amounts)",
    "function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) returns (uint[] memory amounts)",
    "function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)",
    "function getAmountsIn(uint amountOut, address[] calldata path) external view returns (uint[] memory amounts)"
];

const routerContract = new ethers.Contract(routerAddress, routerAbi, wallet);

let logSequence = 1;

async function getBalance(tokenAddress) {
    if (tokenAddress === ethers.constants.AddressZero) {
        // ETH balance
        return await provider.getBalance(wallet.address);
    } else {
        // Token balance
        const tokenAbi = ["function balanceOf(address owner) view returns (uint256)"];
        const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, provider);
        return await tokenContract.balanceOf(wallet.address);
    }
}

async function logStatus() {
    const artsBalance = await getBalance("0x0000000000000000000000000000000000000000"); // ART token address
    const artBalance = await getBalance("0x557ceb8739640b02a547a04643089accb3b88e03"); // ART token address
    const usdtBalance = await getBalance("0x6cddd437ced8a9af4d53ee51b1645bbd08f9b702"); // USDT token address
    console.log(`[${logSequence++}] ART Balance: ${ethers.utils.formatUnits(artsBalance, 18)} ART`);
    console.log(`USDT Balance: ${ethers.utils.formatUnits(usdtBalance, 18)} USDT`);
}

async function estimateSwap(amountIn, path) {
    const amountsOut = await routerContract.getAmountsOut(amountIn, path);
    return amountsOut[amountsOut.length - 1];
}

async function swapARTtoUSDT() {
    try {
        console.log("Starting ART to USDT swap...");
        const path = [
            "0x557ceb8739640b02a547a04643089accb3b88e03",  // ART token
            "0x6cddd437ced8a9af4d53ee51b1645bbd08f9b702"   // USDT token
        ];
        const amountIn = ethers.utils.parseUnits("1", 18); // 1 ART
        const to = wallet.address; // Recipient address
        const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from now

        // Estimate the output
        const estimatedAmountOut = await estimateSwap(amountIn, path);
        console.log(`Estimated USDT to receive: ${ethers.utils.formatUnits(estimatedAmountOut, 18)} USDT`);

        const amountOutMin = ethers.utils.parseUnits("0", 18); // Set minimum acceptable amount, could use a slippage tolerance instead

        // Send transaction
        console.log("Sending transaction to swap 1 ART for USDT...");
        const tx = await routerContract.swapExactETHForTokens(
            amountOutMin,
            path,
            to,
            deadline,
            { value: amountIn } // Swap 1 ART for USDT
        );

        console.log(`Transaction sent. Hash: ${tx.hash}`);
        await tx.wait();
        console.log("Transaction confirmed.");
    } catch (error) {
        console.error("Saldo habis"); //, error);
    }
}


async function swapUSDTtoART() {
    try {
        console.log("Starting USDT to ART swap...");
        const path = [
            "0x6cddd437ced8a9af4d53ee51b1645bbd08f9b702",  // USDT token
            "0x557ceb8739640b02a547a04643089accb3b88e03"   // ART token
        ];
        const amountIn = ethers.utils.parseUnits("100", 18); // 100 USDT
        const to = wallet.address; // Recipient address
        const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from now

        // Estimate the output
        const estimatedAmountOut = await estimateSwap(amountIn, path);
        console.log(`Estimated ART to receive: ${ethers.utils.formatUnits(estimatedAmountOut, 18)} ART`);

        const amountOutMin = ethers.utils.parseUnits("0", 18); // Set minimum acceptable amount, could use a slippage tolerance instead

        // Send transaction
        console.log("Sending transaction to swap 100 USDT for ART...");
        const tx = await routerContract.swapExactTokensForETH(
            amountIn,
            amountOutMin,
            path,
            to,
            deadline
        );

        console.log(`Transaction sent. Hash: ${tx.hash}`);
        await tx.wait();
        console.log("Transaction confirmed.\n");
    } catch (error) {
        console.error("Saldo habis"); //, error);
    }
}

async function performSwaps() {
    while (true) {
        await logStatus();
        try {
            await swapARTtoUSDT();
            await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for 5 seconds

            await swapUSDTtoART();
            await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for 5 seconds
        } catch (error) {
            console.error("Saldo habis"); //, error);
            await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for 5 seconds before retrying
        }
    }
}

performSwaps();
