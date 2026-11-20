const assert = require('node:assert/strict');
const test = require('node:test');
const { nextTicketCode } = require('./ticket-code');

test('increments numeric values returned from MySQL as strings', () => {
  assert.equal(nextTicketCode('N', '21111111'), 'N-21111112');
});

test('keeps the minimum three-digit format for new sequences', () => {
  assert.equal(nextTicketCode('P', 1), 'P-002');
});

test('rejects a code that cannot fit in the database column', () => {
  assert.throws(() => nextTicketCode('N', '99999999'), {
    name: 'RangeError',
    message: 'Limite de senhas atingido para esta categoria'
  });
});
