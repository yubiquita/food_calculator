import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { useAppStore } from './stores'

// Piniaインスタンスを作成
const pinia = createPinia()

// Vueアプリケーションを作成
const app = createApp(App)

// Piniaを登録
app.use(pinia)

// アプリケーションをマウント
app.mount('#app')

// アプリケーションの初期化
const appStore = useAppStore()
appStore.initialize()
