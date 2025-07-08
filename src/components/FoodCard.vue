<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import type { Food } from '../types'
import { useFoodStore, useDishStore } from '../stores'
import { useSwipe, useClipboard } from '../composables'
import { formatWeight } from '../utils'

// Props定義
const props = defineProps<{
  food: Food
}>()

// Emits定義
const emit = defineEmits<{
  change: []
}>()

const foodStore = useFoodStore()
const dishStore = useDishStore()
const { copyWeight } = useClipboard()

const { foods } = storeToRefs(foodStore)
const { getDishOptions } = storeToRefs(dishStore)

// 食器オプションを取得
const dishOptions = computed(() => getDishOptions.value)

// 参照要素
const cardElement = ref<HTMLElement | null>(null)

// 入力値の状態
const weightInput = ref('')
const dishWeightInput = ref('')
const selectedDish = ref('')
const calcSourceId = ref('')
const calcMultiplier = ref('')

// 計算用の食品オプション（自分以外）
const foodOptions = computed(() => 
  foods.value
    .filter(f => f.id !== props.food.id)
    .map(f => ({
      id: f.id,
      name: f.name,
      weight: f.weight
    }))
)

// 履歴があるかどうか
const hasHistory = computed(() => 
  props.food.history && props.food.history.length > 0
)

// スワイプ機能の設定
const { attachListeners, detachListeners } = useSwipe(cardElement, {
  threshold: 80,
  onSwipeLeft: () => {
    if (hasHistory.value) {
      handleUndo()
    }
  }
})

// ライフサイクル
onMounted(() => {
  if (hasHistory.value) {
    attachListeners()
  }
})

onUnmounted(() => {
  detachListeners()
})

// イベントハンドラー
const handleUpdateName = (event: Event) => {
  const target = event.target as HTMLInputElement
  foodStore.updateFoodName(props.food.id, target.value)
  emit('change')
}

const handleNameFocus = (event: Event) => {
  const target = event.target as HTMLInputElement
  target.select()
}

const handleNameKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    const target = event.target as HTMLInputElement
    target.blur()
  }
}

const handleAddWeight = () => {
  if (weightInput.value) {
    foodStore.addWeight(props.food.id, weightInput.value)
    weightInput.value = ''
    emit('change')
  }
}

const handleWeightKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    handleAddWeight()
    const target = event.target as HTMLInputElement
    target.blur()
  }
}

const handleSubtractWeight = () => {
  if (dishWeightInput.value) {
    foodStore.subtractWeight(props.food.id, dishWeightInput.value)
    dishWeightInput.value = ''
    selectedDish.value = ''
    emit('change')
  }
}

const handleDishWeightKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    handleSubtractWeight()
    const target = event.target as HTMLInputElement
    target.blur()
  }
}

const handleDishSelect = (event: Event) => {
  const target = event.target as HTMLSelectElement
  const selectedWeight = target.value
  
  if (selectedWeight) {
    dishWeightInput.value = selectedWeight
    // 自動で重量減算を実行
    foodStore.subtractWeight(props.food.id, selectedWeight)
    dishWeightInput.value = ''
    selectedDish.value = ''
    emit('change')
  }
}

const handleCalculation = () => {
  if (calcSourceId.value && calcMultiplier.value) {
    foodStore.updateCalculation(
      props.food.id, 
      parseInt(calcSourceId.value), 
      calcMultiplier.value
    )
    emit('change')
  }
}

const handleCalculationKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    handleCalculation()
    const target = event.target as HTMLInputElement
    target.blur()
  }
}

const handleDelete = () => {
  foodStore.deleteFood(props.food.id)
  emit('change')
}

const handleUndo = () => {
  foodStore.undoLastOperation(props.food.id)
  emit('change')
}

const handleWeightClick = () => {
  const roundedWeight = Math.round(props.food.weight)
  copyWeight(roundedWeight)
}
</script>

<template>
  <div class="card-container" :data-food-id="food.id">
    <!-- Undo背景 -->
    <div v-if="hasHistory" class="undo-background">
      <div class="undo-icon">⟲</div>
      <div class="undo-text">取り消し</div>
    </div>

    <!-- 食品カード -->
    <div 
      ref="cardElement"
      class="food-card"
      :class="{ swipeable: hasHistory }"
    >
      <!-- カードヘッダー -->
      <div class="food-card-header">
        <input
          type="text"
          class="food-name"
          :value="food.name"
          @input="handleUpdateName"
          @focus="handleNameFocus"
          @keydown="handleNameKeydown"
        />
        <button class="delete-btn" @click="handleDelete">×</button>
      </div>

      <!-- 重量表示 -->
      <div 
        class="weight-display"
        :title="'タップでコピー'"
        @click="handleWeightClick"
      >
        {{ formatWeight(food.weight) }}
      </div>

      <!-- 履歴表示 -->
      <div v-if="hasHistory" class="calculation-history">
        <div class="history-header">履歴</div>
        <div class="history-items">
          <div
            v-for="(item, index) in food.history.slice().reverse()"
            :key="index"
            class="history-item"
          >
            <span class="history-operation">
              <template v-if="item.type === 'add'">
                +{{ Math.round(item.value) }}g
              </template>
              <template v-else-if="item.type === 'subtract'">
                -{{ Math.round(item.value) }}g
              </template>
              <template v-else-if="item.type === 'calculation'">
                ={{ Math.round(item.value) }}g ({{ item.sourceName }} × {{ item.multiplier }})
              </template>
              <template v-else-if="item.type === 'auto_recalculation'">
                🔄{{ Math.round(item.value) }}g ({{ item.sourceName }} × {{ item.multiplier }})
              </template>
            </span>
            <span class="history-time">{{ item.timestamp }}</span>
          </div>
        </div>
      </div>

      <!-- コントロール -->
      <div class="controls">
        <!-- 重量加算 -->
        <div class="control-row">
          <span></span>
          <input
            v-model="weightInput"
            type="number"
            class="weight-input"
            placeholder="重量を入力"
            @keydown="handleWeightKeydown"
          />
          <button class="control-btn add-weight-btn" @click="handleAddWeight">
            +
          </button>
        </div>

        <!-- 食器重量減算 -->
        <div class="control-row">
          <select
            v-model="selectedDish"
            class="dish-select"
            @change="handleDishSelect"
          >
            <option value="">食器選択</option>
            <option
              v-for="dish in dishOptions"
              :key="dish.index"
              :value="dish.weight"
            >
              {{ dish.displayText }}
            </option>
          </select>
          <input
            v-model="dishWeightInput"
            type="number"
            class="dish-weight-input"
            placeholder="食器重量"
            @keydown="handleDishWeightKeydown"
          />
          <button class="control-btn subtract-weight-btn" @click="handleSubtractWeight">
            -
          </button>
        </div>

        <!-- 計算 -->
        <div v-if="foodOptions.length > 0" class="calculation-row">
          <select v-model="calcSourceId" class="calc-source">
            <option value="">食品選択</option>
            <option
              v-for="option in foodOptions"
              :key="option.id"
              :value="option.id"
            >
              {{ option.name }}
            </option>
          </select>
          <input
            v-model="calcMultiplier"
            type="number"
            class="calc-multiplier"
            step="0.1"
            placeholder="× 1.0"
            @keydown="handleCalculationKeydown"
          />
          <button class="control-btn calculate-btn" @click="handleCalculation">
            計算
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card-container {
  position: relative;
  margin-bottom: 15px;
}

