import { createApp } from 'vue'
import App from './App.vue'
import router from './utils/router.ts'

import './assets/css/base.css'
import './assets/css/home.css'

createApp(App).use(router).mount('#app')