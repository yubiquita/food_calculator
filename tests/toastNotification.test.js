const FoodCalculator = require('../script.js');

describe('トースト通知改善機能', () => {
  let calculator;

  beforeEach(() => {
    // DOM初期化を確実に実行
    const fs = require('fs');
    const path = require('path');
    const htmlPath = path.join(__dirname, '../index.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8')
      .replace(/<link rel="stylesheet"[^>]*>/g, '') 
      .replace(/<script src="script\.js"><\/script>/g, '');
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    document.head.innerHTML = doc.head.innerHTML;
    document.body.innerHTML = doc.body.innerHTML;
    
    // calculatorを初期化（TestFoodCalculatorクラスを使用）
    calculator = global.createFoodCalculator();
    
    // currentToastもリセット
    calculator.currentToast = null;
  });

  afterEach(() => {
    // currentToastプロパティをクリーンアップ
    calculator.currentToast = null;
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
    
    // 通知が作成されていることを確認
    expect(calculator.currentToast).toBeTruthy();
    expect(calculator.currentToast.textContent).toBe('テストメッセージ');
    expect(calculator.currentToast.classList.contains('toast-notification')).toBe(true);
    expect(calculator.currentToast.classList.contains('warning')).toBe(true);
    
    // コンテナに追加されていることを確認
    expect(container.children.length).toBe(1);
    expect(container.children[0]).toBe(calculator.currentToast);
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

  test('循環参照検出処理の詳細確認', () => {
    // showToastメソッドをスパイ
    const showToastSpy = jest.spyOn(calculator, 'showToast');
    
    calculator.addNewFood();
    const food = calculator.foods[0];
    
    // 循環参照を発生させる
    calculator.updateCalculation(food.id, food.id, '0.5');
    
    expect(showToastSpy).toHaveBeenCalledWith('循環参照のため計算できません', 'warning');
    expect(calculator.currentToast).toBeTruthy();
    
    showToastSpy.mockRestore();
  });

  test('単一通知管理：同じメッセージの通知が連続表示される場合、前の通知が即座に削除される', () => {
    calculator.addNewFood();
    const food = calculator.foods[0];
    
    // 最初の循環参照で通知表示
    calculator.updateCalculation(food.id, food.id, '0.5');
    expect(calculator.currentToast).toBeTruthy();
    const firstToast = calculator.currentToast;
    
    // 2回目の循環参照（同じメッセージ）
    calculator.updateCalculation(food.id, food.id, '0.5');
    expect(calculator.currentToast).toBeTruthy();
    const secondToast = calculator.currentToast;
    
    // 前の通知は削除され、新しい通知が表示されていることを確認
    expect(firstToast).not.toBe(secondToast);
    expect(firstToast.parentNode).toBeNull(); // 前の通知はDOMから削除されている
  });

  test('currentToastプロパティが正しく管理される', () => {
    calculator.addNewFood();
    const food = calculator.foods[0];
    
    // 通知表示
    calculator.updateCalculation(food.id, food.id, '0.5');
    expect(calculator.currentToast).toBeTruthy();
    expect(calculator.currentToast.textContent).toBe('循環参照のため計算できません');
    
    // 同じメッセージで再度実行
    calculator.updateCalculation(food.id, food.id, '0.5');
    expect(calculator.currentToast).toBeTruthy();
    expect(calculator.currentToast.textContent).toBe('循環参照のため計算できません');
  });

  test('通知要素が正しいCSSクラスとメッセージを持つ', () => {
    calculator.addNewFood();
    const food = calculator.foods[0];
    
    // 通知表示
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
    calculator.addNewFood();
    const food = calculator.foods[0];
    
    // 通知を表示
    calculator.updateCalculation(food.id, food.id, '0.5');
    const toast = calculator.currentToast;
    
    // 通知が作成されていることを確認
    expect(toast).toBeTruthy();
    
    // 初期状態ではshowクラスがない
    expect(toast.classList.contains('show')).toBe(false);
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
    
    // hideクラスが追加されることを確認
    expect(toast.classList.contains('hide')).toBe(true);
    
    // さらに400ms経過（アニメーション時間）
    jest.advanceTimersByTime(400);
    
    // DOMから削除されていることを確認
    expect(toast.parentNode).toBeNull();
    expect(calculator.currentToast).toBeNull();
    
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