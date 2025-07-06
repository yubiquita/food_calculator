<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useDishStore } from '../stores'

// Props定義
defineProps<{
  show: boolean
}>()

// Emits定義
const emit = defineEmits<{
  'update:show': [value: boolean]
  change: []
}>()

const dishStore = useDishStore()
const { dishes } = storeToRefs(dishStore)

// フォームの状態
const dishName = ref('')
const dishWeight = ref('')

// フォームのバリデーション
const isFormValid = computed(() => {
  return dishName.value.trim() && 
         dishWeight.value && 
         parseFloat(dishWeight.value) > 0
})

// モーダルを閉じる
const handleClose = () => {
  emit('update:show', false)
}

// 背景クリックでモーダルを閉じる
const handleBackdropClick = (event: Event) => {
  if (event.target === event.currentTarget) {
    handleClose()
  }
}

// フォーム送信
const handleSubmit = (event: Event) => {
  event.preventDefault()
  
  if (!isFormValid.value) return

  const success = dishStore.addDish(dishName.value, dishWeight.value)
  
  if (success) {
    // フォームをリセット
    dishName.value = ''
    dishWeight.value = ''
    emit('change')
  }
}

// 食器を削除
const handleDeleteDish = (index: number) => {
  dishStore.deleteDish(index)
  emit('change')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="show"
        class="modal-overlay"
        @click="handleBackdropClick"
      >
        <div class="modal-content" role="dialog" aria-modal="true">
          <!-- ヘッダー -->
          <div class="modal-header">
            <h2>食器設定</h2>
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
            <!-- 食器追加フォーム -->
            <form @submit="handleSubmit">
              <div class="form-group">
                <input
                  v-model="dishName"
                  type="text"
                  placeholder="食器の名前"
                  required
                  class="form-input"
                />
              </div>
              <div class="form-group">
                <input
                  v-model="dishWeight"
                  type="number"
                  placeholder="重量(g)"
                  required
                  min="0.1"
                  step="0.1"
                  class="form-input"
                />
              </div>
              <button 
                type="submit" 
                class="btn-primary"
                :disabled="!isFormValid"
              >
                追加
              </button>
            </form>

            <!-- 食器一覧 -->
            <div v-if="dishes.length > 0" class="dish-list">
              <div
                v-for="(dish, index) in dishes"
                :key="index"
                class="dish-item"
              >
                <div class="dish-item-info">
                  <div class="dish-item-name">{{ dish.name }}</div>
                  <div class="dish-item-weight">{{ dish.weight }}g</div>
                </div>
                <button 
                  class="dish-delete-btn"
                  @click="handleDeleteDish(index)"
                >
                  削除
                </button>
              </div>
            </div>

            <div v-else class="empty-state">
              食器が登録されていません
            </div>
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
  max-width: 500px;
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

.form-group {
  margin-bottom: 15px;
}

.form-input {
  width: 100%;
  background: var(--input-bg);
  border: 1px solid var(--border-color);
  border-radius: 5px;
  padding: 10px 12px;
  font-size: 16px;
  color: var(--text-color);
  transition: border-color 0.3s ease, background-color 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: #3498db;
}

.btn-primary {
  background: #3498db;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  width: 100%;
  transition: background-color 0.3s ease;
}

.btn-primary:hover:not(:disabled) {
  background: #2980b9;
}

.btn-primary:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.dish-list {
  margin-top: 20px;
  border-top: 1px solid var(--border-color);
  padding-top: 15px;
}

.dish-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: var(--dish-item-bg);
  border: 1px solid var(--dish-item-border);
  border-radius: 5px;
  margin-bottom: 8px;
  transition: background-color 0.3s ease;
}

.dish-item:hover {
  background-color: var(--history-bg);
}

.dish-item-info {
  flex: 1;
}

.dish-item-name {
  font-weight: 500;
  color: var(--text-color);
  margin-bottom: 2px;
}

.dish-item-weight {
  font-size: 12px;
  color: var(--secondary-text-color);
}

.dish-delete-btn {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.3s ease;
}

.dish-delete-btn:hover {
  background: #c0392b;
}

.empty-state {
  text-align: center;
  padding: 20px;
  color: var(--secondary-text-color);
  font-style: italic;
  margin-top: 20px;
  border-top: 1px solid var(--border-color);
  padding-top: 15px;
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
  
  .form-input {
    padding: 12px;
    font-size: 16px;
  }
  
  .btn-primary {
    padding: 12px;
    font-size: 16px;
  }
  
  .dish-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .dish-delete-btn {
    align-self: flex-end;
    padding: 8px 16px;
    font-size: 14px;
  }
}
</style>