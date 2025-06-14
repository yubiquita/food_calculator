class FoodCalculator {
    constructor() {
        this.foods = [];
        this.dishes = [];
        this.nextId = 1;
        this.init();
    }

    init() {
        this.loadData();
        this.bindEvents();
        this.render();
    }

    bindEvents() {
        // ヘッダーボタン
        document.getElementById('add-food').addEventListener('click', () => this.addNewFood());
        document.getElementById('clear-all').addEventListener('click', () => this.clearAll());
        document.getElementById('dish-settings').addEventListener('click', () => this.openDishSettings());

        // モーダル
        document.querySelector('.close').addEventListener('click', () => this.closeDishSettings());
        document.getElementById('dish-modal').addEventListener('click', (e) => {
            if (e.target.id === 'dish-modal') this.closeDishSettings();
        });
        document.getElementById('dish-form').addEventListener('submit', (e) => this.addDish(e));
    }

    addNewFood() {
        const food = {
            id: this.nextId++,
            name: `料理${this.foods.length + 1}`,
            weight: 0,
            calculation: null
        };
        this.foods.push(food);
        this.saveData();
        this.render();
    }

    deleteFood(id) {
        this.foods = this.foods.filter(food => food.id !== id);
        this.saveData();
        this.render();
    }

    clearAll() {
        if (confirm('すべての料理を削除しますか？')) {
            this.foods = [];
            this.saveData();
            this.render();
        }
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
            food.weight += parseFloat(weight) || 0;
            this.saveData();
            this.render();
        }
    }

    subtractWeight(id, weight) {
        const food = this.foods.find(f => f.id === id);
        if (food) {
            food.weight -= parseFloat(weight) || 0;
            this.saveData();
            this.render();
        }
    }

    updateCalculation(id, sourceId, multiplier) {
        const food = this.foods.find(f => f.id === id);
        const sourceFood = this.foods.find(f => f.id === parseInt(sourceId));
        
        if (food && sourceFood) {
            food.calculation = {
                sourceId: parseInt(sourceId),
                multiplier: parseFloat(multiplier) || 1
            };
            food.weight = Math.round(sourceFood.weight * (parseFloat(multiplier) || 1));
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
    }

    renderFoodCard(food) {
        const dishOptions = this.dishes.map(dish => 
            `<option value="${dish.weight}">${dish.name} ${dish.weight}g</option>`
        ).join('');

        const foodOptions = this.foods.filter(f => f.id !== food.id).map(f => 
            `<option value="${f.id}">${f.name}</option>`
        ).join('');

        return `
            <div class="food-card">
                <div class="food-card-header">
                    <input type="text" class="food-name" value="${food.name}" 
                           onchange="app.updateFoodName(${food.id}, this.value)"
                           onfocus="this.select()">
                    <button class="delete-btn" onclick="app.deleteFood(${food.id})">×</button>
                </div>
                
                <div class="weight-display" data-copy-value="${Math.round(food.weight)}" style="cursor: pointer; user-select: none;" title="タップでコピー">${Math.round(food.weight)}g</div>
                
                <div class="controls">
                    <div class="control-row">
                        <label>重量:</label>
                        <input type="number" id="weight-input-${food.id}" placeholder="0">
                        <button class="control-btn" onclick="app.addWeight(${food.id}, document.getElementById('weight-input-${food.id}').value); document.getElementById('weight-input-${food.id}').value=''">+</button>
                    </div>
                    
                    <div class="control-row">
                        <label>皿重量:</label>
                        <select id="dish-select-${food.id}" onchange="document.getElementById('dish-weight-${food.id}').value = this.value">
                            <option value="">選択</option>
                            ${dishOptions}
                        </select>
                        <input type="number" id="dish-weight-${food.id}" placeholder="0">
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
                        <input type="number" id="calc-multiplier-${food.id}" step="0.1" placeholder="1.0">
                        <button class="control-btn" onclick="app.updateCalculation(${food.id}, document.getElementById('calc-source-${food.id}').value, document.getElementById('calc-multiplier-${food.id}').value)">計算</button>
                        ${food.calculation ? `<span class="calculation-result" data-copy-value="${Math.round(food.weight)}" style="cursor: pointer; user-select: none;">= ${Math.round(food.weight)}g</span>` : ''}
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    saveData() {
        localStorage.setItem('foodCalculatorData', JSON.stringify({
            foods: this.foods,
            dishes: this.dishes,
            nextId: this.nextId
        }));
    }

    loadData() {
        const data = localStorage.getItem('foodCalculatorData');
        if (data) {
            const parsed = JSON.parse(data);
            this.foods = parsed.foods || [];
            this.dishes = parsed.dishes || [];
            this.nextId = parsed.nextId || 1;
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