import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { pinia } from './plugins/pinia'
import * as Sentry from "@sentry/vue";

import { clickOutside } from './directives/clickOutside.js'

import { sentryDsn } from '@/config'
import { getViewport } from './utils/getViewport.js';
import VueMobileDetection from "vue-mobile-detection";
const app = createApp(App).use(router).use(pinia).use(VueMobileDetection)
app.directive('click-outside', clickOutside) 

Sentry.init({
  app, 
  dsn: sentryDsn,
  integrations: [
    Sentry.browserTracingIntegration({ router }),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 1.0,
  tracePropagationTargets: ["localhost", /^https:\/\/dev-backend.tradeupdown.com\.com/, /^https:\/\/api.tradeupdown.com\.com/],
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0
});

app.mount('#app')
getViewport()