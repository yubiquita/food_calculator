<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useToastStore } from '../stores'
import ToastNotification from './ToastNotification.vue'

const toastStore = useToastStore()
const { visibleToasts } = storeToRefs(toastStore)
</script>

<template>
  <div class="toast-container">
    <TransitionGroup name="toast" tag="div">
      <ToastNotification
        v-for="toast in visibleToasts"
        :key="toast.id"
        :toast="toast"
        @remove="toastStore.removeToast"
      />
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  pointer-events: none;
}

/* トランジションアニメーション */
.toast-enter-active {
  transition: all 0.4s ease-out;
}

.toast-leave-active {
  transition: all 0.4s ease-in;
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

.toast-move {
  transition: transform 0.3s ease;
}

/* モバイル対応 */
@media (max-width: 480px) {
  .toast-container {
    top: 10px;
    right: 10px;
    left: 10px;
  }
}
</style>