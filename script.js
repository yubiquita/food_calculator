class FoodCalculator {
    constructor() {
        this.foods = [];
        this.dishes = [];
        this.nextId = 1;
        this.theme = 'light';
        this.swipeThreshold = 80; // スワイプでundoを実行する閾値（px）
        this.init();
    }

    init() {
        this.loadData();
        this.initTheme();
        this.bindEvents();
        this.render();
    }

    bindEvents() {
        // ヘッダーボタン
        document.getElementById('add-food').addEventListener('click', () => this.addNewFood());
        document.getElementById('clear-all').addEventListener('click', () => this.showConfirmModal());
        document.getElementById('dish-settings').addEventListener('click', () => this.openDishSettings());
        document.getElementById('theme-toggle').addEventListener('click', () => this.toggleTheme());

        // 食器設定モーダル
        document.querySelector('.close').addEventListener('click', () => this.closeDishSettings());
        document.getElementById('dish-modal').addEventListener('click', (e) => {
            if (e.target.id === 'dish-modal') this.closeDishSettings();
        });
        document.getElementById('dish-form').addEventListener('submit', (e) => this.addDish(e));
        
        // 確認モーダル
        document.getElementById('confirm-cancel').addEventListener('click', () => this.hideConfirmModal());
        document.getElementById('confirm-delete').addEventListener('click', () => this.confirmClearAll());
        document.getElementById('confirm-modal').addEventListener('click', (e) => {
            if (e.target.id === 'confirm-modal') this.hideConfirmModal();
        });
    }

    addNewFood() {
        const food = {
            id: this.nextId++,
            name: `料理${this.foods.length + 1}`,
            weight: 0,
            calculation: null,
            history: [],
            stateHistory: [] // undo用の状態履歴
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

        // 履歴から最後の操作を削除
        food.history.pop();
        
        // 状態履歴から復元
        if (food.stateHistory && food.stateHistory.length > 0) {
            const previousState = food.stateHistory.pop();
            this.restoreFromSnapshot(food, previousState);
        } else {
            // 初期状態に戻す
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
                // 操作前の状態を保存
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
                // 操作前の状態を保存
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
            // 操作前の状態を保存
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

    openDishSettings() {
        document.getElementById('dish-modal').style.display = 'block';
        this.renderDishList();
    }

    closeDishSettings() {
        document.getElementById('dish-modal').style.display = 'none';
    }

    renderDishList() {
        const container = document.getElementById('dish-list');
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

    render() {
        const container = document.getElementById('food-cards');
        container.innerHTML = this.foods.map(food => this.renderFoodCard(food)).join('');
        
        // 全削除ボタンの状態を更新
        const clearAllBtn = document.getElementById('clear-all');
        clearAllBtn.disabled = this.foods.length === 0;
        
        // 重量表示のクリックイベントを追加
        const weightDisplays = container.querySelectorAll('.weight-display');
        weightDisplays.forEach(element => {
            element.addEventListener('click', (e) => {
                const value = e.target.getAttribute('data-copy-value');
                if (value) {
                    this.copyToClipboard(value);
                }
            });
        });

        // スワイプイベントを追加
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
                    const translateX = Math.max(deltaX, -120); // 最大120px移動
                    card.style.transform = `translateX(${translateX}px)`;
                    
                    // undoアイコンの表示度を調整
                    const opacity = Math.min(Math.abs(translateX) / this.swipeThreshold, 1);
                    const undoBackground = cardContainer.querySelector('.undo-background');
                    undoBackground.style.opacity = opacity;
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
                    undoBackground.style.opacity = '0';
                }
                
                currentX = 0;
                startX = 0;
                hasMoved = false;
            }, { passive: true });
        });
    }

    renderFoodCard(food) {
        const dishOptions = this.dishes.map(dish => 
            `<option value="${dish.weight}">${dish.name} ${dish.weight}g</option>`
        ).join('');

        const foodOptions = this.foods.filter(f => f.id !== food.id).map(f => 
            `<option value="${f.id}">${f.name}</option>`
        ).join('');

        const hasHistory = food.history && food.history.length > 0;

        return `
            <div class="card-container" data-food-id="${food.id}">
                <div class="undo-background">
                    <div class="undo-icon">⟲</div>
                    <div class="undo-text">取り消し</div>
                </div>
                <div class="food-card ${hasHistory ? 'swipeable' : ''}">
                    <div class="food-card-header">
                        <input type="text" class="food-name" value="${food.name}" 
                               onchange="app.updateFoodName(${food.id}, this.value)"
                               onfocus="this.select()"
                               onkeydown="if(event.key==='Enter'){this.blur()}">
                        <button class="delete-btn" onclick="app.deleteFood(${food.id})">×</button>
                    </div>
                    
                    <div class="weight-display" data-copy-value="${Math.round(food.weight)}" style="cursor: pointer; user-select: none;" title="タップでコピー">${Math.round(food.weight)}g</div>
                    
                    ${this.renderHistory(food)}
                    
                    <div class="controls">
                        <div class="control-row">
                            <label>重量:</label>
                            <span></span>
                            <input type="number" id="weight-input-${food.id}" placeholder="0" onkeydown="if(event.key==='Enter'){app.addWeight(${food.id}, this.value); this.value=''; this.blur()}">
                            <button class="control-btn" onclick="app.addWeight(${food.id}, document.getElementById('weight-input-${food.id}').value); document.getElementById('weight-input-${food.id}').value=''">+</button>
                        </div>
                        
                        <div class="control-row">
                            <label>食器重量:</label>
                            <select id="dish-select-${food.id}" onchange="document.getElementById('dish-weight-${food.id}').value = this.value">
                                <option value="">選択</option>
                                ${dishOptions}
                            </select>
                            <input type="number" id="dish-weight-${food.id}" placeholder="0" onkeydown="if(event.key==='Enter'){app.subtractWeight(${food.id}, this.value); this.value=''; document.getElementById('dish-select-${food.id}').value=''; this.blur()}">
                            <button class="control-btn" onclick="app.subtractWeight(${food.id}, document.getElementById('dish-weight-${food.id}').value); document.getElementById('dish-weight-${food.id}').value=''; document.getElementById('dish-select-${food.id}').value=''">-</button>
                        </div>
                        
                        ${foodOptions ? `
                        <div class="calculation-row">
                            <label>計算:</label>
                            <select id="calc-source-${food.id}">
                                <option value="">選択</option>
                                ${foodOptions}
                            </select>
                            <span>×</span>
                            <input type="number" id="calc-multiplier-${food.id}" step="0.1" placeholder="1.0" onkeydown="if(event.key==='Enter'){app.updateCalculation(${food.id}, document.getElementById('calc-source-${food.id}').value, this.value); this.blur()}">
                            <button class="control-btn" onclick="app.updateCalculation(${food.id}, document.getElementById('calc-source-${food.id}').value, document.getElementById('calc-multiplier-${food.id}').value)">計算</button>
                            ${food.calculation ? `<span class="calculation-result" data-copy-value="${Math.round(food.weight)}" style="cursor: pointer; user-select: none;">= ${Math.round(food.weight)}g</span>` : ''}
                        </div>
                        ` : ''}
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
            const parsed = JSON.parse(data);
            this.foods = (parsed.foods || []).map(food => ({
                ...food,
                history: food.history || [],
                stateHistory: food.stateHistory || []
            }));
            this.dishes = parsed.dishes || [];
            this.nextId = parsed.nextId || 1;
            this.theme = parsed.theme || 'light';
        }
    }

    initTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
        this.updateThemeButton();
    }

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', this.theme);
        this.updateThemeButton();
        this.saveData();
    }

    updateThemeButton() {
        const themeIcon = document.querySelector('.theme-icon');
        const themeText = document.querySelector('.theme-text');
        
        if (this.theme === 'dark') {
            themeIcon.textContent = '☀️';
            themeText.textContent = 'ライト';
        } else {
            themeIcon.textContent = '🌙';
            themeText.textContent = 'ダーク';
        }
    }

    async copyToClipboard(value) {
        try {
            await navigator.clipboard.writeText(value.toString());
        } catch (err) {
            // フォールバック
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
                // エラーは無視（ユーザーにはAndroid側の通知が表示される）
            }
        }
    }
}

// アプリケーション初期化
const app = new FoodCalculator();