/**
 * Sector Configuration for WorkRight
 * Defines statutory minimum wage rates (Tamil Nadu), overtime thresholds,
 * hazard categories, recognized trade roles, and certified skills.
 */

const sectors = {
  construction: {
    name: 'Construction',
    overtimeThreshold: 8,
    minDailyWage: 563, // Tamil Nadu minimum daily wage for unskilled construction worker (INR)
    standardShiftHours: 8,
    hazardCategories: ['Fire', 'Electrical', 'Structural', 'Fall', 'Machinery'],
    roles: ['Labourer', 'Supervisor', 'Mason', 'Plumber', 'Crane Operator'],
    skills: [
      'Bricklaying',
      'Scaffolding',
      'Electrical Wiring',
      'Plumbing',
      'Welding',
      'Safety Protocols'
    ]
  },
  hospital: {
    name: 'Hospital',
    overtimeThreshold: 12,
    minDailyWage: 600, // Tamil Nadu minimum daily wage for hospital support staff (INR)
    standardShiftHours: 8,
    hazardCategories: ['Chemical', 'Biological', 'Fire', 'Electrical', 'Sanitation'],
    roles: ['Sanitation Staff', 'Ward Boy', 'Nurse', 'Security', 'Kitchen Staff'],
    skills: [
      'Waste Disposal',
      'Chemical Handling',
      'Patient Care Support',
      'Sanitation Protocols',
      'First Aid'
    ]
  }
};

function getSectorConfig(sectorKey) {
  if (!sectorKey) return null;
  const normalized = String(sectorKey).trim().toLowerCase();
  return sectors[normalized] || null;
}

module.exports = {
  sectors,
  getSectorConfig
};
