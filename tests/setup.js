// Jest setup file
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;

// Create a simplified version of FoodCalculator for testing
global.createFoodCalculator = () => {
  class FoodCalculator {
    constructor() {
      this.foods = [];
      this.dishes = [];
      this.nextId = 1;
      this.theme = 'light';
      this.swipeThreshold = 80;
    }

    addNewFood() {
      const food = {
        id: this.nextId++,
        name: `料理${this.foods.length + 1}`,
        weight: 0,
        calculation: null,
        history: [],
        stateHistory: []
      };
      this.foods.push(food);
      this.saveData();
      this.render();
    }

    createStateSnapshot(food) {
      return {
        weight: food.weight,
        calculation: food.calculation ? { ...food.calculation } : null
      };
    }

    restoreFromSnapshot(food, snapshot) {
      food.weight = snapshot.weight;
      food.calculation = snapshot.calculation ? { ...snapshot.calculation } : null;
    }

    undoLastOperation(id) {
      const food = this.foods.find(f => f.id === id);
      if (!food || !food.history || food.history.length === 0) {
        return;
      }

      food.history.pop();
      
      if (food.stateHistory && food.stateHistory.length > 0) {
        const previousState = food.stateHistory.pop();
        this.restoreFromSnapshot(food, previousState);
      } else {
        food.weight = 0;
        food.calculation = null;
      }

      this.saveData();
      this.render();
    }

    shouldTriggerUndo(swipeDistance) {
      return Math.abs(swipeDistance) >= this.swipeThreshold;
    }

    deleteFood(id) {
      this.foods = this.foods.filter(food => food.id !== id);
      this.saveData();
      this.render();
    }

    updateFoodName(id, name) {
      const food = this.foods.find(f => f.id === id);
      if (food) {
        food.name = name;
        this.saveData();
      }
    }

    addWeight(id, weight) {
      const food = this.foods.find(f => f.id === id);
      if (food) {
        const weightValue = parseFloat(weight) || 0;
        if (weightValue !== 0) {
          if (!food.stateHistory) food.stateHistory = [];
          food.stateHistory.push(this.createStateSnapshot(food));
          
          food.weight += weightValue;
          if (!food.history) food.history = [];
          food.history.push({
            type: 'add',
            value: weightValue,
            timestamp: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
          });
          this.saveData();
          this.render();
        }
      }
    }

    subtractWeight(id, weight) {
      const food = this.foods.find(f => f.id === id);
      if (food) {
        const weightValue = parseFloat(weight) || 0;
        if (weightValue !== 0) {
          if (!food.stateHistory) food.stateHistory = [];
          food.stateHistory.push(this.createStateSnapshot(food));
          
          food.weight -= weightValue;
          if (!food.history) food.history = [];
          food.history.push({
            type: 'subtract',
            value: weightValue,
            timestamp: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
          });
          this.saveData();
          this.render();
        }
      }
    }

    updateCalculation(id, sourceId, multiplier) {
      const food = this.foods.find(f => f.id === id);
      const sourceFood = this.foods.find(f => f.id === parseInt(sourceId));
      
      if (food && sourceFood) {
        if (!food.stateHistory) food.stateHistory = [];
        food.stateHistory.push(this.createStateSnapshot(food));
        
        const multiplierValue = parseFloat(multiplier) || 1;
        const calculatedWeight = Math.round(sourceFood.weight * multiplierValue);
        
        food.calculation = {
          sourceId: parseInt(sourceId),
          multiplier: multiplierValue
        };
        food.weight = calculatedWeight;
        
        if (!food.history) food.history = [];
        food.history.push({
          type: 'calculation',
          value: calculatedWeight,
          sourceName: sourceFood.name,
          multiplier: multiplierValue,
          timestamp: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
        });
        
        this.saveData();
        this.render();
      }
    }

    addDish(e) {
      e.preventDefault();
      const name = document.getElementById('dish-name').value.trim();
      const weight = parseFloat(document.getElementById('dish-weight').value);
      
      if (name && weight) {
        this.dishes.push({ name, weight });
        this.saveData();
        this.renderDishList();
        document.getElementById('dish-form').reset();
      }
    }

    deleteDish(index) {
      this.dishes.splice(index, 1);
      this.saveData();
      this.renderDishList();
    }

    showConfirmModal() {
      if (this.foods.length === 0) return;
      document.getElementById('confirm-modal').style.display = 'block';
    }

    hideConfirmModal() {
      document.getElementById('confirm-modal').style.display = 'none';
    }

    confirmClearAll() {
      this.foods = [];
      this.saveData();
      this.render();
      this.hideConfirmModal();
    }

    openDishSettings() {
      document.getElementById('dish-modal').style.display = 'block';
      this.renderDishList();
    }

    closeDishSettings() {
      document.getElementById('dish-modal').style.display = 'none';
    }

    toggleTheme() {
      this.theme = this.theme === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', this.theme);
      this.updateThemeButton();
      this.saveData();
    }

    initTheme() {
      document.documentElement.setAttribute('data-theme', this.theme);
      this.updateThemeButton();
    }

    updateThemeButton() {
      const themeIcon = document.querySelector('.theme-icon');
      const themeText = document.querySelector('.theme-text');
      
      if (themeIcon && themeText) {
        if (this.theme === 'dark') {
          themeIcon.textContent = '☀️';
          themeText.textContent = 'ライト';
        } else {
          themeIcon.textContent = '🌙';
          themeText.textContent = 'ダーク';
        }
      }
    }

    saveData() {
      localStorage.setItem('foodCalculatorData', JSON.stringify({
        foods: this.foods,
        dishes: this.dishes,
        nextId: this.nextId,
        theme: this.theme
      }));
    }

    loadData() {
      const data = localStorage.getItem('foodCalculatorData');
      if (data) {
        try {
          const parsed = JSON.parse(data);
          this.foods = (parsed.foods || []).map(food => ({
            ...food,
            history: food.history || [],
            stateHistory: food.stateHistory || []
          }));
          this.dishes = parsed.dishes || [];
          this.nextId = parsed.nextId || 1;
          this.theme = parsed.theme || 'light';
        } catch (e) {
          // Invalid JSON, use defaults
        }
      }
    }

    render() {
      const container = document.getElementById('food-cards');
      if (container) {
        container.innerHTML = this.foods.map(food => this.renderFoodCard(food)).join('');
      }
      
      // 全削除ボタンの状態を更新
      const clearAllBtn = document.getElementById('clear-all');
      if (clearAllBtn) {
        clearAllBtn.disabled = this.foods.length === 0;
      }
      
      // スワイプイベントを初期化
      this.initSwipeEvents();
    }

    initSwipeEvents() {
      const swipeableCards = document.querySelectorAll('.food-card.swipeable');
      
      swipeableCards.forEach(card => {
        let startX = 0;
        let currentX = 0;
        let isDragging = false;
        let startTime = 0;
        let hasMoved = false; // touchmoveが発生したかを追跡
        
        const cardContainer = card.parentElement;
        const foodId = parseInt(cardContainer.getAttribute('data-food-id'));
        
        // タッチ開始
        card.addEventListener('touchstart', (e) => {
          startX = e.touches[0].clientX;
          currentX = startX; // 初期値を同じに設定
          startTime = Date.now();
          isDragging = true;
          hasMoved = false; // リセット
          card.style.transition = 'none';
        }, { passive: true });
        
        // タッチ移動
        card.addEventListener('touchmove', (e) => {
          if (!isDragging) return;
          
          hasMoved = true; // 移動が発生したことを記録
          currentX = e.touches[0].clientX;
          const deltaX = currentX - startX;
          
          // 左スワイプのみ許可
          if (deltaX < 0) {
            const translateX = Math.max(deltaX, -120);
            card.style.transform = `translateX(${translateX}px)`;
            
            const opacity = Math.min(Math.abs(translateX) / this.swipeThreshold, 1);
            const undoBackground = cardContainer.querySelector('.undo-background');
            if (undoBackground) {
              undoBackground.style.opacity = opacity;
            }
          }
        }, { passive: true });
        
        // タッチ終了
        card.addEventListener('touchend', (e) => {
          if (!isDragging) return;
          
          isDragging = false;
          const deltaX = currentX - startX;
          const timeDelta = Date.now() - startTime;
          
          card.style.transition = 'transform 0.3s ease-out';
          
          // スワイプ判定（実際に移動 && 左スワイプ && 閾値以上 && 短時間での操作）
          if (hasMoved && deltaX <= -this.swipeThreshold && timeDelta < 500) {
            // Undo実行
            this.undoLastOperation(foodId);
          } else {
            // 元の位置に戻す
            card.style.transform = 'translateX(0)';
            const undoBackground = cardContainer.querySelector('.undo-background');
            if (undoBackground) {
              undoBackground.style.opacity = '0';
            }
          }
          
          currentX = 0;
          startX = 0;
          hasMoved = false;
        }, { passive: true });
      });
    }

    renderDishList() {
      const container = document.getElementById('dish-list');
      if (container) {
        container.innerHTML = this.dishes.map((dish, index) => `
          <div class="dish-item">
            <div class="dish-item-info">
              <div class="dish-item-name">${dish.name}</div>
              <div class="dish-item-weight">${dish.weight}g</div>
            </div>
            <button class="dish-delete-btn" onclick="app.deleteDish(${index})">削除</button>
          </div>
        `).join('');
      }
    }

    renderFoodCard(food) {
      const hasHistory = food.history && food.history.length > 0;

      return `
        <div class="card-container" data-food-id="${food.id}">
          <div class="undo-background">
            <div class="undo-icon">⟲</div>
            <div class="undo-text">取り消し</div>
          </div>
          <div class="food-card ${hasHistory ? 'swipeable' : ''}">
            <div class="food-card-header">
              <input type="text" class="food-name" value="${food.name}">
              <button class="delete-btn">×</button>
            </div>
            
            <div class="weight-display" data-copy-value="${Math.round(food.weight)}">${Math.round(food.weight)}g</div>
            
            ${this.renderHistory(food)}
            
            <div class="controls">
              <div class="control-row">
                <label>重量:</label>
                <input type="number" placeholder="0">
                <button class="control-btn">+</button>
              </div>
              ${food.calculation ? `<span class="calculation-result" data-copy-value="${Math.round(food.weight)}">= ${Math.round(food.weight)}g</span>` : ''}
            </div>
          </div>
        </div>
      `;
    }

    renderHistory(food) {
      if (!food.history || food.history.length === 0) {
        return '';
      }
      
      const historyItems = food.history.slice().reverse().map(item => {
        let text = '';
        switch (item.type) {
          case 'add':
            text = `+${Math.round(item.value)}g`;
            break;
          case 'subtract':
            text = `-${Math.round(item.value)}g`;
            break;
          case 'calculation':
            text = `=${Math.round(item.value)}g (×${item.multiplier})`;
            break;
        }
        return `<div class="history-item">
                    <span class="history-operation">${text}</span>
                    <span class="history-time">${item.timestamp}</span>
                </div>`;
      }).join('');
      
      return `<div class="calculation-history">
                  <div class="history-header">履歴</div>
                  <div class="history-items">${historyItems}</div>
              </div>`;
    }

    async copyToClipboard(value) {
      try {
        await navigator.clipboard.writeText(value.toString());
      } catch (err) {
        try {
          const textArea = document.createElement('textarea');
          textArea.value = value.toString();
          textArea.style.position = 'fixed';
          textArea.style.left = '-9999px';
          textArea.style.top = '0';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
        } catch (fallbackErr) {
          // Silent fail
        }
      }
    }
  }
  return FoodCalculator;
};

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock navigator.clipboard
const clipboardMock = {
  writeText: jest.fn().mockResolvedValue(undefined),
};

