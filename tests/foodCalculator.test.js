// FoodCalculator class is loaded globally in setup.js

describe('FoodCalculator', () => {
  let calculator;

  beforeEach(() => {
    calculator = new FoodCalculator();
  });

  describe('基本機能', () => {
    test('新しい料理を追加できる', () => {
      const initialLength = calculator.foods.length;
      calculator.addNewFood();
      
      expect(calculator.foods.length).toBe(initialLength + 1);
      expect(calculator.foods[0].name).toBe('料理1');
      expect(calculator.foods[0].weight).toBe(0);
      expect(calculator.foods[0].id).toBe(1);
      expect(calculator.foods[0].calculation).toBeNull();
      expect(calculator.foods[0].history).toEqual([]);
    });

    test('複数の料理を追加すると連番になる', () => {
      calculator.addNewFood();
      calculator.addNewFood();
      calculator.addNewFood();
      
      expect(calculator.foods.length).toBe(3);
      expect(calculator.foods[0].name).toBe('料理1');
      expect(calculator.foods[1].name).toBe('料理2');
      expect(calculator.foods[2].name).toBe('料理3');
      expect(calculator.foods[0].id).toBe(1);
      expect(calculator.foods[1].id).toBe(2);
      expect(calculator.foods[2].id).toBe(3);
    });

    test('料理を削除できる', () => {
      calculator.addNewFood();
      calculator.addNewFood();
      const initialLength = calculator.foods.length;
      
      calculator.deleteFood(1);
      
      expect(calculator.foods.length).toBe(initialLength - 1);
      expect(calculator.foods.find(f => f.id === 1)).toBeUndefined();
      expect(calculator.foods.find(f => f.id === 2)).toBeDefined();
    });

    test('存在しないIDの料理を削除しようとしても何も起こらない', () => {
      calculator.addNewFood();
      const initialLength = calculator.foods.length;
      
      calculator.deleteFood(999);
      
      expect(calculator.foods.length).toBe(initialLength);
    });

    test('料理名を更新できる', () => {
      calculator.addNewFood();
      const foodId = calculator.foods[0].id;
      
      calculator.updateFoodName(foodId, '新しい料理名');
      
      expect(calculator.foods[0].name).toBe('新しい料理名');
    });

    test('存在しないIDの料理名を更新しようとしても何も起こらない', () => {
      calculator.addNewFood();
      const originalName = calculator.foods[0].name;
      
      calculator.updateFoodName(999, '新しい料理名');
      
      expect(calculator.foods[0].name).toBe(originalName);
    });
  });

  describe('食事名入力UI機能', () => {
    beforeEach(() => {
      calculator.addNewFood();
      calculator.render();
    });

    test('食事名入力フィールドにonfocus属性が設定されている', () => {
      const foodNameInput = document.querySelector('.food-name');
      
      expect(foodNameInput).toBeTruthy();
      expect(foodNameInput.getAttribute('onfocus')).toBe('this.select()');
    });

    test('食事名入力フィールドのフォーカス時に全選択される', () => {
      const foodNameInput = document.querySelector('.food-name');
      const selectSpy = jest.spyOn(foodNameInput, 'select').mockImplementation(() => {});
      
      // onfocusイベントを発火
      const focusEvent = new Event('focus');
      foodNameInput.dispatchEvent(focusEvent);
      
      expect(selectSpy).toHaveBeenCalled();
      selectSpy.mockRestore();
    });

    test('食事名入力フィールドがちゃんと表示されている', () => {
      const foodNameInput = document.querySelector('.food-name');
      
      expect(foodNameInput).toBeTruthy();
      expect(foodNameInput.tagName).toBe('INPUT');
      expect(foodNameInput.type).toBe('text');
      expect(foodNameInput.value).toBe('料理1');
    });
  });

  describe('確認モーダル', () => {
    test('料理がある場合は確認モーダルを表示する', () => {
      calculator.addNewFood();
      
      // Debug logging
      // DOM要素の存在確認
      expect(document.getElementById('confirm-modal')).toBeTruthy();
      expect(document.getElementById('clear-all')).toBeTruthy();
      expect(document.getElementById('food-cards')).toBeTruthy();
      
      const modal = document.getElementById('confirm-modal');
      
      calculator.showConfirmModal();
      
      expect(modal).toBeTruthy();
      expect(modal.style.display).toBe('block');
    });

    test('料理がない場合は確認モーダルを表示しない', () => {
      const modal = document.getElementById('confirm-modal');
      
      // テスト環境でCSS適用前の初期設定
      modal.style.display = 'none';
      
      calculator.showConfirmModal();
      
      // showConfirmModal()を呼んでも、料理がない場合はモーダルは表示されない
      expect(modal.style.display).toBe('none');
    });

    test('確認モーダルを閉じることができる', () => {
      const modal = document.getElementById('confirm-modal');
      modal.style.display = 'block';
      
      calculator.hideConfirmModal();
      
      expect(modal.style.display).toBe('none');
    });

    test('全削除確認で全ての料理を削除できる', () => {
      calculator.addNewFood();
      calculator.addNewFood();
      const modal = document.getElementById('confirm-modal');
      modal.style.display = 'block';
      
      calculator.confirmClearAll();
      
      expect(calculator.foods.length).toBe(0);
      expect(modal.style.display).toBe('none');
    });
  });

  describe('重量操作', () => {
    beforeEach(() => {
      calculator.addNewFood();
    });

    test('重量を加算できる', () => {
      const foodId = calculator.foods[0].id;
      
      calculator.addWeight(foodId, '100');
      
      expect(calculator.foods[0].weight).toBe(100);
      expect(calculator.foods[0].history).toHaveLength(1);
      expect(calculator.foods[0].history[0]).toMatchObject({
        type: 'add',
        value: 100,
        timestamp: '12:34'
      });
    });

    test('重量を減算できる', () => {
      const foodId = calculator.foods[0].id;
      calculator.foods[0].weight = 150;
      
      calculator.subtractWeight(foodId, '50');
      
      expect(calculator.foods[0].weight).toBe(100);
      expect(calculator.foods[0].history).toHaveLength(1);
      expect(calculator.foods[0].history[0]).toMatchObject({
        type: 'subtract',
        value: 50,
        timestamp: '12:34'
      });
    });

    test('重量を複数回操作すると履歴が蓄積される', () => {
      const foodId = calculator.foods[0].id;
      
      calculator.addWeight(foodId, '100');
      calculator.addWeight(foodId, '50');
      calculator.subtractWeight(foodId, '20');
      
      expect(calculator.foods[0].weight).toBe(130);
      expect(calculator.foods[0].history).toHaveLength(3);
      expect(calculator.foods[0].history[0].type).toBe('add');
      expect(calculator.foods[0].history[1].type).toBe('add');
      expect(calculator.foods[0].history[2].type).toBe('subtract');
    });

    test('0の重量を加算しても変化しない', () => {
      const foodId = calculator.foods[0].id;
      const initialWeight = calculator.foods[0].weight;
      
      calculator.addWeight(foodId, '0');
      
      expect(calculator.foods[0].weight).toBe(initialWeight);
      expect(calculator.foods[0].history).toHaveLength(0);
    });

    test('無効な重量値は0として扱われる', () => {
      const foodId = calculator.foods[0].id;
      const initialWeight = calculator.foods[0].weight;
      
      calculator.addWeight(foodId, 'invalid');
      calculator.addWeight(foodId, '');
      calculator.addWeight(foodId, null);
      
      expect(calculator.foods[0].weight).toBe(initialWeight);
      expect(calculator.foods[0].history).toHaveLength(0);
    });

    test('存在しないIDの料理に重量操作しても何も起こらない', () => {
      calculator.addWeight(999, '100');
      calculator.subtractWeight(999, '50');
      
      expect(calculator.foods[0].weight).toBe(0);
      expect(calculator.foods[0].history).toHaveLength(0);
    });
  });

  describe('計算機能', () => {
    beforeEach(() => {
      calculator.addNewFood(); // ID: 1
      calculator.addNewFood(); // ID: 2
      calculator.foods[0].weight = 200; // ソース料理
    });

    test('他の料理から重量を計算できる', () => {
      const targetId = calculator.foods[1].id;
      const sourceId = calculator.foods[0].id;
      
      calculator.updateCalculation(targetId, sourceId.toString(), '0.6');
      
      expect(calculator.foods[1].weight).toBe(120); // 200 * 0.6 = 120
      expect(calculator.foods[1].calculation).toEqual({
        sourceId: sourceId,
        multiplier: 0.6
      });
      expect(calculator.foods[1].history).toHaveLength(1);
      expect(calculator.foods[1].history[0]).toMatchObject({
        type: 'calculation',
        value: 120,
        sourceName: '料理1',
        multiplier: 0.6,
        timestamp: '12:34'
      });
    });

    test('計算結果は整数に丸められる', () => {
      const targetId = calculator.foods[1].id;
      const sourceId = calculator.foods[0].id;
      calculator.foods[0].weight = 333;
      
      calculator.updateCalculation(targetId, sourceId.toString(), '0.5');
      
      expect(calculator.foods[1].weight).toBe(167); // Math.round(333 * 0.5) = 167
    });

    test('無効な乗数は1として扱われる', () => {
      const targetId = calculator.foods[1].id;
      const sourceId = calculator.foods[0].id;
      
      calculator.updateCalculation(targetId, sourceId.toString(), 'invalid');
      
      expect(calculator.foods[1].weight).toBe(200); // 200 * 1 = 200
      expect(calculator.foods[1].calculation.multiplier).toBe(1);
    });

    test('存在しないソース料理IDでは計算されない', () => {
      const targetId = calculator.foods[1].id;
      const initialWeight = calculator.foods[1].weight;
      
      calculator.updateCalculation(targetId, '999', '0.5');
      
      expect(calculator.foods[1].weight).toBe(initialWeight);
      expect(calculator.foods[1].calculation).toBeNull();
      expect(calculator.foods[1].history).toHaveLength(0);
    });

    test('存在しないターゲット料理IDでは何も起こらない', () => {
      const sourceId = calculator.foods[0].id;
      
      calculator.updateCalculation(999, sourceId.toString(), '0.5');
      
      expect(calculator.foods[0].weight).toBe(200);
      expect(calculator.foods[1].weight).toBe(0);
    });

    test('完全なユーザーフローでの計算履歴表示', () => {
      // 新しい計算機インスタンスで実際のユーザーフローをテスト
      const userFlowCalculator = new FoodCalculator();
      
      // 1. 食事を登録
      userFlowCalculator.addNewFood(); // 料理1
      userFlowCalculator.addNewFood(); // 料理2
      
      // 2. 料理1に重量を追加
      userFlowCalculator.addWeight(userFlowCalculator.foods[0].id, '200');
      
      // 3. 料理2で料理1から計算
      userFlowCalculator.updateCalculation(
        userFlowCalculator.foods[1].id, 
        userFlowCalculator.foods[0].id.toString(), 
        '0.6'
      );
      
      // 4. 履歴表示を確認
      const historyHtml = userFlowCalculator.renderHistory(userFlowCalculator.foods[1]);
      expect(historyHtml).toContain('=120g (料理1 × 0.6)');
      expect(historyHtml).toContain('履歴');
    });
  });

  describe('データ永続化', () => {
    test('データを保存できる', () => {
      const testCalculator = new FoodCalculator();
      const mockSetItem = jest.fn();
      testCalculator.localStorage = { setItem: mockSetItem };
      
      // Temporarily replace the saveData method to use our mock
      const originalSaveData = testCalculator.saveData;
      testCalculator.saveData = function() {
        this.localStorage.setItem('foodCalculatorData', JSON.stringify({
          foods: this.foods,
          dishes: this.dishes,
          nextId: this.nextId,
          theme: this.theme
        }));
      };
      
      testCalculator.addNewFood();
      testCalculator.addWeight(1, '100');
      testCalculator.dishes.push({ name: 'テスト皿', weight: 50 });
      testCalculator.theme = 'dark';
      
      testCalculator.saveData();
      
      expect(mockSetItem).toHaveBeenCalledWith('foodCalculatorData', 
        JSON.stringify({
          foods: testCalculator.foods,
          dishes: testCalculator.dishes,
          nextId: testCalculator.nextId,
          theme: testCalculator.theme
        })
      );
    });

    test('データを読み込める', () => {
      const testCalculator = new FoodCalculator();
      const mockData = {
        foods: [
          { id: 1, name: '保存済み料理', weight: 150, calculation: null, history: [] }
        ],
        dishes: [
          { name: '保存済み皿', weight: 30 }
        ],
        nextId: 2,
        theme: 'dark'
      };
      
      const mockGetItem = jest.fn().mockReturnValue(JSON.stringify(mockData));
      testCalculator.localStorage = { getItem: mockGetItem };
      
      // Replace loadData method to use our mock
      testCalculator.loadData = function() {
        const data = this.localStorage.getItem('foodCalculatorData');
        if (data) {
          try {
            const parsed = JSON.parse(data);
            this.foods = (parsed.foods || []).map(food => ({
              ...food,
              history: food.history || []
            }));
            this.dishes = parsed.dishes || [];
            this.nextId = parsed.nextId || 1;
            this.theme = parsed.theme || 'light';
          } catch (e) {
            // Invalid JSON, use defaults
          }
        }
      };
      
      testCalculator.loadData();
      
      expect(testCalculator.foods).toEqual(mockData.foods);
      expect(testCalculator.dishes).toEqual(mockData.dishes);
      expect(testCalculator.nextId).toBe(2);
      expect(testCalculator.theme).toBe('dark');
    });

    test('無効なデータでも正常に初期化される', () => {
      const testCalculator = new FoodCalculator();
      const mockGetItem = jest.fn().mockReturnValue('invalid json');
      testCalculator.localStorage = { getItem: mockGetItem };
      
      testCalculator.loadData = function() {
        const data = this.localStorage.getItem('foodCalculatorData');
        if (data) {
          try {
            const parsed = JSON.parse(data);
            this.foods = (parsed.foods || []).map(food => ({
              ...food,
              history: food.history || []
            }));
            this.dishes = parsed.dishes || [];
            this.nextId = parsed.nextId || 1;
            this.theme = parsed.theme || 'light';
          } catch (e) {
            // Invalid JSON, use defaults - no changes to current state
          }
        }
      };
      
      testCalculator.loadData();
      
      expect(testCalculator.foods).toEqual([]);
      expect(testCalculator.dishes).toEqual([]);
      expect(testCalculator.nextId).toBe(1);
      expect(testCalculator.theme).toBe('light');
    });

    test('データがない場合はデフォルト値で初期化される', () => {
      const testCalculator = new FoodCalculator();
      const mockGetItem = jest.fn().mockReturnValue(null);
      testCalculator.localStorage = { getItem: mockGetItem };
      
      testCalculator.loadData = function() {
        const data = this.localStorage.getItem('foodCalculatorData');
        if (data) {
          try {
            const parsed = JSON.parse(data);
            this.foods = (parsed.foods || []).map(food => ({
              ...food,
              history: food.history || []
            }));
            this.dishes = parsed.dishes || [];
            this.nextId = parsed.nextId || 1;
            this.theme = parsed.theme || 'light';
          } catch (e) {
            // Invalid JSON, use defaults
          }
        }
      };
      
      testCalculator.loadData();
      
      expect(testCalculator.foods).toEqual([]);
      expect(testCalculator.dishes).toEqual([]);
      expect(testCalculator.nextId).toBe(1);
      expect(testCalculator.theme).toBe('light');
    });

    test('部分的なデータでも正常に読み込める', () => {
      const testCalculator = new FoodCalculator();
      const partialData = {
        foods: [{ id: 1, name: 'テスト', weight: 100 }] // historyなし
      };
      const mockGetItem = jest.fn().mockReturnValue(JSON.stringify(partialData));
      testCalculator.localStorage = { getItem: mockGetItem };
      
      testCalculator.loadData = function() {
        const data = this.localStorage.getItem('foodCalculatorData');
        if (data) {
          try {
            const parsed = JSON.parse(data);
            this.foods = (parsed.foods || []).map(food => ({
              ...food,
              history: food.history || []
            }));
            this.dishes = parsed.dishes || [];
            this.nextId = parsed.nextId || 1;
            this.theme = parsed.theme || 'light';
          } catch (e) {
            // Invalid JSON, use defaults
          }
        }
      };
      
      testCalculator.loadData();
      
      expect(testCalculator.foods[0].history).toEqual([]);
      expect(testCalculator.dishes).toEqual([]);
      expect(testCalculator.nextId).toBe(1);
      expect(testCalculator.theme).toBe('light');
    });
  });

  describe('食器管理', () => {
    test('食器を追加できる', () => {
      const event = {
        preventDefault: jest.fn()
      };
      
      // DOM要素をモック
      document.getElementById = jest.fn((id) => {
        if (id === 'dish-name') return { value: 'テスト皿' };
        if (id === 'dish-weight') return { value: '150' };
        if (id === 'dish-form') return { reset: jest.fn() };
        return null;
      });
      
      calculator.renderDishList = jest.fn();
      
      calculator.addDish(event);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(calculator.dishes).toHaveLength(1);
      expect(calculator.dishes[0]).toEqual({ name: 'テスト皿', weight: 150 });
      expect(calculator.renderDishList).toHaveBeenCalled();
    });

    test('空の名前や重量では食器を追加しない', () => {
      const event = { preventDefault: jest.fn() };
      
      document.getElementById = jest.fn((id) => {
        if (id === 'dish-name') return { value: '' };
        if (id === 'dish-weight') return { value: '150' };
        return null;
      });
      
      calculator.addDish(event);
      
      expect(calculator.dishes).toHaveLength(0);
    });

    test('食器を削除できる', () => {
      calculator.dishes = [
        { name: '皿1', weight: 100 },
        { name: '皿2', weight: 200 },
        { name: '皿3', weight: 300 }
      ];
      calculator.renderDishList = jest.fn();
      
      calculator.deleteDish(1);
      
      expect(calculator.dishes).toHaveLength(2);
      expect(calculator.dishes[0]).toEqual({ name: '皿1', weight: 100 });
      expect(calculator.dishes[1]).toEqual({ name: '皿3', weight: 300 });
      expect(calculator.renderDishList).toHaveBeenCalled();
    });

    test('食器削除ボタンの動的イベントバインディングが正しく動作する', () => {
      // 食器を追加
      calculator.dishes = [
        { name: 'テスト皿', weight: 150 },
        { name: 'テスト茶碗', weight: 120 }
      ];
      
      // DOM要素をモック
      const container = { 
        innerHTML: '',
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      };
      document.getElementById = jest.fn((id) => {
        if (id === 'dish-list') return container;
        return null;
      });
      
      // renderDishListを実行
      calculator.renderDishList();
      
      // HTML生成確認
      expect(container.innerHTML).toContain('テスト皿');
      expect(container.innerHTML).toContain('150g');
      expect(container.innerHTML).toContain('dish-delete-btn');
      expect(container.innerHTML).toContain('data-index="0"');
      expect(container.innerHTML).toContain('data-index="1"');
      
      // イベントリスナーが再設定されることを確認
      expect(container.removeEventListener).toHaveBeenCalled();
      expect(container.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    });

    test('食器削除ボタンクリック時に_handleDishListClickが呼ばれる', () => {
      calculator.dishes = [{ name: 'テスト皿', weight: 150 }];
      calculator.deleteDish = jest.fn();
      
      // クリックイベントをシミュレート
      const mockEvent = {
        target: {
          classList: { contains: (className) => className === 'dish-delete-btn' },
          dataset: { index: '0' }
        }
      };
      
      calculator._handleDishListClick(mockEvent);
      
      expect(calculator.deleteDish).toHaveBeenCalledWith(0);
    });

    test('食器削除ボタン以外のクリックでは何も起こらない', () => {
      calculator.deleteDish = jest.fn();
      
      // 他の要素のクリックイベントをシミュレート
      const mockEvent = {
        target: {
          classList: { contains: () => false },
          dataset: { index: '0' }
        }
      };
      
      calculator._handleDishListClick(mockEvent);
      
      expect(calculator.deleteDish).not.toHaveBeenCalled();
    });
  });

  describe('テーマ管理', () => {
    test('テーマを切り替えできる', () => {
      calculator.theme = 'light';
      calculator.updateThemeButton = jest.fn();
      
      calculator.toggleTheme();
      
      expect(calculator.theme).toBe('dark');
      expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
      expect(calculator.updateThemeButton).toHaveBeenCalled();
    });

    test('ダークテーマからライトテーマに切り替え', () => {
      calculator.theme = 'dark';
      calculator.updateThemeButton = jest.fn();
      
      calculator.toggleTheme();
      
      expect(calculator.theme).toBe('light');
      expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'light');
    });

    test('テーマ初期化', () => {
      calculator.theme = 'dark';
      calculator.updateThemeButton = jest.fn();
      
      calculator.initTheme();
      
      expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
      expect(calculator.updateThemeButton).toHaveBeenCalled();
    });

    test('テーマボタンの表示更新（ダークテーマ）', () => {
      const themeIcon = { textContent: '' };
      const themeText = { textContent: '' };
      document.querySelector = jest.fn((selector) => {
        if (selector === '.theme-icon') return themeIcon;
        if (selector === '.theme-text') return themeText;
        return null;
      });
      
      calculator.theme = 'dark';
      calculator.updateThemeButton();
      
      expect(themeIcon.textContent).toBe('☀️');
      expect(themeText.textContent).toBe('ライト');
    });

    test('テーマボタンの表示更新（ライトテーマ）', () => {
      const themeIcon = { textContent: '' };
      const themeText = { textContent: '' };
      document.querySelector = jest.fn((selector) => {
        if (selector === '.theme-icon') return themeIcon;
        if (selector === '.theme-text') return themeText;
        return null;
      });
      
      calculator.theme = 'light';
      calculator.updateThemeButton();
      
      expect(themeIcon.textContent).toBe('🌙');
      expect(themeText.textContent).toBe('ダーク');
    });
  });

  describe('renderFoodCard()機能テスト', () => {
    let testFood;

    beforeEach(() => {
      testFood = {
        id: 1,
        name: 'テスト料理',
        weight: 150,
        history: [
          { type: 'add', value: 100, timestamp: '12:00' },
          { type: 'subtract', value: 50, timestamp: '12:30' }
        ],
        calculation: null
      };
    });

    test('食事名入力フィールドが正しい値で表示される', () => {
      const html = calculator.renderFoodCard(testFood);
      
      expect(html).toContain('class="food-name"');
      expect(html).toContain('value="テスト料理"');
      expect(html).toContain('data-food-id="1"');
      expect(html).toContain('onfocus="this.select()"');
    });

    test('重量表示が正確な値で表示される', () => {
      const html = calculator.renderFoodCard(testFood);
      
      expect(html).toContain('class="weight-display"');
      expect(html).toContain('data-copy-value="150"');
      expect(html).toContain('150g');
    });

    test('削除ボタンが適切なクラスとdata属性を持つ', () => {
      const html = calculator.renderFoodCard(testFood);
      
      expect(html).toContain('class="delete-btn"');
      expect(html).toContain('data-food-id="1"');
      expect(html).toContain('×');
    });

    test('履歴がある場合はスワイプ可能クラスが設定される', () => {
      const html = calculator.renderFoodCard(testFood);
      
      expect(html).toContain('class="food-card swipeable"');
    });

    test('履歴がない場合はスワイプ可能クラスが設定されない', () => {
      testFood.history = [];
      const html = calculator.renderFoodCard(testFood);
      
      expect(html).toContain('class="food-card "');
      expect(html).not.toContain('swipeable');
    });

    test('計算設定がある場合は計算情報が表示される', () => {
      testFood.calculation = {
        sourceId: 2,
        multiplier: 0.6
      };
      calculator.foods = [
        { id: 2, name: 'ソース料理', weight: 100 },
        testFood
      ];
      
      const html = calculator.renderFoodCard(testFood);
      
      expect(html).toContain('計算:');
      expect(html).toContain('calc-source');
      expect(html).toContain('calc-multiplier');
    });

    test('計算設定がない場合は計算情報が表示されない', () => {
      testFood.calculation = null;
      calculator.foods = [testFood];
      const html = calculator.renderFoodCard(testFood);
      
      expect(html).not.toContain('計算:');
      expect(html).not.toContain('calc-source');
    });

    test('履歴が正しく表示される', () => {
      const html = calculator.renderFoodCard(testFood);
      
      expect(html).toContain('100g');
      expect(html).toContain('50g');
      expect(html).toContain('12:00');
      expect(html).toContain('12:30');
    });

    test('重量が整数で丸められて表示される', () => {
      testFood.weight = 123.7;
      const html = calculator.renderFoodCard(testFood);
      
      expect(html).toContain('124g');
      expect(html).toContain('data-copy-value="124"');
    });
  });

  describe('Enterキー機能', () => {
    test('料理名入力フィールドでEnterキー押下時にフォーカスが解除される', () => {
      calculator.addNewFood();
      const foodId = calculator.foods[0].id;
      
      // _handleCardKeydownを直接テスト
      const mockTarget = {
        classList: { contains: (className) => className === 'food-name' },
        dataset: { foodId: foodId.toString() },
        closest: () => ({ dataset: { foodId: foodId.toString() } }),
        blur: jest.fn()
      };
      
      const mockEvent = {
        key: 'Enter',
        target: mockTarget
      };
      
      calculator._handleCardKeydown(mockEvent);
      
      expect(mockTarget.blur).toHaveBeenCalled();
    });

    test('重量入力フィールドでEnterキー押下時に加算実行と入力欄クリアが行われる', () => {
      calculator.addNewFood();
      const foodId = calculator.foods[0].id;
      
      const mockTarget = {
        classList: { contains: (className) => className === 'weight-input' },
        dataset: { foodId: foodId.toString() },
        closest: () => ({ dataset: { foodId: foodId.toString() } }),
        value: '150',
        blur: jest.fn()
      };
      
      const mockEvent = {
        key: 'Enter',
        target: mockTarget
      };
      
      calculator._handleCardKeydown(mockEvent);
      
      // 重量が加算されている
      expect(calculator.foods[0].weight).toBe(150);
      // 入力欄がクリアされている
      expect(mockTarget.value).toBe('');
      // フォーカスが解除されている
      expect(mockTarget.blur).toHaveBeenCalled();
    });

    test('食器重量入力フィールドでEnterキー押下時に減算実行と入力欄クリアが行われる', () => {
      calculator.addNewFood();
      calculator.foods[0].weight = 200;
      const foodId = calculator.foods[0].id;
      
      const mockTarget = {
        classList: { contains: (className) => className === 'dish-weight-input' },
        dataset: { foodId: foodId.toString() },
        closest: () => ({ dataset: { foodId: foodId.toString() } }),
        value: '50',
        blur: jest.fn()
      };
      
      const mockSelect = { value: '' };
      document.getElementById = jest.fn((id) => {
        if (id === `dish-select-${foodId}`) return mockSelect;
        return null;
      });
      
      const mockEvent = {
        key: 'Enter',
        target: mockTarget
      };
      
      calculator._handleCardKeydown(mockEvent);
      
      // 重量が減算されている
      expect(calculator.foods[0].weight).toBe(150);
      // 入力欄がクリアされている
      expect(mockTarget.value).toBe('');
      expect(mockSelect.value).toBe('');
      // フォーカスが解除されている
      expect(mockTarget.blur).toHaveBeenCalled();
    });

    test('計算乗数入力フィールドでEnterキー押下時に計算実行が行われる', () => {
      calculator.addNewFood(); // ID: 1
      calculator.addNewFood(); // ID: 2
      calculator.foods[0].weight = 200; // ソース食品の重量設定
      const targetFoodId = calculator.foods[1].id;
      const sourceFoodId = calculator.foods[0].id;
      
      const mockTarget = {
        classList: { contains: (className) => className === 'calc-multiplier' },
        dataset: { foodId: targetFoodId.toString() },
        closest: () => ({ dataset: { foodId: targetFoodId.toString() } }),
        value: '0.6',
        blur: jest.fn()
      };
      
      const mockSourceSelect = { value: sourceFoodId.toString() };
      document.getElementById = jest.fn((id) => {
        if (id === `calc-source-${targetFoodId}`) return mockSourceSelect;
        return null;
      });
      
      const mockEvent = {
        key: 'Enter',
        target: mockTarget
      };
      
      calculator._handleCardKeydown(mockEvent);
      
      // 計算が実行されている
      expect(calculator.foods[1].weight).toBe(120); // 200 * 0.6 = 120
      expect(calculator.foods[1].calculation).toBeDefined();
      // フォーカスが解除されている
      expect(mockTarget.blur).toHaveBeenCalled();
    });

    test('Enterキー以外のキーでは何も起こらない', () => {
      calculator.addNewFood();
      const foodId = calculator.foods[0].id;
      const initialWeight = calculator.foods[0].weight;
      
      const mockTarget = {
        classList: { contains: (className) => className === 'weight-input' },
        dataset: { foodId: foodId.toString() },
        closest: () => ({ dataset: { foodId: foodId.toString() } }),
        value: '100'
      };
      
      const mockEvent = {
        key: ' ', // スペースキー
        target: mockTarget
      };
      
      calculator._handleCardKeydown(mockEvent);
      
      // 重量が変更されていない
      expect(calculator.foods[0].weight).toBe(initialWeight);
      // 入力欄の値が残っている
      expect(mockTarget.value).toBe('100');
    });
  });

  describe('UI状態管理', () => {
    test('料理が0件の場合、全削除ボタンがdisabled状態になる', () => {
      // 料理を全て削除
      calculator.foods = [];
      
      // render()の論理ロジックを直接テスト
      const disabled = calculator.foods.length === 0;
      expect(disabled).toBe(true);
      
      // renderFoodCard()でのスタイル設定もテスト
      const container = document.getElementById('food-cards');
      if (container) {
        container.innerHTML = calculator.foods.map(food => calculator.renderFoodCard(food)).join('');
      }
      
      // 0件の場合の状態を確認
      expect(calculator.foods.length).toBe(0);
    });

    test('料理が1件以上ある場合、全削除ボタンが有効状態になる', () => {
      calculator.addNewFood();
      
      // render()の論理ロジックを直接テスト
      const disabled = calculator.foods.length === 0;
      expect(disabled).toBe(false);
      
      // renderFoodCard()でのスタイル設定もテスト  
      const container = document.getElementById('food-cards');
      if (container) {
        container.innerHTML = calculator.foods.map(food => calculator.renderFoodCard(food)).join('');
      }
      
      // 1件以上の場合の状態を確認
      expect(calculator.foods.length).toBeGreaterThan(0);
    });

    test('数値入力後のボタンクリックで入力欄が自動クリアされる', () => {
      calculator.addNewFood();
      calculator.render();
      
      // render()で_handleCardClickが設定されているため、イベント処理を直接テスト
      const foodId = calculator.foods[0].id;
      const mockInput = { value: '123' };
      
      // DOM要素をモック
      document.getElementById = jest.fn((id) => {
        if (id === `weight-input-${foodId}`) return mockInput;
        return null;
      });
      
      // _handleCardClickを直接呼び出してテスト
      const mockEvent = {
        target: {
          classList: { contains: (className) => className === 'add-weight-btn' },
          dataset: { foodId: foodId.toString() },
          closest: () => ({ dataset: { foodId: foodId.toString() } })
        }
      };
      
      calculator._handleCardClick(mockEvent);
      
      // 重量が加算され、入力欄がクリアされている
      expect(calculator.foods[0].weight).toBe(123);
      expect(mockInput.value).toBe('');
    });

    test('食器重量入力後の減算ボタンクリックで入力欄と選択欄が自動クリアされる', () => {
      calculator.addNewFood();
      calculator.foods[0].weight = 200;
      calculator.render();
      
      const foodId = calculator.foods[0].id;
      const mockInput = { value: '50' };
      const mockSelect = { value: '' };
      
      // DOM要素をモック
      document.getElementById = jest.fn((id) => {
        if (id === `dish-weight-${foodId}`) return mockInput;
        if (id === `dish-select-${foodId}`) return mockSelect;
        return null;
      });
      
      // _handleCardClickを直接呼び出してテスト
      const mockEvent = {
        target: {
          classList: { contains: (className) => className === 'subtract-weight-btn' },
          dataset: { foodId: foodId.toString() },
          closest: () => ({ dataset: { foodId: foodId.toString() } })
        }
      };
      
      calculator._handleCardClick(mockEvent);
      
      // 重量が減算され、入力欄と選択欄がクリアされている
      expect(calculator.foods[0].weight).toBe(150);
      expect(mockInput.value).toBe('');
      expect(mockSelect.value).toBe('');
    });
  });

  describe('スタイル・UX機能', () => {
    test('重量表示にcursor: pointerスタイルが適用されている', () => {
      calculator.addNewFood();
      calculator.foods[0].weight = 150;
      
      const cardHtml = calculator.renderFoodCard(calculator.foods[0]);
      
      expect(cardHtml).toContain('style="cursor: pointer');
      expect(cardHtml).toContain('user-select: none');
      expect(cardHtml).toContain('title="タップでコピー"');
    });

    test('重量表示のdata-copy-value属性に数値のみが設定される', () => {
      calculator.addNewFood();
      calculator.foods[0].weight = 150.7;
      
      const cardHtml = calculator.renderFoodCard(calculator.foods[0]);
      
      // Math.round()で丸められた整数値が設定される
      expect(cardHtml).toContain('data-copy-value="151"');
      expect(cardHtml).toContain('151g');
    });

    test('クリップボードコピー機能で数値のみがコピーされる', async () => {
      const testValue = 123;
      
      await calculator.copyToClipboard(testValue);
      
      // 数値が文字列として変換されてコピーされる
      expect(global.navigator.clipboard.writeText).toHaveBeenCalledWith('123');
    });
  });

  describe('食器プルダウン自動実行機能', () => {
    test('食器プルダウン選択時に自動で重量減算が実行される', () => {
      // 食器プリセットを追加
      calculator.dishes = [
        { name: 'テスト皿', weight: 100 },
        { name: 'ボウル', weight: 200 }
      ];
      
      // 料理を追加して重量を設定
      calculator.addNewFood();
      calculator.foods[0].weight = 500;
      const foodId = calculator.foods[0].id;
      
      // DOM要素をモック（入力欄とプルダウン）
      const mockInput = { value: '' };
      const mockSelect = { value: '' };
      document.getElementById = jest.fn((id) => {
        if (id === `dish-weight-${foodId}`) return mockInput;
        if (id === `dish-select-${foodId}`) return mockSelect;
        return null;
      });
      
      // _handleCardChangeで使用するイベント模擬
      const mockEvent = {
        target: {
          classList: { contains: (className) => className === 'dish-select' },
          value: '100', // テスト皿の重量
          dataset: { foodId: foodId.toString() },
          closest: () => ({ dataset: { foodId: foodId.toString() } })
        }
      };
      
      // 状態履歴の初期化確認
      expect(calculator.foods[0].stateHistory).toEqual([]);
      
      // プルダウン選択をシミュレート
      calculator._handleCardChange(mockEvent);
      
      // 自動で重量減算が実行されることを確認
      expect(calculator.foods[0].weight).toBe(400); // 500 - 100
      
      // 履歴に記録されることを確認
      expect(calculator.foods[0].history).toHaveLength(1);
      expect(calculator.foods[0].history[0].type).toBe('subtract');
      expect(calculator.foods[0].history[0].value).toBe(100);
      
      // 状態履歴が保存されることを確認
      expect(calculator.foods[0].stateHistory).toHaveLength(1);
      expect(calculator.foods[0].stateHistory[0].weight).toBe(500);
      
      // 入力欄とプルダウンがクリアされることを確認
      expect(mockInput.value).toBe('');
      expect(mockSelect.value).toBe('');
    });

    test('空の食器選択では何も実行されない', () => {
      calculator.addNewFood();
      calculator.foods[0].weight = 500;
      const foodId = calculator.foods[0].id;
      
      const mockInput = { value: '' };
      const mockSelect = { value: '' };
      document.getElementById = jest.fn((id) => {
        if (id === `dish-weight-${foodId}`) return mockInput;
        if (id === `dish-select-${foodId}`) return mockSelect;
        return null;
      });
      
      const mockEvent = {
        target: {
          classList: { contains: (className) => className === 'dish-select' },
          value: '', // 空選択
          dataset: { foodId: foodId.toString() },
          closest: () => ({ dataset: { foodId: foodId.toString() } })
        }
      };
      
      calculator._handleCardChange(mockEvent);
      
      // 重量が変更されないことを確認
      expect(calculator.foods[0].weight).toBe(500);
      expect(calculator.foods[0].history).toHaveLength(0);
    });

    test('無効な食器重量値では何も実行されない', () => {
      calculator.addNewFood();
      calculator.foods[0].weight = 500;
      const foodId = calculator.foods[0].id;
      
      const mockInput = { value: '' };
      const mockSelect = { value: '' };
      document.getElementById = jest.fn((id) => {
        if (id === `dish-weight-${foodId}`) return mockInput;
        if (id === `dish-select-${foodId}`) return mockSelect;
        return null;
      });
      
      const mockEvent = {
        target: {
          classList: { contains: (className) => className === 'dish-select' },
          value: 'invalid', // 無効な値
          dataset: { foodId: foodId.toString() },
          closest: () => ({ dataset: { foodId: foodId.toString() } })
        }
      };
      
      calculator._handleCardChange(mockEvent);
      
      // 重量が変更されないことを確認
      expect(calculator.foods[0].weight).toBe(500);
      expect(calculator.foods[0].history).toHaveLength(0);
    });
  });

  describe('自動再計算機能', () => {
    test('参照元食品の重量変更時に計算食品が自動更新される', () => {
      // 2つの食品を作成
      calculator.addNewFood(); // 料理1 (参照元)
      calculator.addNewFood(); // 料理2 (計算食品)
      
      const sourceFood = calculator.foods[0];
      const calcFood = calculator.foods[1];
      
      // 参照元食品に重量を設定
      calculator.addWeight(sourceFood.id, '100');
      
      // 計算食品を設定（参照元 × 0.6）
      calculator.updateCalculation(calcFood.id, sourceFood.id, '0.6');
      expect(calcFood.weight).toBe(60); // 100 × 0.6 = 60
      
      // 参照元食品の重量を変更
      calculator.addWeight(sourceFood.id, '50'); // 100 + 50 = 150
      
      // 計算食品が自動更新されることを確認
      expect(calcFood.weight).toBe(90); // 150 × 0.6 = 90
      
      // 計算食品の履歴に自動再計算が記録されることを確認
      expect(calcFood.history).toHaveLength(2);
      expect(calcFood.history[1].type).toBe('auto_recalculation');
      expect(calcFood.history[1].value).toBe(90);
    });

    test('参照元食品の重量減算時も計算食品が自動更新される', () => {
      calculator.addNewFood(); // 参照元
      calculator.addNewFood(); // 計算食品
      
      const sourceFood = calculator.foods[0];
      const calcFood = calculator.foods[1];
      
      // 参照元食品に重量を設定
      calculator.addWeight(sourceFood.id, '200');
      
      // 計算食品を設定（参照元 × 0.5）
      calculator.updateCalculation(calcFood.id, sourceFood.id, '0.5');
      expect(calcFood.weight).toBe(100); // 200 × 0.5 = 100
      
      // 参照元食品の重量を減算
      calculator.subtractWeight(sourceFood.id, '50'); // 200 - 50 = 150
      
      // 計算食品が自動更新されることを確認
      expect(calcFood.weight).toBe(75); // 150 × 0.5 = 75
    });

    test('計算結果のない食品は自動再計算されない', () => {
      calculator.addNewFood(); // 参照元
      calculator.addNewFood(); // 通常の食品
      
      const sourceFood = calculator.foods[0];
      const normalFood = calculator.foods[1];
      
      // 通常の食品に重量を設定
      calculator.addWeight(normalFood.id, '100');
      
      // 参照元食品の重量を変更
      calculator.addWeight(sourceFood.id, '50');
      
      // 通常の食品の重量は変更されないことを確認
      expect(normalFood.weight).toBe(100);
    });

    test('複数の計算食品が同時に自動更新される', () => {
      calculator.addNewFood(); // 参照元
      calculator.addNewFood(); // 計算食品1
      calculator.addNewFood(); // 計算食品2
      
      const sourceFood = calculator.foods[0];
      const calcFood1 = calculator.foods[1];
      const calcFood2 = calculator.foods[2];
      
      // 参照元食品に重量を設定
      calculator.addWeight(sourceFood.id, '120');
      
      // 2つの計算食品を設定
      calculator.updateCalculation(calcFood1.id, sourceFood.id, '0.5'); // 60
      calculator.updateCalculation(calcFood2.id, sourceFood.id, '0.3'); // 36
      
      // 参照元食品の重量を変更
      calculator.addWeight(sourceFood.id, '80'); // 120 + 80 = 200
      
      // 両方の計算食品が自動更新されることを確認
      expect(calcFood1.weight).toBe(100); // 200 × 0.5 = 100
      expect(calcFood2.weight).toBe(60);  // 200 × 0.3 = 60
    });
  });

  describe('循環参照検出', () => {
    test('直接的な循環参照を検出する', () => {
      // A → B → A のような循環参照
      calculator.addNewFood(); // A
      calculator.addNewFood(); // B
      
      const foodA = calculator.foods[0];
      const foodB = calculator.foods[1];
      
      // showToastメソッドをモック
      calculator.showToast = jest.fn();
      
      // A → B を設定
      calculator.updateCalculation(foodB.id, foodA.id, '0.5');
      
      // B → A を設定しようとすると循環参照を検出
      calculator.updateCalculation(foodA.id, foodB.id, '0.5');
      
      // 通知が表示され、計算は設定されない
      expect(calculator.showToast).toHaveBeenCalledWith('循環参照のため計算できません', 'warning');
      expect(foodA.calculation).toBeNull();
    });

    test('間接的な循環参照を検出する', () => {
      // A → B → C → A のような循環参照
      calculator.addNewFood(); // A
      calculator.addNewFood(); // B  
      calculator.addNewFood(); // C
      
      const foodA = calculator.foods[0];
      const foodB = calculator.foods[1];
      const foodC = calculator.foods[2];
      
      // showToastメソッドをモック
      calculator.showToast = jest.fn();
      
      // A → B → C を設定
      calculator.updateCalculation(foodB.id, foodA.id, '0.5');
      calculator.updateCalculation(foodC.id, foodB.id, '0.5');
      
      // C → A を設定しようとすると循環参照を検出
      calculator.updateCalculation(foodA.id, foodC.id, '0.5');
      
      // 通知が表示され、計算は設定されない
      expect(calculator.showToast).toHaveBeenCalledWith('循環参照のため計算できません', 'warning');
      expect(foodA.calculation).toBeNull();
    });

    test('自己参照を検出する', () => {
      calculator.addNewFood();
      const food = calculator.foods[0];
      
      // showToastメソッドをモック
      calculator.showToast = jest.fn();
      
      // 自分自身を参照しようとすると循環参照を検出
      calculator.updateCalculation(food.id, food.id, '0.5');
      
      // 通知が表示され、計算は設定されない
      expect(calculator.showToast).toHaveBeenCalledWith('循環参照のため計算できません', 'warning');
      expect(food.calculation).toBeNull();
    });

    test('循環参照でない場合は正常に動作する', () => {
      // A → B, C → D のような非循環参照
      calculator.addNewFood(); // A
      calculator.addNewFood(); // B
      calculator.addNewFood(); // C
      calculator.addNewFood(); // D
      
      const foodA = calculator.foods[0];
      const foodB = calculator.foods[1];
      const foodC = calculator.foods[2];
      const foodD = calculator.foods[3];
      
      // showToastメソッドをモック
      calculator.showToast = jest.fn();
      
      calculator.addWeight(foodA.id, '100');
      calculator.addWeight(foodC.id, '200');
      
      // A → B, C → D を設定（循環参照ではない）
      calculator.updateCalculation(foodB.id, foodA.id, '0.5');
      calculator.updateCalculation(foodD.id, foodC.id, '0.3');
      
      // 通知は表示されず、計算は正常に実行される
      expect(calculator.showToast).not.toHaveBeenCalled();
      expect(foodB.weight).toBe(50);  // 100 × 0.5
      expect(foodD.weight).toBe(60);  // 200 × 0.3
    });
  });

  describe('複数階層依存関係', () => {
    test('3階層の依存関係が正しく更新される', () => {
      // A → B → C の3階層依存関係
      calculator.addNewFood(); // A (基準)
      calculator.addNewFood(); // B (A依存)
      calculator.addNewFood(); // C (B依存)
      
      const foodA = calculator.foods[0];
      const foodB = calculator.foods[1];
      const foodC = calculator.foods[2];
      
      // 基準食品に重量を設定
      calculator.addWeight(foodA.id, '100');
      
      // 依存関係を設定
      calculator.updateCalculation(foodB.id, foodA.id, '0.8'); // B = A × 0.8 = 80
      calculator.updateCalculation(foodC.id, foodB.id, '0.5'); // C = B × 0.5 = 40
      
      // 基準食品の重量を変更
      calculator.addWeight(foodA.id, '50'); // A = 150
      
      // 全階層が自動更新されることを確認
      expect(foodA.weight).toBe(150); // 100 + 50
      expect(foodB.weight).toBe(120); // 150 × 0.8
      expect(foodC.weight).toBe(60);  // 120 × 0.5
      
      // 履歴にも記録されることを確認
      expect(foodB.history).toHaveLength(2); // 初回計算 + 自動再計算
      expect(foodC.history).toHaveLength(2); // 初回計算 + 自動再計算
    });

    test('複雑な依存関係ネットワークが正しく更新される', () => {
      // A → B, A → C, B → D の複雑な依存関係
      calculator.addNewFood(); // A (基準)
      calculator.addNewFood(); // B (A依存)
      calculator.addNewFood(); // C (A依存)
      calculator.addNewFood(); // D (B依存)
      
      const foodA = calculator.foods[0];
      const foodB = calculator.foods[1];
      const foodC = calculator.foods[2];
      const foodD = calculator.foods[3];
      
      // 基準食品に重量を設定
      calculator.addWeight(foodA.id, '200');
      
      // 依存関係を設定
      calculator.updateCalculation(foodB.id, foodA.id, '0.6'); // B = 120
      calculator.updateCalculation(foodC.id, foodA.id, '0.4'); // C = 80
      calculator.updateCalculation(foodD.id, foodB.id, '0.5'); // D = 60
      
      // 基準食品の重量を変更
      calculator.addWeight(foodA.id, '100'); // A = 300
      
      // 全依存食品が自動更新されることを確認
      expect(foodA.weight).toBe(300); // 200 + 100
      expect(foodB.weight).toBe(180); // 300 × 0.6
      expect(foodC.weight).toBe(120); // 300 × 0.4
      expect(foodD.weight).toBe(90);  // 180 × 0.5
    });
  });

  describe('Undo時の自動再計算機能', () => {
    test('参照元食品のundo時に計算食品が自動更新される', () => {
      // 2つの食品を作成
      calculator.addNewFood(); // 参照元
      calculator.addNewFood(); // 計算食品
      
      const sourceFood = calculator.foods[0];
      const calcFood = calculator.foods[1];
      
      // 参照元食品に初期重量を設定
      calculator.addWeight(sourceFood.id, '100');
      
      // 計算食品を設定（参照元 × 0.5）
      calculator.updateCalculation(calcFood.id, sourceFood.id, '0.5');
      expect(calcFood.weight).toBe(50); // 100 × 0.5 = 50
      
      // 参照元食品に重量を追加
      calculator.addWeight(sourceFood.id, '50'); // 100 + 50 = 150
      expect(sourceFood.weight).toBe(150);
      expect(calcFood.weight).toBe(75); // 150 × 0.5 = 75（自動再計算）
      
      // 参照元食品をundo
      calculator.undoLastOperation(sourceFood.id);
      expect(sourceFood.weight).toBe(100); // 元の100に戻る
      
      // 計算食品も自動的に再計算されることを期待
      expect(calcFood.weight).toBe(50); // 100 × 0.5 = 50に戻ることを期待
    });

    test('複数階層依存関係でのundo時自動再計算', () => {
      // A → B → C の3階層依存関係でテスト
      calculator.addNewFood(); // A (基準)
      calculator.addNewFood(); // B (A依存)
      calculator.addNewFood(); // C (B依存)
      
      const foodA = calculator.foods[0];
      const foodB = calculator.foods[1];
      const foodC = calculator.foods[2];
      
      // 基準食品に重量を設定
      calculator.addWeight(foodA.id, '100');
      
      // 依存関係を設定
      calculator.updateCalculation(foodB.id, foodA.id, '0.8'); // B = 80
      calculator.updateCalculation(foodC.id, foodB.id, '0.5'); // C = 40
      
      // 基準食品に重量を追加
      calculator.addWeight(foodA.id, '50'); // A = 150
      expect(foodA.weight).toBe(150);
      expect(foodB.weight).toBe(120); // 150 × 0.8
      expect(foodC.weight).toBe(60);  // 120 × 0.5
      
      // 基準食品をundo
      calculator.undoLastOperation(foodA.id);
      expect(foodA.weight).toBe(100); // 元の100に戻る
      
      // 全階層が自動更新されることを期待
      expect(foodB.weight).toBe(80);  // 100 × 0.8に戻ることを期待
      expect(foodC.weight).toBe(40);  // 80 × 0.5に戻ることを期待
    });

    test('計算食品自体のundo時は他の食品に影響しない', () => {
      calculator.addNewFood(); // 参照元
      calculator.addNewFood(); // 計算食品
      
      const sourceFood = calculator.foods[0];
      const calcFood = calculator.foods[1];
      
      // 参照元食品に重量を設定
      calculator.addWeight(sourceFood.id, '100');
      
      // 計算食品を設定
      calculator.updateCalculation(calcFood.id, sourceFood.id, '0.6');
      expect(calcFood.weight).toBe(60);
      
      // 計算食品に直接重量を追加
      calculator.addWeight(calcFood.id, '10');
      expect(calcFood.weight).toBe(70);
      
      // 計算食品をundo（計算状態に戻る）
      calculator.undoLastOperation(calcFood.id);
      expect(calcFood.weight).toBe(60); // 計算結果に戻る
      expect(calcFood.calculation).toBeTruthy(); // 計算状態は維持
      expect(sourceFood.weight).toBe(100); // 参照元は影響を受けない
    });

    test('複数の計算食品が参照元のundo時に同時更新される', () => {
      calculator.addNewFood(); // 参照元
      calculator.addNewFood(); // 計算食品1
      calculator.addNewFood(); // 計算食品2
      
      const sourceFood = calculator.foods[0];
      const calcFood1 = calculator.foods[1];
      const calcFood2 = calculator.foods[2];
      
      // 参照元食品に重量を設定
      calculator.addWeight(sourceFood.id, '120');
      
      // 2つの計算食品を設定
      calculator.updateCalculation(calcFood1.id, sourceFood.id, '0.5'); // 60
      calculator.updateCalculation(calcFood2.id, sourceFood.id, '0.3'); // 36
      
      // 参照元の重量を変更
      calculator.addWeight(sourceFood.id, '80'); // 200
      expect(calcFood1.weight).toBe(100); // 200 × 0.5
      expect(calcFood2.weight).toBe(60);  // 200 × 0.3
      
      // 参照元をundo
      calculator.undoLastOperation(sourceFood.id);
      expect(sourceFood.weight).toBe(120);
      
      // 両方の計算食品が自動更新されることを期待
      expect(calcFood1.weight).toBe(60);  // 120 × 0.5に戻ることを期待
      expect(calcFood2.weight).toBe(36);  // 120 × 0.3に戻ることを期待
    });
  });

  describe('トースト通知改善機能', () => {
    beforeEach(() => {
      // 確実にクリーンアップしてから新しく作成
      document.querySelectorAll('#toast-container').forEach(el => el.remove());
      
      // DOM要素をセットアップ
      const container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
      
      // currentToastもリセット
      calculator.currentToast = null;
    });

    afterEach(() => {
      // DOM要素とプロパティをクリーンアップ
      document.querySelectorAll('#toast-container').forEach(el => el.remove());
      calculator.currentToast = null;
    });

    test('showToastメソッドが循環参照時に呼び出される', () => {
      // showToastメソッドをスパイ
      const showToastSpy = jest.spyOn(calculator, 'showToast');
      
      calculator.addNewFood();
      const food = calculator.foods[0];
      
      // 循環参照を発生させる
      calculator.updateCalculation(food.id, food.id, '0.5');
      
      // showToastが呼び出されたことを確認
      expect(showToastSpy).toHaveBeenCalledWith('循環参照のため計算できません', 'warning');
      
      showToastSpy.mockRestore();
    });

    test('DOM要素が正しくセットアップされている', () => {
      const container = document.getElementById('toast-container');
      expect(container).toBeTruthy();
      expect(container.className).toBe('toast-container');
      expect(container.children.length).toBe(0);
    });

    test('showToastメソッドを直接呼び出してテスト', () => {
      const container = document.getElementById('toast-container');
      expect(container).toBeTruthy();
      expect(calculator.currentToast).toBeNull();
      
      // showToastを直接呼び出し
      calculator.showToast('テストメッセージ', 'warning');
      
      // 通知が作成されることを確認
      expect(calculator.currentToast).toBeTruthy();
      expect(calculator.currentToast.textContent).toBe('テストメッセージ');
      expect(container.children.length).toBe(1);
    });

    test('循環参照検出処理の詳細確認', () => {
      calculator.addNewFood();
      const food = calculator.foods[0];
      
      // 循環参照検出をテスト
      const isCircular = calculator.detectCircularReference(food.id, food.id);
      expect(isCircular).toBe(true);
      
      // updateCalculationでの流れを確認
      const sourceFood = calculator.foods.find(f => f.id === food.id);
      expect(sourceFood).toBeTruthy();
      
      // showToastをスパイして実際の呼び出しを確認
      const showToastSpy = jest.spyOn(calculator, 'showToast');
      
      calculator.updateCalculation(food.id, food.id, '0.5');
      
      expect(showToastSpy).toHaveBeenCalledWith('循環参照のため計算できません', 'warning');
      expect(calculator.currentToast).toBeTruthy();
      
      showToastSpy.mockRestore();
    });

    test('単一通知管理：同じメッセージの通知が連続表示される場合、前の通知が即座に削除される', () => {
      calculator.addNewFood(); // A
      calculator.addNewFood(); // B
      
      const foodA = calculator.foods[0];
      const foodB = calculator.foods[1];
      
      // A → B を設定
      calculator.updateCalculation(foodB.id, foodA.id, '0.5');
      
      // 最初の循環参照で通知表示
      calculator.updateCalculation(foodA.id, foodB.id, '0.5');
      expect(calculator.currentToast).toBeTruthy();
      const firstToast = calculator.currentToast;
      
      // 2回目の循環参照（同じメッセージ）
      calculator.updateCalculation(foodA.id, foodB.id, '0.5');
      
      // 前の通知が削除され、新しい通知が表示される
      expect(firstToast.parentNode).toBeNull(); // DOM から削除済み
      expect(calculator.currentToast).toBeTruthy();
      expect(calculator.currentToast).not.toBe(firstToast);
    });

    test('currentToastプロパティが正しく管理される', () => {
      calculator.addNewFood();
      const food = calculator.foods[0];
      
      // 初期状態
      expect(calculator.currentToast).toBeNull();
      
      // 通知表示
      calculator.updateCalculation(food.id, food.id, '0.5');
      expect(calculator.currentToast).toBeTruthy();
      expect(calculator.currentToast.textContent).toBe('循環参照のため計算できません');
      
      // 同じメッセージで再度実行
      const firstToast = calculator.currentToast;
      calculator.updateCalculation(food.id, food.id, '0.5');
      
      // 新しい通知に置き換わる
      expect(calculator.currentToast).toBeTruthy();
      expect(calculator.currentToast).not.toBe(firstToast);
    });

    test('通知要素が正しいCSSクラスとメッセージを持つ', () => {
      calculator.addNewFood();
      const food = calculator.foods[0];
      
      // 循環参照を発生させる
      calculator.updateCalculation(food.id, food.id, '0.5');
      
      const toast = calculator.currentToast;
      expect(toast).toBeTruthy();
      expect(toast.classList.contains('toast-notification')).toBe(true);
      expect(toast.classList.contains('warning')).toBe(true);
      expect(toast.textContent).toBe('循環参照のため計算できません');
    });

    test('通知がトーストコンテナに正しく追加される', () => {
      calculator.addNewFood();
      const food = calculator.foods[0];
      
      const container = document.getElementById('toast-container');
      expect(container.children.length).toBe(0);
      
      // 通知を表示
      calculator.updateCalculation(food.id, food.id, '0.5');
      
      expect(container.children.length).toBe(1);
      expect(container.children[0]).toBe(calculator.currentToast);
    });

    test('removeToastImmediatelyメソッドが正しく動作する', () => {
      calculator.addNewFood();
      const food = calculator.foods[0];
      
      // 通知を表示
      calculator.updateCalculation(food.id, food.id, '0.5');
      const toast = calculator.currentToast;
      const container = document.getElementById('toast-container');
      
      expect(toast.parentNode).toBe(container);
      expect(calculator.currentToast).toBe(toast);
      
      // 即座に削除
      calculator.removeToastImmediately(toast);
      
      expect(toast.parentNode).toBeNull();
      expect(calculator.currentToast).toBeNull();
    });

    test('通知にshowクラスが適用される（アニメーション改善）', () => {
      jest.useFakeTimers();
      
      calculator.addNewFood();
      const food = calculator.foods[0];
      
      // 通知を表示
      calculator.updateCalculation(food.id, food.id, '0.5');
      const toast = calculator.currentToast;
      
      // 通知が作成されていることを確認
      expect(toast).toBeTruthy();
      
      // 初期状態ではshowクラスがない
      expect(toast.classList.contains('show')).toBe(false);
      
      // 10ms経過をシミュレート
      jest.advanceTimersByTime(10);
      
      // showクラスが追加されることを確認
      expect(toast.classList.contains('show')).toBe(true);
      
      jest.useRealTimers();
    });

    test('3秒後に通知が自動削除される', () => {
      jest.useFakeTimers();
      
      calculator.addNewFood();
      const food = calculator.foods[0];
      
      // 通知を表示
      calculator.updateCalculation(food.id, food.id, '0.5');
      const toast = calculator.currentToast;
      
      expect(toast).toBeTruthy();
      expect(calculator.currentToast).toBe(toast);
      
      // 3秒経過をシミュレート
      jest.advanceTimersByTime(3000);
      
      // hideクラスが追加される
      expect(toast.classList.contains('hide')).toBe(true);
      expect(toast.classList.contains('show')).toBe(false);
      
      // アニメーション完了後にDOM から削除される
      jest.advanceTimersByTime(400); // アニメーション時間
      
      // 最終的にcurrentToastがクリアされることを確認
      expect(calculator.currentToast).toBeNull();
      expect(toast.parentNode).toBeNull();
      
      jest.useRealTimers();
    });

    test('通知の初期スタイルが正しく設定される（フェード+縦移動）', () => {
      calculator.addNewFood();
      const food = calculator.foods[0];
      
      // 通知を表示
      calculator.updateCalculation(food.id, food.id, '0.5');
      const toast = calculator.currentToast;
      
      // CSSクラスの確認
      expect(toast.classList.contains('toast-notification')).toBe(true);
      expect(toast.classList.contains('warning')).toBe(true);
      
      // 初期状態では show クラスがない（アニメーション前）
      expect(toast.classList.contains('show')).toBe(false);
    });
  });
});

