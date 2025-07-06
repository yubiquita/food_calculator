<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useThemeStore, useFoodStore } from '../stores'

// Emits定義
const emit = defineEmits<{
  addFood: []
  clearAll: []
  dishSettings: []
}>()

const themeStore = useThemeStore()
const foodStore = useFoodStore()

const { themeButtonInfo } = storeToRefs(themeStore)
const { foodCount } = storeToRefs(foodStore)

// 全削除ボタンの無効化状態
const clearAllDisabled = computed(() => foodCount.value === 0)

// テーマ切り替え
const handleToggleTheme = () => {
  themeStore.toggleTheme()
}
</script>

<template>
  <header class="header">
    <!-- テーマ切り替えボタン -->
    <button class="theme-toggle" @click="handleToggleTheme">
      <span class="theme-icon">{{ themeButtonInfo.icon }}</span>
      <span class="theme-text">{{ themeButtonInfo.text }}</span>
    </button>

    <!-- タイトル -->
    <h1>料理重量計算</h1>

    <!-- ヘッダーボタン -->
    <div class="header-buttons">
      <button class="btn-primary" @click="emit('addFood')">
        +新規
      </button>
      <button 
        class="btn-danger" 
        :disabled="clearAllDisabled"
        @click="emit('clearAll')"
      >
        全削除
      </button>
      <button class="btn-secondary" @click="emit('dishSettings')">
        食器設定
      </button>
    </div>
  </header>
</template>

<style scoped>
.header {
  background: var(--card-bg);
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 10px var(--shadow);
  transition: background-color 0.3s ease, box-shadow 0.3s ease;
  position: relative;
}

.theme-toggle {
  position: absolute;
  top: 20px;
  left: 20px;
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 12px;
  border-radius: 6px;
  transition: background-color 0.3s ease;
  color: var(--text-color);
}

.theme-toggle:hover {
  background-color: var(--history-bg);
}

.theme-icon {
  font-size: 16px;
}

.theme-text {
  font-size: 12px;
  font-weight: 500;
}

.header h1 {
  margin-bottom: 15px;
  color: var(--header-text);
  text-align: center;
  transition: color 0.3s ease;
}

.header-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.btn-primary {
  background: #3498db;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s ease;
}

.btn-primary:hover {
  background: #2980b9;
}

.btn-danger {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s ease, opacity 0.3s ease;
}

.btn-danger:hover:not(:disabled) {
  background: #c0392b;
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s ease;
}

.btn-secondary:hover {
  background: #7f8c8d;
}

/* モバイル対応 */
@media (max-width: 480px) {
  .header {
    padding: 15px;
  }
  
  .theme-toggle {
    top: 15px;
    left: 15px;
    padding: 6px 10px;
  }
  
  .theme-icon {
    font-size: 14px;
  }
  
  .theme-text {
    font-size: 11px;
  }
  
  .header h1 {
    font-size: 20px;
    margin-bottom: 12px;
  }
  
  .header-buttons {
    flex-direction: column;
    gap: 8px;
  }
  
  .btn-primary,
  .btn-danger,
  .btn-secondary {
    padding: 12px;
    font-size: 16px;
  }
}
</style>