class FoodCalculator {
    constructor() {
        this.foods = [];
        this.dishes = [];
        this.nextId = 1;
        this.theme = 'light';
        this.swipeThreshold = 80; // スワイプでundoを実行する閾値（px）
        this.currentToast = null; // 現在表示中の通知要素
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

    // 履歴エントリ作成のヘルパーメソッド
    createHistoryEntry(type, value, additionalData = {}) {
        return {
            type,
            value,
            timestamp: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
            ...additionalData
        };
    }

    // 履歴に操作を追加するヘルパーメソッド
    addToHistory(food, historyEntry) {
        if (!food.history) food.history = [];
        food.history.push(historyEntry);
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

        // 依存食品の自動再計算
        this.recalculateDependent(id);
        
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
                this.addToHistory(food, this.createHistoryEntry('add', weightValue));
                
                // 依存食品の自動再計算
                this.recalculateDependent(id);
                
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
                this.addToHistory(food, this.createHistoryEntry('subtract', weightValue));
                
                // 依存食品の自動再計算
                this.recalculateDependent(id);
                
                this.saveData();
                this.render();
            }
        }
    }

    updateCalculation(id, sourceId, multiplier) {
        const food = this.foods.find(f => f.id === id);
        const sourceFood = this.foods.find(f => f.id === parseInt(sourceId));
        
        if (food && sourceFood) {
            // 循環参照をチェック
            if (this.detectCircularReference(parseInt(sourceId), id)) {
                this.showToast('循環参照のため計算できません', 'warning');
                return;
            }
            
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
            
            this.addToHistory(food, this.createHistoryEntry('calculation', calculatedWeight, {
                sourceName: sourceFood.name,
                multiplier: multiplierValue
            }));
            
            this.saveData();
            this.render();
        }
    }

    detectCircularReference(sourceId, targetId) {
        // 自己参照チェック
        if (sourceId === targetId) {
            return true;
        }
        
        // 深度優先探索で循環参照をチェック
        const visited = new Set();
        const stack = [sourceId];
        
        while (stack.length > 0) {
            const currentId = stack.pop();
            
            if (visited.has(currentId)) {
                continue;
            }
            
            if (currentId === targetId) {
                return true;
            }
            
            visited.add(currentId);
            
            // 現在の食品が参照している食品を探す
            const currentFood = this.foods.find(f => f.id === currentId);
            if (currentFood && currentFood.calculation) {
                stack.push(currentFood.calculation.sourceId);
            }
        }
        
        return false;
    }

    recalculateDependent(changedFoodId) {
        // 変更された食品を参照している食品を探す
        const dependentFoods = this.foods.filter(food => 
            food.calculation && food.calculation.sourceId === changedFoodId
        );
        
        // 各依存食品を再計算
        dependentFoods.forEach(food => {
            const sourceFood = this.foods.find(f => f.id === food.calculation.sourceId);
            if (sourceFood) {
                const newWeight = Math.round(sourceFood.weight * food.calculation.multiplier);
                
                // 重量が変わった場合のみ更新
                if (food.weight !== newWeight) {
                    // 操作前の状態を保存
                    if (!food.stateHistory) food.stateHistory = [];
                    food.stateHistory.push(this.createStateSnapshot(food));
                    
                    food.weight = newWeight;
                    
                    // 履歴に自動再計算を記録
                    this.addToHistory(food, this.createHistoryEntry('auto_recalculation', newWeight, {
                        sourceName: sourceFood.name,
                        multiplier: food.calculation.multiplier
                    }));
                    
                    // 再帰的に依存関係を更新
                    this.recalculateDependent(food.id);
                }
            }
        });
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

        const dishListContainer = document.getElementById('dish-list');
        dishListContainer.removeEventListener('click', this._handleDishListClick);
        this._handleDishListClick = this._handleDishListClick.bind(this);
        dishListContainer.addEventListener('click', this._handleDishListClick);
    }

    _handleDishListClick(e) {
        const target = e.target;
        if (target.classList.contains('dish-delete-btn')) {
            const index = parseInt(target.dataset.index);
            this.deleteDish(index);
        }
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
                <button class="dish-delete-btn" data-index="${index}">削除</button>
            </div>
        `).join('');

        // イベントリスナーを再付与
        container.removeEventListener('click', this._handleDishListClick);
        this._handleDishListClick = this._handleDishListClick.bind(this);
        container.addEventListener('click', this._handleDishListClick);
    }

    render() {
        const container = document.getElementById('food-cards');
        container.innerHTML = this.foods.map(food => this.renderFoodCard(food)).join('');
        
        // 全削除ボタンの状態を更新
        const clearAllBtn = document.getElementById('clear-all');
        clearAllBtn.disabled = this.foods.length === 0;
        
        // イベントデリゲーション
        container.removeEventListener('click', this._handleCardClick);
        container.removeEventListener('change', this._handleCardChange);
        container.removeEventListener('keydown', this._handleCardKeydown);

        this._handleCardClick = this._handleCardClick.bind(this);
        this._handleCardChange = this._handleCardChange.bind(this);
        this._handleCardKeydown = this._handleCardKeydown.bind(this);

        container.addEventListener('click', this._handleCardClick);
        container.addEventListener('change', this._handleCardChange);
        container.addEventListener('keydown', this._handleCardKeydown);

        // スワイプイベントを追加
        this.initSwipeEvents();
    }

    _handleCardClick(e) {
        const target = e.target;
        const foodId = parseInt(target.dataset.foodId || target.closest('.card-container')?.dataset.foodId);

        if (target.classList.contains('delete-btn')) {
            this.deleteFood(foodId);
        } else if (target.classList.contains('add-weight-btn')) {
            const input = document.getElementById(`weight-input-${foodId}`);
            this.addWeight(foodId, input.value);
            input.value = '';
        } else if (target.classList.contains('subtract-weight-btn')) {
            const input = document.getElementById(`dish-weight-${foodId}`);
            const select = document.getElementById(`dish-select-${foodId}`);
            this.subtractWeight(foodId, input.value);
            input.value = '';
            select.value = '';
        } else if (target.classList.contains('calculate-btn')) {
            const sourceSelect = document.getElementById(`calc-source-${foodId}`);
            const multiplierInput = document.getElementById(`calc-multiplier-${foodId}`);
            this.updateCalculation(foodId, sourceSelect.value, multiplierInput.value);
        } else if (target.classList.contains('weight-display') || target.classList.contains('calculation-result')) {
            const value = target.dataset.copyValue;
            if (value) {
                this.copyToClipboard(value);
            }
        }
    }

    _handleCardChange(e) {
        const target = e.target;
        const foodId = parseInt(target.dataset.foodId || target.closest('.card-container')?.dataset.foodId);

        if (target.classList.contains('food-name')) {
            this.updateFoodName(foodId, target.value);
        } else if (target.classList.contains('dish-select')) {
            const dishWeightInput = document.getElementById(`dish-weight-${foodId}`);
            const dishSelect = document.getElementById(`dish-select-${foodId}`);
            
            // 入力欄に値を設定
            dishWeightInput.value = target.value;
            
            // 値が選択されている場合は自動で重量減算を実行
            if (target.value && target.value !== '') {
                this.subtractWeight(foodId, target.value);
                // 実行後に入力欄とプルダウンをクリア
                dishWeightInput.value = '';
                dishSelect.value = '';
            }
        }
    }

    _handleCardKeydown(e) {
        const target = e.target;
        const foodId = parseInt(target.dataset.foodId || target.closest('.card-container')?.dataset.foodId);

        if (e.key === 'Enter') {
            if (target.classList.contains('food-name')) {
                target.blur();
            } else if (target.classList.contains('weight-input')) {
                this.addWeight(foodId, target.value);
                target.value = '';
                target.blur();
            } else if (target.classList.contains('dish-weight-input')) {
                const select = document.getElementById(`dish-select-${foodId}`);
                this.subtractWeight(foodId, target.value);
                target.value = '';
                select.value = '';
                target.blur();
            } else if (target.classList.contains('calc-multiplier')) {
                const sourceSelect = document.getElementById(`calc-source-${foodId}`);
                this.updateCalculation(foodId, sourceSelect.value, target.value);
                target.blur();
            }
        }
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
        const hasHistory = food.history && food.history.length > 0;
        const dishOptions = this.dishes.map(dish => 
            `<option value="${dish.weight}">${dish.name} ${dish.weight}g</option>`
        ).join('');
        const foodOptions = this.foods.filter(f => f.id !== food.id).map(f => 
            `<option value="${f.id}">${f.name}</option>`
        ).join('');

        return `
            <div class="card-container" data-food-id="${food.id}">
                <div class="undo-background">
                    <div class="undo-icon">⟲</div>
                    <div class="undo-text">取り消し</div>
                </div>
                <div class="food-card ${hasHistory ? 'swipeable' : ''}">
                    ${this.renderCardHeader(food)}
                    ${this.renderWeightDisplay(food)}
                    ${this.renderHistory(food)}
                    ${this.renderControls(food, dishOptions, foodOptions)}
                    ${this.renderCardFooter(food)}
                </div>
            </div>
        `;
    }

    renderCardHeader(food) {
        return `
            <div class="food-card-header">
                <input type="text" class="food-name" value="${food.name}" 
                       data-food-id="${food.id}" onfocus="this.select()">
                <button class="delete-btn" data-food-id="${food.id}">×</button>
            </div>
        `;
    }

    renderWeightDisplay(food) {
        return `
            <div class="weight-display" data-copy-value="${Math.round(food.weight)}" style="cursor: pointer; user-select: none;" title="タップでコピー">${Math.round(food.weight)}g</div>
        `;
    }

    renderControls(food, dishOptions, foodOptions) {
        return `
            <div class="controls">
                <div class="control-row">
                    <label>重量:</label>
                    <span></span>
                    <input type="number" class="weight-input" id="weight-input-${food.id}" placeholder="0" data-food-id="${food.id}">
                    <button class="control-btn add-weight-btn" data-food-id="${food.id}">+</button>
                </div>
                
                <div class="control-row">
                    <label>食器重量:</label>
                    <select class="dish-select" id="dish-select-${food.id}" data-food-id="${food.id}">
                        <option value="">選択</option>
                        ${dishOptions}
                    </select>
                    <input type="number" class="dish-weight-input" id="dish-weight-${food.id}" placeholder="0" data-food-id="${food.id}">
                    <button class="control-btn subtract-weight-btn" data-food-id="${food.id}">-</button>
                </div>
                
                ${this.renderCalculation(food, foodOptions)}
            </div>
        `;
    }

    renderCalculation(food, foodOptions) {
        if (!foodOptions) {
            return '';
        }
        return `
            <div class="calculation-row">
                <label>計算:</label>
                <select class="calc-source" id="calc-source-${food.id}" data-food-id="${food.id}">
                    <option value="">選択</option>
                    ${foodOptions}
                </select>
                <span>×</span>
                <input type="number" class="calc-multiplier" id="calc-multiplier-${food.id}" step="0.1" placeholder="1.0" data-food-id="${food.id}">
                <button class="control-btn calculate-btn" data-food-id="${food.id}">計算</button>
                ${food.calculation ? `<span class="calculation-result" data-copy-value="${Math.round(food.weight)}" style="cursor: pointer; user-select: none;">= ${Math.round(food.weight)}g</span>` : ''}
            </div>
        `;
    }

    renderCardFooter(food) {
        // 将来的な拡張用
        return '';
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
                    text = `=${Math.round(item.value)}g (${item.sourceName} × ${item.multiplier})`;
                    break;
                case 'auto_recalculation':
                    text = `🔄${Math.round(item.value)}g (${item.sourceName} × ${item.multiplier})`;
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

    removeToastImmediately(toast) {
        if (!toast || !toast.parentNode) return;
        
        // タイマーをクリア（既存のタイマーがある場合）
        if (toast.autoHideTimer) {
            clearTimeout(toast.autoHideTimer);
        }
        if (toast.removeTimer) {
            clearTimeout(toast.removeTimer);
        }
        
        // DOM から即座に削除
        toast.parentNode.removeChild(toast);
        
        // 現在の通知が削除された場合はプロパティをクリア
        if (this.currentToast === toast) {
            this.currentToast = null;
        }
    }

    showToast(message, type = 'warning') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        // 既存の通知があれば即座に削除
        if (this.currentToast) {
            this.removeToastImmediately(this.currentToast);
        }

        // トースト要素を作成
        const toast = document.createElement('div');
        toast.className = `toast-notification ${type}`;
        toast.textContent = message;

        // 現在の通知として設定
        this.currentToast = toast;

        // コンテナに追加
        container.appendChild(toast);

        // アニメーション: フェードイン
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        // 3秒後に自動削除
        toast.autoHideTimer = setTimeout(() => {
            toast.classList.remove('show');
            toast.classList.add('hide');
            
            // アニメーション終了後にDOM から削除
            toast.removeTimer = setTimeout(() => {
                if (toast.parentNode) {
                    container.removeChild(toast);
                    if (this.currentToast === toast) {
                        this.currentToast = null;
                    }
                }
            }, 400); // CSSアニメーション時間に合わせて調整
        }, 3000);
    }
}

// CommonJS対応（テスト環境用）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FoodCalculator;
} else {
    // ブラウザ環境でのみアプリケーション初期化
    const app = new FoodCalculator();
}