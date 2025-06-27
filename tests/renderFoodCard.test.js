// renderFoodCard.test.js
describe('renderFoodCard スナップショットテスト', () => {
  let calculator;

  beforeEach(() => {
    calculator = global.createFoodCalculator();
  });

  test('renderFoodCard の出力が変更されていないこと', () => {
    const food = {
      id: 1,
      name: 'テスト料理',
      weight: 100,
      history: [
        { type: 'add', value: 50, timestamp: '12:00' },
        { type: 'subtract', value: 20, timestamp: '12:30' }
      ],
      calculation: {
        sourceId: 2,
        multiplier: 0.5
      }
    };

    // renderFoodCard の出力をスナップショットと比較
    expect(calculator.renderFoodCard(food)).toMatchSnapshot();
  });

  test('計算設定がない場合のrenderFoodCardの出力が変更されていないこと', () => {
    const food = {
      id: 2,
      name: '計算なし料理',
      weight: 200,
      history: [],
      calculation: null
    };
    expect(calculator.renderFoodCard(food)).toMatchSnapshot();
  });

  test('履歴がない場合のrenderFoodCardの出力が変更されていないこと', () => {
    const food = {
      id: 3,
      name: '履歴なし料理',
      weight: 50,
      history: [],
      calculation: null
    };
    expect(calculator.renderFoodCard(food)).toMatchSnapshot();
  });
});
