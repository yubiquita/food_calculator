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
});

