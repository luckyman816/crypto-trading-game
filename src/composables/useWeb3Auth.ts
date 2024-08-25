import { ref, watchEffect } from 'vue';
import { Web3AuthNoModal } from '@web3auth/no-modal'
import { IProvider, WALLET_ADAPTERS, SafeEventEmitterProvider } from '@web3auth/base'
import { EthereumPrivateKeyProvider } from '@web3auth/ethereum-provider'
import { OpenloginAdapter, type OpenloginUserInfo } from '@web3auth/openlogin-adapter'
import {
  clientId,
  chainConfig,
  web3AuthNetwork,
} from '@/config'
// Types
type UX_MODE_TYPE = 'popup' | 'redirect';
export type SocialProvider = 'google' | 'facebook'
export type Web3UserInfo = Partial<OpenloginUserInfo>

// Create a reactive variable to store the type of window
const isMobile = ref(false);
const ux_Mode = ref<UX_MODE_TYPE>('popup');

// Configure web3auth
const detectWindowType = () => {
  isMobile.value = window.innerWidth < 600 ? true : false; // Adjust the threshold as needed
  ux_Mode.value = isMobile.value ? 'redirect' : 'popup';
  openloginAdapter.setAdapterSettings({ uxMode: ux_Mode.value });
};
// Call the detectWindowType function when the component is mounted
const privateKeyProvider = new EthereumPrivateKeyProvider({ config: { chainConfig } });
const openloginAdapter = new OpenloginAdapter({
  privateKeyProvider: privateKeyProvider,
  adapterSettings: {
    network: "sapphire_mainnet",
    uxMode: ux_Mode.value,
    clientId,
  }
});
const web3auth = new Web3AuthNoModal({
  clientId,
  chainConfig,
  web3AuthNetwork,
});
watchEffect(() => {
  detectWindowType();
});
window.addEventListener('resize', detectWindowType);

web3auth.configureAdapter(openloginAdapter);

let web3AuthProvider = ref<IProvider | null>(null);
const isWeb3AuthConnected = ref(false);

// Functions

const web3AuthInit = async () => {
  try {
    await web3auth.init();
    web3AuthProvider.value = web3auth.provider;
    
    if (web3auth.connected) {
      isWeb3AuthConnected.value = true;
    }
  } catch (error) {
    console.error('web3Auth init error:', error);
  }
};

const web3AuthLogin = async (socialProvider: SocialProvider) => {
  try {
    web3AuthProvider.value = await web3auth.connectTo(WALLET_ADAPTERS.OPENLOGIN, {
      loginProvider: socialProvider,
    });
  } catch (error) {
    console.error('web3Auth connect error:', error);
  }
  if (web3auth.connected) {
    isWeb3AuthConnected.value = true;
  }
};

const web3AuthLogout = async () => {
  try {
    await web3auth.logout();

    web3AuthProvider.value = null;
    isWeb3AuthConnected.value = false;
  } catch (error) {
    console.error('web3Auth logout error:', error);
  }
};

const getPrivateKey = async (provider: SafeEventEmitterProvider) => {
  return (await provider.request({
    method: "private_key",
  })) as string;
};

const web3AuthGetUserInfo = async () => web3auth.getUserInfo();

export { 
  web3auth, isWeb3AuthConnected, web3AuthInit, 
  web3AuthLogin, web3AuthLogout, web3AuthGetUserInfo,
  getPrivateKey
}
