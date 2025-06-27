const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

// 実際のindex.htmlを読み込み
const htmlPath = path.join(__dirname, 'index.html');
let htmlContent = fs.readFileSync(htmlPath, 'utf8');

// テスト環境用にCSSとJSリンクを除去
htmlContent = htmlContent
  .replace(/<link rel="stylesheet"[^>]*>/g, '') // CSSファイルの読み込みを除去
  .replace(/<script src="script\.js"><\/script>/g, ''); // script.jsの読み込みを除去

const dom = new JSDOM(htmlContent);
global.window = dom.window;
global.document = dom.window.document;

console.log('DOM environment setup completed');
console.log('confirm-modal found:', !!document.getElementById('confirm-modal'));
console.log('clear-all found:', !!document.getElementById('clear-all'));
console.log('theme-icon span found:', !!document.querySelector('.theme-icon'));
console.log('theme-text span found:', !!document.querySelector('.theme-text'));

// Test modal style access
const modal = document.getElementById('confirm-modal');
if (modal) {
  console.log('Modal has style property:', !!modal.style);
  console.log('Modal initial display:', modal.style.display);
  modal.style.display = 'block';
  console.log('Modal display after setting:', modal.style.display);
} else {
  console.log('Modal not found!');
}