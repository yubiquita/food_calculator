<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import type { ToastNotification } from '../types'

// Props定義
const props = defineProps<{
  toast: ToastNotification
}>()

// Emits定義
const emit = defineEmits<{
  remove: [id: string]
}>()

let autoHideTimer: number | null = null

// 自動削除タイマーを設定
const scheduleAutoHide = () => {
  if (props.toast.duration && props.toast.duration > 0) {
    autoHideTimer = setTimeout(() => {
      emit('remove', props.toast.id)
    }, props.toast.duration) as unknown as number
  }
}

// 手動で閉じる
const handleClose = () => {
  emit('remove', props.toast.id)
}

// ライフサイクル
onMounted(() => {
  scheduleAutoHide()
})

onUnmounted(() => {
  if (autoHideTimer) {
    clearTimeout(autoHideTimer)
  }
})
</script>

<template>
  <div 
    class="toast-notification"
    :class="[`toast-${toast.type}`]"
    role="alert"
    aria-live="polite"
  >
    <div class="toast-content">
      <span class="toast-message">{{ toast.message }}</span>
      <button 
        class="toast-close"
        @click="handleClose"
        aria-label="通知を閉じる"
      >
        ×
      </button>
    </div>
  </div>
</template>

<style scoped>
.toast-notification {
  background: var(--toast-bg);
  border: 1px solid var(--toast-border);
  border-radius: 6px;
  padding: 12px 16px;
  margin-bottom: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  pointer-events: auto;
  max-width: 300px;
  word-wrap: break-word;
}

.toast-content {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.toast-message {
  flex: 1;
  color: var(--toast-text);
  font-size: 14px;
  line-height: 1.4;
}

.toast-close {
  background: none;
  border: none;
  color: var(--toast-text);
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  transition: background-color 0.3s ease;
  flex-shrink: 0;
}

.toast-close:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

/* トーストタイプ別のスタイル */
.toast-success {
  --toast-bg: #d4edda;
  --toast-border: #c3e6cb;
  --toast-text: #155724;
}

.toast-error {
  --toast-bg: #f8d7da;
  --toast-border: #f5c6cb;
  --toast-text: #721c24;
}

.toast-warning {
  --toast-bg: #fff3cd;
  --toast-border: #ffeaa7;
  --toast-text: #856404;
}

.toast-info {
  --toast-bg: #d1ecf1;
  --toast-border: #bee5eb;
  --toast-text: #0c5460;
}

/* ダークテーマ対応 */
[data-theme="dark"] .toast-success {
  --toast-bg: #1e3a2e;
  --toast-border: #28a745;
  --toast-text: #d4edda;
}

[data-theme="dark"] .toast-error {
  --toast-bg: #3a1e1e;
  --toast-border: #dc3545;
  --toast-text: #f8d7da;
}

[data-theme="dark"] .toast-warning {
  --toast-bg: #664d03;
  --toast-border: #997404;
  --toast-text: #fff3cd;
}

[data-theme="dark"] .toast-info {
  --toast-bg: #1e2a3a;
  --toast-border: #17a2b8;
  --toast-text: #d1ecf1;
}

/* モバイル対応 */
@media (max-width: 480px) {
  .toast-notification {
    max-width: none;
    width: 100%;
  }
  
  .toast-message {
    font-size: 16px;
  }
  
  .toast-close {
    width: 24px;
    height: 24px;
    font-size: 18px;
  }
}
</style>