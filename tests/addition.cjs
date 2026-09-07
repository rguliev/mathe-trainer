// Run with: node tests/addition.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const read = (file) => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const app = read('assets/js/app.js');
const context = vm.createContext({ assert });
vm.runInContext(read('assets/js/addition-triplets.js') + '\n' +
  app.slice(app.indexOf('      const ADDITION_TEMPLATES'), app.indexOf('      const MULTIPLICATION_TEMPLATES')) +
  'const additionCandidates = new Map();\n' +
  app.slice(app.indexOf('      function generateAdditionTask'), app.indexOf('      function buildMultiplicationCandidates')) +
  app.slice(app.indexOf('      function randomItem'), app.indexOf('      function formatSeconds')) + `
  const expected = [];
  for (let a = 0; a <= 20; a++) {
    for (let b = a; a + b <= 20; b++) expected.push([a, b, a + b]);
  }
  assert.deepEqual(ADDITION_TRIPLETS, expected);
  assert.equal(ADDITION_TRIPLETS.length, 121);
  for (const limit of [10, 20]) {
    for (const carry of ['any', 'with', 'without']) {
      const candidates = buildAdditionCandidates(limit, carry);
      for (const [a, b, c] of expected) {
        const ones = a % 10 + b % 10;
        const allowed = c <= limit && (carry !== 'with' || ones > 10) &&
          (carry !== 'without' || ones < 10);
        let weight = [a, b, c].some(n => [0, 1, 10].includes(n)) ? 1 : 5;
        if (carry === 'with') weight *= a === 9 || b === 9 ? 3 : 8;
        assert.equal(candidates.filter(x => x.a === a && x.b === b && x.c === c).length,
          allowed ? weight : 0);
      }
    }
  }
  const crossing = buildAdditionCandidates(20, 'with');
  assert.equal(crossing.filter(({ a, b }) => a === 9 || b === 9).length / crossing.length, 0.2);
  additionCandidates.set('test', [{ a: 2, b: 9, c: 11 }]);
  for (const swap of [false, true]) {
    for (let i = 0; i < ADDITION_TEMPLATES.length; i++) {
      const draws = [0, swap ? 0 : 0.9, (i + 0.5) / 5];
      Math.random = () => draws.shift();
      const task = generateAdditionTask({ id: 'test', limit: 20 });
      const base = swap ? { a: 9, b: 2, c: 11 } : { a: 2, b: 9, c: 11 };
      assert.equal(task.display, ADDITION_TEMPLATES[i].render(base));
      assert.equal(task.answer, ADDITION_TEMPLATES[i].answer(base));
      assert.equal(draws.length, 0);
    }
  }
`, context);
console.log('Addition triplets, weights, filters, swaps, and formats passed.');
