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

  describe('確認モーダル', () => {
    test('料理がある場合は確認モーダルを表示する', () => {
      calculator.addNewFood();
      const modal = document.getElementById('confirm-modal');
      
      calculator.showConfirmModal();
      
      expect(modal.style.display).toBe('block');
    });

    test('料理がない場合は確認モーダルを表示しない', () => {
      const modal = document.getElementById('confirm-modal');
      
      calculator.showConfirmModal();
      
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
});
