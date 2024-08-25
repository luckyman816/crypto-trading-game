import { ref} from 'vue'
import { 
  encodeFunctionData,
  parseUnits,
  formatUnits,
  getContract
} from 'viem';
import { V06 } from "userop";
import { storeSmartWalletAddress } from '@/api/user'

import { walletClient } from './useWalletClient';
import { publicClient, bundlerClient } from './usePublicClient';

import {
  tokenAddress,
  contractAddress,
  allowanceAmount,
  tokenDecimals,
  poolId,
  defaultBetAmount,
  paymasterUrl,
} from '@/config'
import erc20Abi from '@/abis/abi-erc20.json';
import tradeAbi from '@/abis/abi-trade.json';



// Constants
let smartAccount: V06.Account.Instance<any, any> | null = null;
let tokenContract: any | null = null
let getBalanceInterval = ref<NodeJS.Timeout | null>(null)

// State

const selectedBetAmount = ref<number>(defaultBetAmount)
const smartWalletAddress = ref<string | null>(null)
const smartWalletBalance = ref<string | null>(null)

// Functions

const smartAccountInit = async () => {
  if (walletClient === null) {
    console.error('smart account init error: signer not initialized');
    return
  }

  try {
    smartAccount = new V06.Account.Instance({
      ...V06.Account.Common.SimpleAccount.base(
        publicClient,
        // @ts-ignore
        walletClient,
      ),
      bundlerClient: bundlerClient,
      requestPaymaster: V06.Account.Hooks.RequestPaymaster.withCommon({
        variant: "stackupV1",
        parameters: {
          rpcUrl: paymasterUrl,
          type: "payg",
          },
      }),
      waitTimeoutMs: 300,
    })

    tokenContract = getContract({
      address: tokenAddress,
      abi: erc20Abi,
      client: publicClient,
    })

  } catch (error) {
    console.error('smart account init error:', error);
    return
  }
}

const smartWalletGetAddress = async () => {
  if (!walletClient) {
    console.error('smart wallet get address error: smart wallet provider not initialized');
    return
  }
  const address = await smartAccount?.getSender();
  console.log('smart wallet address:', address)
  smartWalletAddress.value = address ?? null
  return address
}

const smartWalletSynchAllowance = async () => {
  const allowance = await smartWalletGetAllowance()

  if (allowance === '0') await smartWalletSetAllowance()
}

const smartWalletGetAllowance = async () => {
  try {
    if (!tokenContract) {
      console.error('smart wallet get allowance error: token contract not initialized');
      return
    }

    const allowance = await tokenContract.read.allowance([
      smartWalletAddress.value,
      contractAddress
    ])
    console.log('allowance:', allowance.toString())

    if (typeof allowance === 'undefined') {
      console.error('smart wallet get allowance error: no allowance provided');
      return
    }

    return allowance.toString()
  } catch (error) {
    console.error('smart wallet get allowance error:', error);
  }
}

const smartWalletSetAllowance = async () => {
  if (!smartAccount) {
    console.error('smartWalletSetAllowance error: smart account not initialized');
    return
  }

  try {
    const callData = encodeFunctionData({
      abi: erc20Abi,
      functionName: 'approve',
      args: [contractAddress, parseUnits(String(allowanceAmount), tokenDecimals)],
    });

    const userOpResponse = await smartAccount.encodeCallData("execute", [
      tokenAddress,
      0,
      callData
    ]).sendUserOperation();
    console.log('User Operation sent:', userOpResponse);

    const receipt = await userOpResponse.wait();
    console.log('User Operation receipt:', receipt);

  } catch (error) {
    console.error('smart wallet set allowance error:', error);
  }
}

const smartWalletSendSmartWalletAddress = async () => {
  if (!smartWalletAddress.value) {
    console.error('store smart wallet address error: smart wallet address is empty');
    return
  }

  try {
    await storeSmartWalletAddress(smartWalletAddress.value)
  } catch (error) {
    console.error('store smart wallet address error:', error)
  }
}

const smartWalletGetBalance = async () => {
  if (!smartWalletAddress.value) {
    console.error('smart wallet get balance error: smart wallet address is empty');
    return
  }

  if (!tokenContract) {
    console.error('smart wallet get balance error: token contract not initialized');
    return
  }

  if(getBalanceInterval.value) clearInterval(getBalanceInterval.value)

  getBalanceInterval.value = null

  smartWalletBalance.value = formatUnits(
    await tokenContract.read.balanceOf([smartWalletAddress.value]),
    tokenDecimals
  );

  getBalanceInterval.value = setInterval(smartWalletGetBalance, 5000)
};

const smartWalletMakeTrade = async (isUp: boolean) => {
  if (!smartAccount) {
    console.error('make trade error: smart wallet provider not initialized');
    return
  }

  if (!smartWalletAddress.value) {
    console.error('smart wallet get balance error: smart wallet address is empty');
    return
  }

  try {
    const tradeData = {
      poolId: poolId,
      upOrDown: isUp,
      bet: parseUnits(String(selectedBetAmount.value), tokenDecimals),
    };

    const uoMakeTradeData = encodeFunctionData({
      abi: tradeAbi,
      functionName: 'makeTrade',
      args: [tradeData],
    });

    const userOpHash = await smartAccount.encodeCallData("execute", [
      contractAddress,
      0,
      uoMakeTradeData
    ]).sendUserOperation();

    console.log('User Operation sent:', userOpHash);

    const receipt = await userOpHash.wait();
    console.log('User Operation receipt:', receipt);

    smartWalletGetBalance()
  } catch (error) {
    console.error('Make trade error:', error)
  }
}

const smartWalletTransfer = async (amt: String, to: String) => {
  if (!smartAccount) {
    console.error('Transfer error: smart wallet provider not initialized');
    return
  }

  if (!smartWalletAddress.value) {
    console.error('smart wallet get balance error: smart wallet address is empty');
    return
  }

  try {
    const amount = parseUnits(String(amt), tokenDecimals);
    const callData = encodeFunctionData({
      abi: erc20Abi,
      functionName: 'transfer',
      args: [to, amount],
    });

    const userOpResponse = await smartAccount.encodeCallData("execute", [
      tokenAddress,
      0,
      callData
    ]).sendUserOperation();
    console.log('User Operation sent:', userOpResponse);

    const receipt = await userOpResponse.wait();
    console.log('User Operation receipt:', receipt);

  } catch (error) {
    console.error('smart wallet transfer error:', error);
  }
}

export {
  selectedBetAmount,
  smartWalletAddress,
  smartWalletBalance,
  smartAccountInit,
  smartWalletGetAddress,
  smartWalletGetAllowance,
  smartWalletSynchAllowance,
  smartWalletSendSmartWalletAddress,
  smartWalletGetBalance,
  smartWalletMakeTrade,
  smartWalletTransfer,
}
