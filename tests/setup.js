// Jest setup file
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;

// FoodCalculatorクラスをscript.jsから直接インポート
const FoodCalculator = require('../script.js');

// テスト用のFoodCalculatorインスタンス作成関数
global.createFoodCalculator = () => {
  // テスト用にDOM初期化をスキップしたカスタムクラス
  class TestFoodCalculator extends FoodCalculator {
    constructor() {
      super();
    }
    
    init() {
      // DOM初期化をスキップ
      this.loadData();
      // initTheme()もテスト環境では実行しない
      // bindEvents()とrender()はテスト環境では実行しない
    }
    
    render() {
      // テスト環境用の簡略化されたrender
      const container = document.getElementById('food-cards');
      if (container) {
        container.innerHTML = this.foods.map(food => this.renderFoodCard(food)).join('');
      }
      
      // 全削除ボタンの状態を更新
      const clearAllBtn = document.getElementById('clear-all');
      if (clearAllBtn && clearAllBtn.style) {
        if (this.foods.length === 0) {
          clearAllBtn.disabled = true;
          clearAllBtn.style.opacity = '0.5';
        } else {
          clearAllBtn.disabled = false;
          clearAllBtn.style.opacity = '1';
        }
      }
    }
    
    saveData() {
      // テスト環境でもlocalStorage操作を実行
      localStorage.setItem('foodCalculatorData', JSON.stringify({
        foods: this.foods,
        dishes: this.dishes,
        nextId: this.nextId,
        theme: this.theme
      }));
    }
    
    loadData() {
      // テスト環境でもlocalStorage操作を実行
      const data = localStorage.getItem('foodCalculatorData');
      if (data) {
        const parsed = JSON.parse(data);
        this.foods = (parsed.foods || []).map(food => ({
          ...food,
          stateHistory: food.stateHistory || []
        }));
        this.dishes = parsed.dishes || [];
        this.nextId = parsed.nextId || 1;
        this.theme = parsed.theme || 'light';
      }
    }
    
    initTheme() {
      // テスト環境用のテーマ初期化
      if (this.theme) {
        document.documentElement.setAttribute('data-theme', this.theme);
        this.updateThemeButton();
      }
    }
    
    bindEvents() {
      // テスト環境ではDOM操作をスキップ
    }
    
    updateThemeButton() {
      // テスト環境用のテーマボタン更新
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
    
    showConfirmModal() {
      if (this.foods.length === 0) return;
      const modal = document.getElementById('confirm-modal');
      if (modal && modal.style) {
        modal.style.display = 'block';
      }
    }
    
    hideConfirmModal() {
      const modal = document.getElementById('confirm-modal');
      if (modal && modal.style) {
        modal.style.display = 'none';
      }
    }

    // テスト環境用のrenderDishList
    renderDishList() {
      const container = document.getElementById('dish-list');
      if (container) {
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
        if (this._handleDishListClick) {
          container.removeEventListener('click', this._handleDishListClick);
        }
        this._handleDishListClick = this._handleDishListClick.bind(this);
        container.addEventListener('click', this._handleDishListClick);
      }
    }
  }
  
  return new TestFoodCalculator();
};

// テスト用グローバル変数として利用可能にする
global.FoodCalculator = function() {
  return global.createFoodCalculator();
};

// DOM環境のセットアップ（Jest標準のjsdom環境を活用）
const fs = require('fs');
const path = require('path');

// 実際のindex.htmlを読み込み
const htmlPath = path.join(__dirname, '../index.html');

let htmlContent = fs.readFileSync(htmlPath, 'utf8');

// テスト環境用にCSSとJSリンクを除去
htmlContent = htmlContent
  .replace(/<link rel="stylesheet"[^>]*>/g, '') // CSSファイルの読み込みを除去
  .replace(/<script src="script\.js"><\/script>/g, ''); // script.jsの読み込みを除去

// HTMLコンテンツの基本確認
console.log('HTML content loaded:', htmlContent.length, 'characters');

// Jest標準のjsdom環境にHTMLコンテンツを注入
// HTML全体を正しく解析してbody部分を取得
const parser = new DOMParser();
const doc = parser.parseFromString(htmlContent, 'text/html');
document.head.innerHTML = doc.head.innerHTML;
document.body.innerHTML = doc.body.innerHTML;

// DOM初期化完了の確認
console.log('DOM initialized with', Array.from(document.querySelectorAll('[id]')).length, 'elements');

// toast-container要素の存在確認
const toastContainer = document.getElementById('toast-container');
console.log('toast-container found:', !!toastContainer);

// Mock削除：実際のDOM要素を直接使用

// DOM初期化関数をグローバルに公開
global.initializeTestDOM = () => {
  // HTML全体を正しく解析してbody部分を取得
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  document.head.innerHTML = doc.head.innerHTML;
  document.body.innerHTML = doc.body.innerHTML;
};

// TouchEvent\u306e\u30e2\u30c3\u30af\u3092Jest\u74b0\u5883\u7528\u306b\u8a2d\u5b9a
global.TouchEvent = global.TouchEvent || class TouchEvent extends Event {
    constructor(type, eventInitDict) {
        super(type, eventInitDict);
        this.touches = eventInitDict.touches || [];
        this.targetTouches = eventInitDict.targetTouches || [];
        this.changedTouches = eventInitDict.changedTouches || [];
    }
};

// localStorage mock
const localStorageMock = {
  store: {},
  getItem: function(key) {
    return this.store[key] || null;
  },
  setItem: function(key, value) {
    this.store[key] = value.toString();
  },
  removeItem: function(key) {
    delete this.store[key];
  },
  clear: function() {
    this.store = {};
  }
};

global.localStorage = localStorageMock;

// navigator.clipboard mock
if (!global.navigator) {
  global.navigator = {};
}
global.navigator.clipboard = {
  writeText: typeof jest !== 'undefined' ? jest.fn().mockResolvedValue(undefined) : () => Promise.resolve()
};

// document.execCommand mock for clipboard fallback
global.document.execCommand = typeof jest !== 'undefined' ? jest.fn().mockReturnValue(true) : () => true;

// console.log mock to reduce test output noise (disabled for debugging)
// global.console = {
//   ...console,
//   log: typeof jest !== 'undefined' ? jest.fn() : console.log,
//   error: typeof jest !== 'undefined' ? jest.fn() : console.error,
//   warn: typeof jest !== 'undefined' ? jest.fn() : console.warn
// };

// Date mock for consistent timestamps in tests
if (typeof jest !== 'undefined') {
  jest.useFakeTimers();
  // UTC+9 (JST) で12:34になるよう設定
  jest.setSystemTime(new Date('2023-01-01T03:34:00.000Z'));
}

// Mock document.documentElement.setAttribute for theme tests
if (typeof document !== 'undefined' && document.documentElement && document.documentElement.setAttribute) {
  const originalSetAttribute = document.documentElement.setAttribute;
  document.documentElement.setAttribute = typeof jest !== 'undefined' ? 
    jest.fn(originalSetAttribute) : originalSetAttribute;
}