.undo-background {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: #e74c3c;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 20px;
  border-radius: 10px;
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 1;
}

.undo-icon {
  font-size: 24px;
  color: white;
  margin-right: 10px;
}

.undo-text {
  color: white;
  font-weight: bold;
}

.food-card {
  background: var(--card-bg);
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 10px var(--shadow);
  transition: transform 0.3s ease-out, background-color 0.3s ease;
  position: relative;
  z-index: 2;
}

.food-card.swipeable {
  cursor: grab;
}

.food-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.food-name {
  flex: 1;
  background: var(--input-bg);
  border: 1px solid var(--border-color);
  border-radius: 5px;
  padding: 8px 12px;
  font-size: 16px;
  color: var(--text-color);
  transition: border-color 0.3s ease, background-color 0.3s ease;
}

.food-name:focus {
  outline: none;
  border-color: #3498db;
}

.delete-btn {
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  cursor: pointer;
  font-size: 16px;
  margin-left: 10px;
  transition: background-color 0.3s ease;
}

.delete-btn:hover {
  background: #c0392b;
}

.weight-display {
  font-size: 24px;
  font-weight: bold;
  text-align: center;
  margin: 15px 0;
  color: var(--success-color);
  cursor: pointer;
  user-select: none;
  padding: 10px;
  border-radius: 5px;
  transition: background-color 0.3s ease;
}

.weight-display:hover {
  background-color: var(--history-bg);
}

.calculation-history {
  background: var(--history-bg);
  border: 1px solid var(--history-border);
  border-radius: 5px;
  padding: 10px;
  margin: 15px 0;
}

.history-header {
  font-weight: bold;
  margin-bottom: 8px;
  color: var(--history-header-color);
}

.history-items {
  max-height: 60px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2px 0;
  font-size: 12px;
}

.history-operation {
  color: var(--history-text-color);
  flex: 1;
}

.history-time {
  color: var(--history-time-color);
  font-size: 10px;
}

.controls {
  display: grid;
  gap: 8px;
}

.control-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
  align-items: center;
}

.calculation-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
  align-items: center;
}



.weight-input,
.dish-weight-input,
.calc-multiplier {
  background: var(--input-bg);
  border: 1px solid var(--border-color);
  border-radius: 3px;
  padding: 6px 8px;
  font-size: 14px;
  color: var(--text-color);
  transition: border-color 0.3s ease;
}

.weight-input:focus,
.dish-weight-input:focus,
.calc-multiplier:focus {
  outline: none;
  border-color: #3498db;
}

.dish-select,
.calc-source {
  background: var(--input-bg);
  border: 1px solid var(--border-color);
  border-radius: 3px;
  padding: 6px 8px;
  font-size: 14px;
  color: var(--text-color);
  cursor: pointer;
}

.control-btn {
  background: #3498db;
  color: white;
  border: none;
  border-radius: 3px;
  padding: 6px 8px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s ease;
}

.control-btn:hover {
  background: #2980b9;
}

.subtract-weight-btn {
  background: #e67e22;
}

.subtract-weight-btn:hover {
  background: #d35400;
}

.calculate-btn {
  background: #9b59b6;
}

.calculate-btn:hover {
  background: #8e44ad;
}

/* モバイル対応 */
@media (max-width: 480px) {
  .food-card {
    padding: 15px;
  }
  
  .controls {
    gap: 12px;
  }
  
  .control-row {
    grid-template-columns: 1fr 1fr 1fr;
    gap: 5px;
  }
  
  .calculation-row {
    grid-template-columns: 1fr 1fr 1fr;
    gap: 5px;
  }
  
  .calc-source,
  .calc-multiplier {
    width: 100%;
  }
  
  .weight-input,
  .dish-weight-input,
  .calc-multiplier,
  .dish-select,
  .calc-source {
    padding: 10px 8px;
    font-size: 14px;
    border-radius: 6px;
    width: 100%;
  }
  
  .control-btn {
    width: 100%;
    font-weight: 600;
    padding: 10px 8px;
    font-size: 14px;
  }
}
</style>