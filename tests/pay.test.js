/**
 * Unit Tests for Pay Calculation and Violation Detection Logic
 */

const { calculateExpectedPay, checkViolation } = require('../logic/payCalculator');

describe('Pay Calculator Logic (logic/payCalculator.js & logic/violationChecker.js)', () => {
  test('calculateExpectedPay returns correct base pay for exactly 8 hours construction', () => {
    const result = calculateExpectedPay(8, 'construction');

    expect(result.regularHours).toBe(8);
    expect(result.overtimeHours).toBe(0);
    expect(result.basePay).toBe(563);
    expect(result.overtimePay).toBe(0);
    expect(result.totalExpected).toBe(563);
  });

  test('calculateExpectedPay returns correct overtime pay when hours exceed construction threshold', () => {
    // 10 hours: 8 regular hours + 2 overtime hours
    // hourlyRate = 563 / 8 = 70.375
    // basePay = 563
    // overtimePay = 2 * 70.375 * 1.5 = 211.125 -> 211.13
    const result = calculateExpectedPay(10, 'construction');

    expect(result.regularHours).toBe(8);
    expect(result.overtimeHours).toBe(2);
    expect(result.basePay).toBe(563);
    expect(result.overtimePay).toBeCloseTo(211.13, 1);
    expect(result.totalExpected).toBeCloseTo(774.13, 1);
  });

  test('calculateExpectedPay returns zero overtime when hours equal the threshold', () => {
    const result = calculateExpectedPay(8, 'construction');

    expect(result.overtimeHours).toBe(0);
    expect(result.overtimePay).toBe(0);
  });

  test('calculateExpectedPay uses hospital threshold of 12 hours correctly', () => {
    // Hospital threshold is 12 hours, minDailyWage is 600, hourlyRate = 600 / 8 = 75
    // For 12 hours: regular hours = 12, overtime = 0
    const result12 = calculateExpectedPay(12, 'hospital');
    expect(result12.regularHours).toBe(12);
    expect(result12.overtimeHours).toBe(0);
    expect(result12.basePay).toBe(12 * 75); // 900
    expect(result12.totalExpected).toBe(900);

    // For 14 hours: regular hours = 12, overtime = 2
    // overtimePay = 2 * 75 * 1.5 = 225
    const result14 = calculateExpectedPay(14, 'hospital');
    expect(result14.regularHours).toBe(12);
    expect(result14.overtimeHours).toBe(2);
    expect(result14.basePay).toBe(900);
    expect(result14.overtimePay).toBe(225);
    expect(result14.totalExpected).toBe(1125);
  });

  test('checkViolation returns violation true when actual pay is less than expected', () => {
    const result = checkViolation(5000, 3800);

    expect(result.violation).toBe(true);
    expect(result.shortfall).toBe(1200);
  });

  test('checkViolation returns violation false when actual pay equals expected', () => {
    const resultEqual = checkViolation(5000, 5000);
    expect(resultEqual.violation).toBe(false);
    expect(resultEqual.shortfall).toBe(0);

    const resultExceeds = checkViolation(5000, 5500);
    expect(resultExceeds.violation).toBe(false);
    expect(resultExceeds.shortfall).toBe(0);
  });

  test('checkViolation calculates correct shortfall amount', () => {
    const result = checkViolation(4996.63, 3800);

    expect(result.violation).toBe(true);
    expect(result.shortfall).toBe(1196.63);
  });

  test('Full week calculation: 50 hours construction worker, verify all values', () => {
    // 50 hours in construction:
    // Threshold = 8
    // Regular hours = 8
    // Overtime hours = 42
    // Hourly rate = 563 / 8 = 70.375 (~70.38)
    // Base pay = 8 * 70.375 = 563
    // Overtime pay = 42 * 70.375 * 1.5 = 4433.625 (~4433.63)
    // Total expected = 563 + 4433.625 = 4996.625 (~4996.63)
    const result = calculateExpectedPay(50, 'construction');

    expect(result.regularHours).toBe(8);
    expect(result.overtimeHours).toBe(42);
    expect(result.hourlyRate).toBeCloseTo(70.38, 1);
    expect(result.basePay).toBe(563);
    expect(result.overtimePay).toBeCloseTo(4433.63, 1);
    expect(result.totalExpected).toBeCloseTo(4996.63, 1);

    // Also verify violation check for this full week with actual pay of 3800
    const violationCheck = checkViolation(result.totalExpected, 3800);
    expect(violationCheck.violation).toBe(true);
    expect(violationCheck.shortfall).toBeCloseTo(1196.63, 1);
  });
});
