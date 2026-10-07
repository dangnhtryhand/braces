'use strict';

// Bound parser nesting and recursive walkers, including caller-supplied ASTs.
const MAX_DEPTH = 100;

module.exports = depth => {
  if (depth > MAX_DEPTH) {
    throw new SyntaxError(`Maximum nesting depth exceeded (${MAX_DEPTH})`);
  }
};
