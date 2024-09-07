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
    const ARTsBalance = await getBalance("0x0000000000000000000000000000000000000000"); // ART token address
    const USDTBalance = await getBalance("0x6cddd437ced8a9af4d53ee51b1645bbd08f9b702"); // USDT token address
    console.log(`Number\t\t: ${logSequence++}\nART Balance\t: ${ethers.utils.formatUnits(ARTsBalance, 18)} ART`);
    console.log(`USDT Balance\t: ${ethers.utils.formatUnits(USDTBalance, 18)} USDT`);
}

async function estimateSwap(amountIn, path) {
    const amountsOut = await routerContract.getAmountsOut(amountIn, path);
    return amountsOut[amountsOut.length - 1];
}

async function swapARTtoUSDT() {
    try {
        const path = [
            "0x557ceb8739640b02a547a04643089accb3b88e03",  // WART token
            "0x6cddd437ced8a9af4d53ee51b1645bbd08f9b702"   // USDT token
        ];

        const ARTsBalance = await getBalance("0x0000000000000000000000000000000000000000");
        const reducedBalance = ethers.utils.formatUnits(ARTsBalance, 18) * 0.9; //90%
        const amountIn = ethers.utils.parseUnits(reducedBalance.toString(), 18);
        
        
        // Estimate the output
        const estimatedAmountOut = await estimateSwap(amountIn, path); 

        const to = wallet.address; // Recipient address
        const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from now

        const amountOutMin = ethers.utils.parseUnits(`${ethers.utils.formatUnits(estimatedAmountOut, 18)}`, ); // Set minimum acceptable amount, could use a slippage tolerance instead

        // Send transaction
        console.log(`Process\t\t: ${ethers.utils.formatUnits(amountIn, 18)} ART for USDT...`);
        const tx = await routerContract.swapExactETHForTokens(
            amountOutMin,
            path,
            to,
            deadline,
            { value: amountIn }
        );
        
        console.log(`Estimated\t: ${ethers.utils.formatUnits(estimatedAmountOut, 18)} USDT`);   
        console.log(`Tx Hash\t\t: ${tx.hash.slice(0, 10)}...`);
        await tx.wait();
        console.log("Status\t\t: \x1b[32m%s\x1b[0m", "Transaction confirmed");
    } catch (error) {
        console.error("Status\t\t: \x1b[31m%s\x1b[0m", error.reason); 
    }
}


async function swapUSDTtoART() {
    try {
        const path = [
            "0x6cddd437ced8a9af4d53ee51b1645bbd08f9b702",  // USDT token
            "0x557ceb8739640b02a547a04643089accb3b88e03"   // WART token
        ];
        const USDTBalance = await getBalance("0x6cddd437ced8a9af4d53ee51b1645bbd08f9b702");

        const amountIn = ethers.utils.parseUnits(ethers.utils.formatUnits(USDTBalance, 18), 18); // All USDT balance

        const estimatedAmountOut = await estimateSwap(amountIn, path);

        const to = wallet.address; // Recipient address
        const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from now


        const amountOutMin = ethers.utils.parseUnits(ethers.utils.formatUnits(estimatedAmountOut, 18)); // Set minimum acceptable amount, could use a slippage tolerance instead

        // Send transaction
        console.log(`Process\t\t: ${ethers.utils.formatUnits(amountIn, 18)} USDT for ART...`);
        const tx = await routerContract.swapExactTokensForETH(
            amountIn,
            amountOutMin,
            path,
            to,
            deadline
        );
        
        console.log(`Estimated\t: ${ethers.utils.formatUnits(estimatedAmountOut, 18)} ART`);
        console.log(`Tx Hash\t\t: ${tx.hash.slice(0, 10)}...`);

        await tx.wait();
        console.log("Status\t\t: \x1b[32m%s\x1b[0m", "Transaction confirmed\n");
    } catch (error) {
        console.error("Status\t\t: \x1b[31m%s\x1b[0m", error.reason); 
    }
}

async function performSwaps() {
    while (true) {
        await logStatus();
        try {
            await swapARTtoUSDT();
            await new Promise(resolve => setTimeout(resolve, 0)); // Wait for 5 seconds

            await swapUSDTtoART();
            await new Promise(resolve => setTimeout(resolve, 0)); // Wait for 5 seconds
        } catch (error) {
            console.error("Status\t\t: \x1b[31m%s\x1b[0m", error.reason); 
            await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for 5 seconds before retrying
        }
    }
}

performSwaps();
