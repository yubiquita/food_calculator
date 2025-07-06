<script setup lang="ts">
import { onMounted } from 'vue'
import FoodCalculator from './components/FoodCalculator.vue'
import ToastContainer from './components/ToastContainer.vue'
import { useAppStore } from './stores'

const appStore = useAppStore()

onMounted(async () => {
  // アプリケーションが既に初期化されていない場合のみ初期化
  if (!appStore.initialized) {
    await appStore.initialize()
  }
})
</script>

<template>
  <div id="app">
    <FoodCalculator />
    <ToastContainer />
  </div>
</template>

<style>
/* グローバルスタイル */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* CSS Variables for Theme */
:root {
  --bg-color: #f5f5f5;
  --card-bg: #ffffff;
  --text-color: #333333;
  --header-text: #2c3e50;
  --border-color: #dddddd;
  --shadow: rgba(0, 0, 0, 0.1);
  --modal-bg: #ffffff;
  --modal-overlay: rgba(0, 0, 0, 0.5);
  --history-bg: #f8f9fa;
  --history-border: #bdc3c7;
  --calculation-bg: #ecf0f1;
  --input-bg: #ffffff;
  --dish-item-bg: #ffffff;
  --dish-item-border: #eeeeee;
  --warning-text: #555555;
  --toast-bg: #fff3cd;
  --toast-border: #ffeaa7;
  --toast-text: #856404;
  --success-color: #27ae60;
  --history-header-color: #7f8c8d;
  --history-text-color: #95a5a6;
  --history-time-color: #bdc3c7;
  --secondary-text-color: #666666;
  --close-hover-color: #000000;
}

[data-theme="dark"] {
  --bg-color: #1a1a1a;
  --card-bg: #2d2d2d;
  --text-color: #e0e0e0;
  --header-text: #f0f0f0;
  --border-color: #404040;
  --shadow: rgba(0, 0, 0, 0.3);
  --modal-bg: #2d2d2d;
  --modal-overlay: rgba(0, 0, 0, 0.7);
  --history-bg: #3a3a3a;
  --history-border: #505050;
  --calculation-bg: #3a3a3a;
  --input-bg: #404040;
  --dish-item-bg: #3a3a3a;
  --dish-item-border: #505050;
  --warning-text: #f0f0f0;
  --toast-bg: #664d03;
  --toast-border: #997404;
  --toast-text: #fff3cd;
  --success-color: #2ecc71;
  --history-header-color: #95a5a6;
  --history-text-color: #bdc3c7;
  --history-time-color: #95a5a6;
  --secondary-text-color: #b0b0b0;
  --close-hover-color: #f0f0f0;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: var(--bg-color);
  color: var(--text-color);
  transition: background-color 0.3s ease, color 0.3s ease;
}

#app {
  min-height: 100vh;
}
</style>
