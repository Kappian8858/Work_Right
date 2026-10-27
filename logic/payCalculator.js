/**
 * Pay Calculator Logic
 * Pure functions for overtime calculation and statutory wage computation.
 */

const { getSectorConfig } = require('../config/sectors');
const { checkViolation } = require('./violationChecker');

/**
 * Calculates statutory expected pay for hours worked based on sector minimum wages.
 *
 * @param {number} hoursWorked - Total hours worked in the period
 * @param {string|object} sector - Sector name ('construction', 'hospital') or config object
 * @returns {{
 *   regularHours: number,
 *   overtimeHours: number,
 *   hourlyRate: number,
 *   basePay: number,
 *   overtimePay: number,
 *   totalExpected: number
 * }}
 */
function calculateExpectedPay(hoursWorked, sector) {
  let config = null;

  if (typeof sector === 'string') {
    config = getSectorConfig(sector);
  } else if (sector && typeof sector === 'object') {
    config = sector;
  }

  if (!config || typeof config.minDailyWage !== 'number') {
    throw new Error('Invalid or missing sector configuration');
  }

  const hours = Math.max(0, Number(hoursWorked) || 0);
  const overtimeThreshold = Number(config.overtimeThreshold) || 8;
  const minDailyWage = Number(config.minDailyWage);

  // Hourly statutory rate based on standard 8-hour shift
  const hourlyRate = minDailyWage / 8;

  // Split regular hours (up to threshold) and overtime hours
  const regularHours = Math.min(hours, overtimeThreshold);
  const overtimeHours = Math.max(0, hours - overtimeThreshold);

  // Base pay for regular hours
  const basePay = regularHours * hourlyRate;

  // Overtime pay at statutory 1.5x multiplier
  const overtimePay = overtimeHours * hourlyRate * 1.5;

  const totalExpected = basePay + overtimePay;

  return {
    regularHours,
    overtimeHours,
    hourlyRate: Math.round(hourlyRate * 100) / 100,
    basePay: Math.round(basePay * 100) / 100,
    overtimePay: Math.round(overtimePay * 100) / 100,
    totalExpected: Math.round(totalExpected * 100) / 100
  };
}

module.exports = {
  calculateExpectedPay,
  checkViolation
};
