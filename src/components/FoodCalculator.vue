<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import FoodCard from './FoodCard.vue'
import DishSettingsModal from './DishSettingsModal.vue'
import ConfirmModal from './ConfirmModal.vue'
import AppHeader from './AppHeader.vue'
import { useFoodStore, useAppStore } from '../stores'

const foodStore = useFoodStore()
const appStore = useAppStore()

const { foods } = storeToRefs(foodStore)
const { loading } = storeToRefs(appStore)

// 全削除確認モーダルの表示状態
const showConfirmModal = ref(false)

// 食器設定モーダルの表示状態
const showDishModal = ref(false)

// 新しい食品を追加
const handleAddFood = () => {
  foodStore.addNewFood()
  appStore.saveAppData()
}

// 全削除確認モーダルを表示
const handleShowConfirmModal = () => {
  if (foods.value.length === 0) return
  showConfirmModal.value = true
}

// 全削除を実行
const handleConfirmClearAll = () => {
  foodStore.clearAllFoods()
  appStore.saveAppData()
  showConfirmModal.value = false
}

// 食器設定モーダルを表示
const handleShowDishSettings = () => {
  showDishModal.value = true
}

// データ変更時の自動保存
const handleDataChange = () => {
  appStore.saveAppData()
}
</script>

<template>
  <div class="container">
    <!-- ヘッダー -->
    <AppHeader 
      @add-food="handleAddFood"
      @clear-all="handleShowConfirmModal"
      @dish-settings="handleShowDishSettings"
    />

    <!-- メインコンテンツ -->
    <main class="main">
      <div v-if="loading" class="loading">
        読み込み中...
      </div>
      
      <div v-else class="food-cards">
        <FoodCard
          v-for="food in foods.slice().reverse()"
          :key="food.id"
          :food="food"
          @change="handleDataChange"
        />
        
        <div v-if="foods.length === 0" class="empty-state">
          食品を追加してください
        </div>
      </div>
    </main>

    <!-- 食器設定モーダル -->
    <DishSettingsModal
      v-model:show="showDishModal"
      @change="handleDataChange"
    />

    <!-- 全削除確認モーダル -->
    <ConfirmModal
      v-model:show="showConfirmModal"
      title="全削除の確認"
      :message="'すべての料理データを削除します。\nこの操作は取り消せません。'"
      confirm-text="削除"
      cancel-text="キャンセル"
      @confirm="handleConfirmClearAll"
    />
  </div>
</template>

<style scoped>
.container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.main {
  margin-top: 20px;
}

.food-cards {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.loading {
  text-align: center;
  padding: 40px;
  color: var(--secondary-text-color);
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: var(--secondary-text-color);
  font-style: italic;
}
</style>