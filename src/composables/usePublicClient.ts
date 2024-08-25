import { PublicClient, createPublicClient, http } from 'viem'


import {
  chain,
  rpcUrl,
  bundlerUrl
} from '@/config'


// State

let publicClient: PublicClient
let bundlerClient: PublicClient

// Functions

const publicClientInit = async () => {

  try {

    publicClient = createPublicClient({
        batch: {
            multicall: true, 
        },
        chain: chain,
        transport: http(rpcUrl)
    });

    bundlerClient = createPublicClient({
        batch: {
            multicall: true, 
        },
        chain: chain,
        transport: http(bundlerUrl)
    });


  } catch (error) {
    console.error('publicClient init error:', error);
  }

  if (!publicClient) {
    console.error('publicClient init error: walletClient not initialized');
    return
  }
};

export { publicClient, bundlerClient,  publicClientInit }