// Ensure navigator exists and has clipboard
if (!global.navigator) {
  global.navigator = {};
}
global.navigator.clipboard = clipboardMock;

// Mock document.execCommand
global.document.execCommand = jest.fn();

// Mock console.log to avoid noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

// Mock Date.prototype.toLocaleTimeString
Date.prototype.toLocaleTimeString = jest.fn().mockReturnValue('12:34');

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  localStorageMock.getItem.mockReturnValue(null);
  
  // Reset DOM
  document.body.innerHTML = `
    <div id="food-cards"></div>
    <div id="dish-list"></div>
    <div id="confirm-modal" style="display: none;"></div>
    <div id="dish-modal" style="display: none;"></div>
    <button id="add-food"></button>
    <button id="clear-all"></button>
    <button id="dish-settings"></button>
    <button id="theme-toggle"></button>
    <button id="confirm-cancel"></button>
    <button id="confirm-delete"></button>
    <span class="close"></span>
    <form id="dish-form">
      <input id="dish-name" />
      <input id="dish-weight" />
    </form>
    <div class="theme-icon"></div>
    <div class="theme-text"></div>
  `;
  
  // Mock document.documentElement.setAttribute
  document.documentElement.setAttribute = jest.fn();
  
  // Reset localStorage and navigator mocks to actual mock objects
  global.localStorage = localStorageMock;
  if (!global.navigator) {
    global.navigator = {};
  }
  global.navigator.clipboard = clipboardMock;
  
  // Load FoodCalculator class after DOM setup
  global.FoodCalculator = global.createFoodCalculator();
});
