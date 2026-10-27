/**
 * Violation Checker Logic
 * Pure function to evaluate if actual wage meets or violates statutory expected pay.
 *
 * @param {number} expectedPay - Expected wage calculated based on statutory rates
 * @param {number} actualPay - Wage actually received by the worker
 * @returns {{ violation: boolean, shortfall: number }}
 */
function checkViolation(expectedPay, actualPay) {
  const expected = Number(expectedPay) || 0;
  const actual = Number(actualPay) || 0;

  if (actual < expected) {
    const rawShortfall = expected - actual;
    const shortfall = Math.round(rawShortfall * 100) / 100;
    return {
      violation: true,
      shortfall: shortfall
    };
  }

  return {
    violation: false,
    shortfall: 0
  };
}

module.exports = {
  checkViolation
};
