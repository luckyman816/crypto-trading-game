<template>
  <router-view />

  <component v-for="{ id, type, data } in modalStore.active" :key="`modal-${id}`" :id="id" :is="modals[type]" v-bind="data" />
</template>

<script setup lang="ts">
import { defineComponent, watch, onMounted, onBeforeMount } from 'vue'

import { web3AuthInit, isWeb3AuthConnected } from '@/composables/useWeb3Auth'
import { smartAccountInit, smartWalletSynchAllowance, smartWalletSendSmartWalletAddress, smartWalletGetBalance } from '@/composables/useSmartWallet'
import { walletClientInit } from '@/composables/useWalletClient'
import { publicClientInit } from '@/composables/usePublicClient'
import ModalInformation from "@/components/modals/ModalInformation.vue";
import ModalConfirmation from "@/components/modals/ModalConfirmation.vue";
import ModalLoading from "@/components/modals/ModalLoading.vue";
import ModalSignIn from "@/components/modals/ModalSignIn.vue";
import ModalStatus from "@/components/modals/ModalStatus.vue";
import ModalTopUp from "@/components/modals/ModalTopUp.vue";
import ModalTopUpCrypto from "@/components/modals/ModalTopUpCrypto.vue";
import ModalUserSettings from "@/components/modals/ModalUserSettings.vue";

import { useUserStore } from '@store/user'
import { useModalStore, type ModalType } from "@store/modal.ts"; 
import { useBaseStore } from './store/base'

// Use the plugin in your Vue app
// Stores

const userStore = useUserStore()
const modalStore = useModalStore()
const baseStore = useBaseStore()

// Constants

const modals: Record<ModalType, ReturnType<typeof defineComponent>> = {
  information: ModalInformation,
  confirmation: ModalConfirmation,
  loading: ModalLoading,
  signIn: ModalSignIn,
  status: ModalStatus,
  topUp: ModalTopUp,
  topUpCrypto: ModalTopUpCrypto,
  userSettings: ModalUserSettings,
}

// Watchers

watch(isWeb3AuthConnected, async (newValue) => {
  console.log('isWeb3AuthConnected watcher', newValue)
  if (newValue) {
    userStore.authStart()
    if (modalStore.isOpen('web3AuthSignInLoading')) modalStore.open({ id: 'appAuthLoading', type: 'loading' })
    await userStore.getWeb3AuthUserData()
    await walletClientInit(),
    await publicClientInit(),
    await userStore.getSignerWalletAddress()
    await smartAccountInit()
    await userStore.getSmartWalletAddress()
    if (!userStore.isLoggedIn) {
      await userStore.login()
      await userStore.verify()
      await userStore.getProfile();
    }
    await smartWalletGetBalance()

    modalStore.close('appAuthLoading')

    smartWalletSynchAllowance()
    
    if (!userStore.profile.smart_wallet_address) smartWalletSendSmartWalletAddress()
    userStore.authEnd()
  } else {
    userStore.authEnd()
    await userStore.logout()
  }
});

// Initialization

onMounted(async () => {
  await userStore.getProfile();
  await web3AuthInit();

  // if web3auth is connected, watch runs
  if (!isWeb3AuthConnected.value && userStore.isLoggedIn) await userStore.logout()
});

onBeforeMount(async () => {
  await Promise.all([
    baseStore.FETCH_SERVER_TIME(),
  ])
})

</script>

<style lang="scss">
  @import '@/assets/scss/main';
  body {
    overflow: hidden;
  }
</style>
