// Test script to debug DOM environment
require('./tests/setup.js');

console.log('Global document defined:', !!global.document);
console.log('Global window defined:', !!global.window);
console.log('confirm-modal in global document:', !!global.document.getElementById('confirm-modal'));
console.log('clear-all in global document:', !!global.document.getElementById('clear-all'));

// Test creating a FoodCalculator instance
const calculator = new FoodCalculator();
console.log('Calculator created successfully:', !!calculator);

// Check specific DOM query
const modal = global.document.getElementById('confirm-modal');
console.log('Modal found:', !!modal);
if (modal) {
  console.log('Modal tagName:', modal.tagName);
  console.log('Modal has style:', !!modal.style);
} else {
  console.log('Modal is null');
}