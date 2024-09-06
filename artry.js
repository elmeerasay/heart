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
        return await retryOperation(() => provider.getBalance(wallet.address));
    } else {
        const tokenAbi = ["function balanceOf(address owner) view returns (uint256)"];
        const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, provider);
        return await retryOperation(() => tokenContract.balanceOf(wallet.address));
    }
}

async function logStatus() {
    const ARTsBalance = await getBalance("0x0000000000000000000000000000000000000000"); // ART token address
    const USDTBalance = await getBalance("0x6cddd437ced8a9af4d53ee51b1645bbd08f9b702"); // USDT token address
    console.log(`Number\t\t: ${logSequence++}\nART Balance\t: ${ethers.utils.formatUnits(ARTsBalance, 18)} ART`);
    console.log(`USDT Balance\t: ${ethers.utils.formatUnits(USDTBalance, 18)} USDT`);
}

async function estimateSwap(amountIn, path) {
    return await retryOperation(() => routerContract.getAmountsOut(amountIn, path));
}

async function retryOperation(operation, maxRetries = 5, delay = 5000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            console.error(`Attempt ${attempt} failed. Retrying in ${delay / 1000} seconds...`);
            if (attempt === maxRetries) throw error;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

async function swapARTtoUSDT() {
    try {
        const path = [
            "0x557ceb8739640b02a547a04643089accb3b88e03",  // WART token
            "0x6cddd437ced8a9af4d53ee51b1645bbd08f9b702"   // USDT token
        ];

        // Mendapatkan saldo ART
        const ARTsBalance = await getBalance("0x0000000000000000000000000000000000000000");
        
        // Mengurangi saldo sebanyak 90%
        const reducedBalance = ARTsBalance.mul(90).div(100); // Gunakan BigNumber untuk kalkulasi
        
        // Format BigNumber ke unit yang benar untuk log output
        const formattedAmountIn = ethers.utils.formatUnits(reducedBalance, 18);
        
        console.log(`Process\t\t: ${formattedAmountIn} ART for USDT...`);

        // Estimasi hasil swap
        const estimatedAmountsOut = await estimateSwap(reducedBalance, path); 
        const estimatedAmountOut = estimatedAmountsOut[estimatedAmountsOut.length - 1]; // Ambil nilai terakhir dari array

        if (!ethers.BigNumber.isBigNumber(estimatedAmountOut)) {
            throw new Error('estimatedAmountOut is not a BigNumber');
        }

        console.log(`Estimated\t: ${ethers.utils.formatUnits(estimatedAmountOut, 18)} USDT`);
        const to = wallet.address; // Alamat penerima
        const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 menit dari sekarang
        const amountOutMin = estimatedAmountOut.mul(95).div(100); // Minimal amount out dengan slippage 5%

        // Mengirim transaksi
        const tx = await retryOperation(() => routerContract.swapExactETHForTokens(
            amountOutMin,
            path,
            to,
            deadline,
            { value: reducedBalance }
        ));
        
        console.log(`Tx Hash\t\t: ${tx.hash.slice(0, 10)}...`);
        
        // Menunggu transaksi dikonfirmasi
        await tx.wait();
        console.log("Status\t\t: \x1b[32m%s\x1b[0m", "Transaction confirmed");
    } catch (error) {
        console.error("Status\t\t: \x1b[31m%s\x1b[0m", "Error!", error);
    }
}

async function swapUSDTtoART() {
    try {
        const path = [
            "0x6cddd437ced8a9af4d53ee51b1645bbd08f9b702",  // USDT token
            "0x557ceb8739640b02a547a04643089accb3b88e03"   // WART token
        ];
        const USDTBalance = await getBalance("0x6cddd437ced8a9af4d53ee51b1645bbd08f9b702");
        const amountIn = ethers.utils.parseUnits(ethers.utils.formatUnits(USDTBalance, 18), 18); // Semua saldo USDT
        const estimatedAmountsOut = await estimateSwap(amountIn, path);
        const estimatedAmountOut = estimatedAmountsOut[estimatedAmountsOut.length - 1];

        if (!ethers.BigNumber.isBigNumber(estimatedAmountOut)) {
            throw new Error('estimatedAmountOut is not a BigNumber');
        }

        const to = wallet.address; // Alamat penerima
        const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 menit dari sekarang
        const amountOutMin = estimatedAmountOut.mul(95).div(100); // Minimal amount out dengan slippage 5%

        console.log(`Process\t\t: ${ethers.utils.formatUnits(amountIn, 18)} USDT for ART...`);
        const tx = await retryOperation(() => routerContract.swapExactTokensForETH(
            amountIn,
            amountOutMin,
            path,
            to,
            deadline
        ));
        
        console.log(`Tx Hash\t\t: ${tx.hash.slice(0, 10)}...`);
        
        // Menunggu transaksi dikonfirmasi
        await tx.wait();
        console.log("Status\t\t: \x1b[32m%s\x1b[0m", "Transaction confirmed\n");
    } catch (error) {
        console.error("Status\t\t: \x1b[31m%s\x1b[0m", "Error!\n", error);
    }
}

async function performSwaps() {
    while (true) {
        await logStatus();
        try {
            await swapARTtoUSDT();
            await new Promise(resolve => setTimeout(resolve, 5000));

            await swapUSDTtoART();
            await new Promise(resolve => setTimeout(resolve, 5000));
        } catch (error) {
            console.error("Status\t\t: \x1b[31m%s\x1b[0m", "Error! Retrying...\n", error);
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    }
}

performSwaps();
                                                  
