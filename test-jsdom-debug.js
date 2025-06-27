const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

console.log('Starting JSDOM debug test...');

// 実際のindex.htmlを読み込み
const htmlPath = path.join(__dirname, 'index.html');
console.log('HTML path:', htmlPath);
console.log('HTML file exists:', fs.existsSync(htmlPath));

let htmlContent = fs.readFileSync(htmlPath, 'utf8');
console.log('Original HTML length:', htmlContent.length);

// テスト環境用にCSSとJSリンクを除去
htmlContent = htmlContent
  .replace(/<link rel="stylesheet"[^>]*>/g, '') // CSSファイルの読み込みを除去
  .replace(/<script src="script\.js"><\/script>/g, ''); // script.jsの読み込みを除去

console.log('Modified HTML length:', htmlContent.length);
console.log('HTML content starts with:', htmlContent.substring(0, 100));

try {
  const dom = new JSDOM(htmlContent);
  console.log('JSDOM created successfully');
  
  const document = dom.window.document;
  console.log('Document title:', document.title);
  console.log('Body exists:', !!document.body);
  console.log('Body innerHTML length:', document.body.innerHTML.length);
  console.log('Body tagName:', document.body.tagName);
  
  // 最初の子要素を確認
  const firstChild = document.body.firstElementChild;
  console.log('First child:', firstChild?.tagName, firstChild?.className);
  
  // All elements check
  const allElements = document.querySelectorAll('*');
  console.log('Total elements:', allElements.length);
  
  const elementsWithId = document.querySelectorAll('[id]');
  console.log('Elements with id:', elementsWithId.length);
  
  if (elementsWithId.length > 0) {
    console.log('IDs found:', Array.from(elementsWithId).map(el => el.id));
  }
  
  // Specific element check
  console.log('confirm-modal found:', !!document.getElementById('confirm-modal'));
  console.log('clear-all found:', !!document.getElementById('clear-all'));
  console.log('food-cards found:', !!document.getElementById('food-cards'));
  
} catch (error) {
  console.error('JSDOM error:', error);
}