<script setup lang="ts">
import { computed } from 'vue'

// Props定義
const props = defineProps<{
  show: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
}>()

// Emits定義
const emit = defineEmits<{
  'update:show': [value: boolean]
  confirm: []
  cancel: []
}>()

// デフォルト値
const confirmTextDisplay = computed(() => props.confirmText || '確認')
const cancelTextDisplay = computed(() => props.cancelText || 'キャンセル')

// モーダルを閉じる
const handleClose = () => {
  emit('update:show', false)
}

// キャンセル
const handleCancel = () => {
  emit('cancel')
  handleClose()
}

// 確認
const handleConfirm = () => {
  emit('confirm')
  handleClose()
}

// 背景クリックでモーダルを閉じる
const handleBackdropClick = (event: Event) => {
  if (event.target === event.currentTarget) {
    handleClose()
  }
}

// ESCキーでモーダルを閉じる
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    handleClose()
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="show"
        class="modal-overlay"
        @click="handleBackdropClick"
        @keydown="handleKeydown"
      >
        <div class="modal-content" role="dialog" aria-modal="true">
          <!-- ヘッダー -->
          <div class="modal-header">
            <h2>{{ title }}</h2>
            <button
              class="modal-close"
              @click="handleClose"
              aria-label="モーダルを閉じる"
            >
              ×
            </button>
          </div>

          <!-- ボディ -->
          <div class="modal-body">
            <p class="warning-message">{{ message }}</p>
          </div>

          <!-- フッター -->
          <div class="modal-footer">
            <button class="btn-secondary" @click="handleCancel">
              {{ cancelTextDisplay }}
            </button>
            <button class="btn-danger" @click="handleConfirm">
              {{ confirmTextDisplay }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--modal-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: var(--modal-bg);
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  max-width: 400px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 20px 0 20px;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 20px;
}

.modal-header h2 {
  margin: 0;
  color: var(--header-text);
  font-size: 18px;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--text-color);
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.3s ease, color 0.3s ease;
}

.modal-close:hover {
  background-color: var(--history-bg);
  color: var(--close-hover-color);
}

.modal-body {
  padding: 0 20px 20px;
}

.warning-message {
  color: var(--warning-text);
  line-height: 1.5;
  white-space: pre-line;
}

.modal-footer {
  padding: 0 20px 20px;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s ease;
}

.btn-secondary:hover {
  background: #7f8c8d;
}

.btn-danger {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s ease;
}

.btn-danger:hover {
  background: #c0392b;
}

/* モーダルトランジション */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: transform 0.3s ease;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.9) translateY(-20px);
}

/* モバイル対応 */
@media (max-width: 480px) {
  .modal-overlay {
    padding: 10px;
  }
  
  .modal-content {
    max-width: none;
  }
  
  .modal-footer {
    flex-direction: column;
  }
  
  .btn-secondary,
  .btn-danger {
    padding: 12px;
    font-size: 16px;
  }
}
</style>