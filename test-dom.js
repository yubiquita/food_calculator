const { JSDOM } = require('jsdom');
const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8')
  .replace(/<link rel="stylesheet"[^>]*>/g, '')
  .replace(/<script src="script\.js"><\/script>/g, '');

const dom = new JSDOM(html);

console.log('confirm-modal found:', !!dom.window.document.getElementById('confirm-modal'));
console.log('clear-all found:', !!dom.window.document.getElementById('clear-all'));
console.log('theme-icon found:', !!dom.window.document.querySelector('.theme-icon'));
console.log('theme-text found:', !!dom.window.document.querySelector('.theme-text'));
console.log('food-cards found:', !!dom.window.document.getElementById('food-cards'));

// List all elements with id
const allElements = dom.window.document.querySelectorAll('[id]');
console.log('All elements with id:');
allElements.forEach(el => console.log(`  - ${el.id}`));