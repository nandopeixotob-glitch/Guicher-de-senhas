const MAX_TICKET_CODE_LENGTH = 10;

function nextTicketCode(prefix, latestSequence) {
  const sequence = Number(latestSequence);
  if (!Number.isSafeInteger(sequence) || sequence < 0) {
    throw new TypeError('Sequência de senhas inválida');
  }

  const code = `${prefix}-${String(sequence + 1).padStart(3, '0')}`;
  if (code.length > MAX_TICKET_CODE_LENGTH) {
    throw new RangeError('Limite de senhas atingido para esta categoria');
  }

  return code;
}

module.exports = { nextTicketCode };
