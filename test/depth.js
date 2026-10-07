'use strict';

require('mocha');
const assert = require('assert').strict;
const braces = require('..');
const nested = (depth, open = '{', close = '}') => open.repeat(depth) + 'a' + close.repeat(depth);
const depthError = { name: 'SyntaxError', message: 'Maximum nesting depth exceeded (100)' };

describe('nesting depth', () => {
  for (const method of ['parse', 'compile', 'expand', 'stringify']) {
    for (const pair of [['{', '}'], ['(', ')'], ['{(', ')}']]) {
      it(`${method} rejects excessive ${pair[0]} nesting below maxLength`, () => {
        assert.throws(() => braces[method](nested(2000, ...pair)), depthError);
      });
    }
    it(`${method} rejects unclosed nested blocks`, () => {
      assert.throws(() => braces[method]('{'.repeat(101)), depthError);
    });
    it(`${method} rejects the first block beyond the boundary`, () => {
      assert.throws(() => braces[method](nested(101)), depthError);
    });
  }

  for (const method of ['compile', 'expand', 'stringify']) {
    it(`${method} guards directly supplied ASTs`, () => {
      const root = { type: 'root', nodes: [] };
      let parent = root;
      for (let depth = 0; depth < 2000; depth++) {
        const child = { type: 'brace', nodes: [], parent, open: true, close: true, commas: 0, ranges: 0 };
        parent.nodes.push(child);
        parent = child;
      }
      parent.nodes.push({ type: 'text', value: 'a' });
      assert.throws(() => braces[method](root), depthError);
    });
  }

  it('accepts exactly 100 nested braces', () => {
    const pattern = nested(100);
    assert.equal(braces.compile(pattern), pattern);
    assert.equal(braces.stringify(pattern), pattern);
    assert.deepEqual(braces.expand(pattern), [pattern]);
  });

  it('does not accumulate depth across siblings', () => {
    assert.equal(braces.compile('{a,b}'.repeat(200)), '(a|b)'.repeat(200));
  });

  it('does not count escaped, quoted, or bracketed braces as nested blocks', () => {
    assert.equal(braces.stringify('\\{'.repeat(200)), '{'.repeat(200));
    assert.equal(braces.stringify('"' + '{'.repeat(200) + '"'), '{'.repeat(200));
    assert.equal(braces.stringify('[' + '{'.repeat(200) + ']'), '[' + '{'.repeat(200) + ']');
  });

  it('continues compiling and expanding ordinary globs and ranges', () => {
    assert.equal(braces.compile('src/*.{ts,tsx}'), 'src/*.(ts|tsx)');
    assert.deepEqual(braces.expand('file-{1..3}.{ts,js}'), [
      'file-1.ts', 'file-1.js', 'file-2.ts', 'file-2.js', 'file-3.ts', 'file-3.js'
    ]);
  });
});
