// FoodCalculator class is loaded globally in setup.js

describe('ユーティリティ機能とエッジケース', () => {
  let calculator;

  beforeEach(() => {
    calculator = new FoodCalculator();
  });

  describe('クリップボード機能', () => {
    beforeEach(() => {
      // Reset clipboard mock for each test
      global.navigator.clipboard.writeText.mockClear();
      global.document.execCommand.mockClear();
    });

    test('クリップボードにコピーできる（modern API）', async () => {
      await calculator.copyToClipboard('123');
      
      expect(global.navigator.clipboard.writeText).toHaveBeenCalledWith('123');
    });

    test('クリップボードAPIが失敗した場合はフォールバック', async () => {
      global.navigator.clipboard.writeText.mockRejectedValue(new Error('API failed'));
      
      await calculator.copyToClipboard('456');
      
      expect(global.document.execCommand).toHaveBeenCalledWith('copy');
    });

    test('数値も文字列としてコピーされる', async () => {
      await calculator.copyToClipboard(123);
      
      expect(global.navigator.clipboard.writeText).toHaveBeenCalledWith('123');
    });
  });

  describe('履歴機能', () => {
    beforeEach(() => {
      calculator.addNewFood();
    });

    test('履歴は全件表示される（スクロール方式）', () => {
      const foodId = calculator.foods[0].id;
      
      // 7回操作を実行
      for (let i = 1; i <= 7; i++) {
        calculator.addWeight(foodId, i.toString());
      }
      
      const historyHtml = calculator.renderHistory(calculator.foods[0]);
      const historyItems = historyHtml.match(/class="history-item"/g);
      
      expect(historyItems).toHaveLength(7); // 全7件表示
    });

    test('履歴がない場合は空文字を返す', () => {
      const food = { history: [] };
      
      const historyHtml = calculator.renderHistory(food);
      
      expect(historyHtml).toBe('');
    });

    test('履歴がnullの場合は空文字を返す', () => {
      const food = { history: null };
      
      const historyHtml = calculator.renderHistory(food);
      
      expect(historyHtml).toBe('');
    });

    test('加算履歴が正しく表示される', () => {
      const food = {
        history: [
          { type: 'add', value: 100.5, timestamp: '12:34' }
        ]
      };
      
      const historyHtml = calculator.renderHistory(food);
      
      expect(historyHtml).toContain('+101g'); // Math.round(100.5) = 101
      expect(historyHtml).toContain('12:34');
    });

    test('減算履歴が正しく表示される', () => {
      const food = {
        history: [
          { type: 'subtract', value: 50.3, timestamp: '15:30' }
        ]
      };
      
      const historyHtml = calculator.renderHistory(food);
      
      expect(historyHtml).toContain('-50g'); // Math.round(50.3) = 50
      expect(historyHtml).toContain('15:30');
    });

    test('計算履歴が正しく表示される', () => {
      const food = {
        history: [
          { type: 'calculation', value: 125.7, multiplier: 0.6, timestamp: '18:45' }
        ]
      };
      
      const historyHtml = calculator.renderHistory(food);
      
      expect(historyHtml).toContain('=126g (×0.6)'); // Math.round(125.7) = 126
      expect(historyHtml).toContain('18:45');
    });
  });

  describe('Math.round計算ロジック', () => {
    test('重量表示は整数に丸められる', () => {
      calculator.addNewFood();
      const food = calculator.foods[0];
      food.weight = 123.456;
      
      const cardHtml = calculator.renderFoodCard(food);
      
      expect(cardHtml).toContain('123g'); // Math.round(123.456) = 123
      expect(cardHtml).toContain('data-copy-value="123"');
    });

    test('計算結果が正確に丸められる', () => {
      calculator.addNewFood(); // ソース
      calculator.addNewFood(); // ターゲット
      calculator.foods[0].weight = 100.6;
      
      calculator.updateCalculation(2, '1', '0.333');
      
      expect(calculator.foods[1].weight).toBe(33); // Math.round(100.6 * 0.333) = 33
    });

    test('小数点以下の処理が正確', () => {
      const testCases = [
        { input: 123.4, expected: 123 },
        { input: 123.5, expected: 124 },
        { input: 123.6, expected: 124 },
        { input: -123.4, expected: -123 },
        { input: -123.5, expected: -123 },
        { input: -123.6, expected: -124 }
      ];
      
      testCases.forEach(({ input, expected }) => {
        expect(Math.round(input)).toBe(expected);
      });
    });
  });

  describe('エラーハンドリング', () => {
    test('parseFloat失敗時のデフォルト値処理', () => {
      calculator.addNewFood();
      const foodId = calculator.foods[0].id;
      
      const testCases = ['abc', '', null, undefined];
      
      testCases.forEach(invalidValue => {
        const initialWeight = calculator.foods[0].weight;
        calculator.addWeight(foodId, invalidValue);
        expect(calculator.foods[0].weight).toBe(initialWeight);
      });
    });

    test('乗数の無効値処理', () => {
      calculator.addNewFood();
      calculator.addNewFood();
      calculator.foods[0].weight = 100;
      
      calculator.updateCalculation(2, '1', 'invalid');
      
      expect(calculator.foods[1].calculation.multiplier).toBe(1);
      expect(calculator.foods[1].weight).toBe(100);
    });

    test('存在しない要素へのアクセス', () => {
      // 存在しないIDでの操作が例外を投げないことを確認
      expect(() => {
        calculator.updateFoodName(999, 'test');
        calculator.addWeight(999, '100');
        calculator.subtractWeight(999, '50');
        calculator.updateCalculation(999, '1', '0.5');
      }).not.toThrow();
    });
  });

  describe('モーダル管理', () => {
    test('食器設定モーダルを開ける', () => {
      calculator.renderDishList = jest.fn();
      const modal = document.getElementById('dish-modal');
      
      calculator.openDishSettings();
      
      expect(modal.style.display).toBe('block');
      expect(calculator.renderDishList).toHaveBeenCalled();
    });

    test('食器設定モーダルを閉じる', () => {
      const modal = document.getElementById('dish-modal');
      modal.style.display = 'block';
      
      calculator.closeDishSettings();
      
      expect(modal.style.display).toBe('none');
    });
  });

  describe('レンダリング機能', () => {
    test('食品カードが正しく生成される', () => {
      const food = {
        id: 1,
        name: 'テスト料理',
        weight: 150.7,
        calculation: null,
        history: []
      };
      
      const cardHtml = calculator.renderFoodCard(food);
      
      expect(cardHtml).toContain('テスト料理');
      expect(cardHtml).toContain('151g'); // Math.round(150.7)
      expect(cardHtml).toContain('data-copy-value="151"');
    });

    test('計算結果付きの食品カードが正しく生成される', () => {
      const food = {
        id: 1,
        name: 'テスト料理',
        weight: 125.3,
        calculation: { sourceId: 2, multiplier: 0.5 },
        history: []
      };
      
      const cardHtml = calculator.renderFoodCard(food);
      
      expect(cardHtml).toContain('= 125g'); // Math.round(125.3)
    });

    test('食器リストが正しく生成される', () => {
      calculator.dishes = [
        { name: 'テスト皿', weight: 150 },
        { name: '茶碗', weight: 120 }
      ];
      
      // DOM要素をモック
      const container = { innerHTML: '' };
      document.getElementById = jest.fn().mockReturnValue(container);
      
      calculator.renderDishList();
      
      expect(container.innerHTML).toContain('テスト皿');
      expect(container.innerHTML).toContain('150g');
      expect(container.innerHTML).toContain('茶碗');
      expect(container.innerHTML).toContain('120g');
    });
  });
});
