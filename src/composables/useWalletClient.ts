import { PrivateKeyAccount, createWalletClient, http, WalletClient } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

import { web3auth, getPrivateKey } from '@/composables/useWeb3Auth'
import { SafeEventEmitterProvider } from '@web3auth/base';

import {
  chain,
  bundlerUrl
} from '@/config'


// State

let walletClient: WalletClient
let account: PrivateKeyAccount | null = null

// Functions

const walletClientInit = async () => {
  if (web3auth === null) {
    console.error('signer init error: web3Auth not initialized');
    return
  }

  try {
    const privateKey = await getPrivateKey(web3auth.provider as SafeEventEmitterProvider);
    account = privateKeyToAccount(`0x${privateKey}`);

    walletClient = createWalletClient({
      account: account,
      chain: chain,
      transport: http(bundlerUrl)
    });

  } catch (error) {
    console.error('walletClient init error:', error);
  }

  if (!walletClient) {
    console.error('walletClient init error: walletClient not initialized');
    return
  }
};

const walletGetWalletAddress = async () => {
  if (!walletClient) {
    console.error('signer get wallet address error: signer not initialized');
    return
  }
  const [address] = await walletClient.getAddresses()
  return address
}

const walletSignMessage = async (nonce: string) => {
  if (!walletClient) {
    console.error('signer sign message error: signer not initialized');
    return
  }

  return await walletClient.signMessage({
    account: account as PrivateKeyAccount,
    message: nonce
  })
};

export { walletClient, walletClientInit, walletGetWalletAddress, walletSignMessage }
