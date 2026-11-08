import db from './database.js';

export function seedRatesAndSettings() {
  console.log('Seeding rate charts, discount slabs, and default settings...');

  // Settings
  const insertSetting = db.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`);
  insertSetting.run('session', '2026-27');
  insertSetting.run('registration_fee', '23');
  insertSetting.run('seasonal_discount', '0');
  insertSetting.run('extra_less', '10');
  insertSetting.run('org_name', 'Suro Bharati Sangeet Kala Kendra');
  insertSetting.run('org_address', '19/I, Vivekananda Lane, Serampore, Hooghly - 712201');

  // Discount Slabs (min_count, max_count, discount_percent)
  // 0-14: 0%, 15-35: 20%, 36-99: 35%, 100-250: 40%, 251-400: 45%
  const existingSlabs = db.prepare('SELECT COUNT(*) as count FROM discount_slabs').get();
  if (existingSlabs.count === 0) {
    const insertSlab = db.prepare(`INSERT INTO discount_slabs (min_count, max_count, discount_percent) VALUES (?, ?, ?)`);
    const defaultSlabs = [
      [0, 14, 0],
      [15, 35, 20],
      [36, 99, 35],
      [100, 250, 40],
      [251, 400, 45],
      [401, null, 45] // default fallback
    ];
    for (const [min, max, pct] of defaultSlabs) {
      insertSlab.run(min, max, pct);
    }
  }

  // Rate Charts
  const insertRate = db.prepare(`
    INSERT OR REPLACE INTO rate_charts (zone, category, level_name, level_order, exam_fee, convocation_fee)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  /* =========================================================================
     ZONE 1: NE States + West Bengal (Except Kolkata)
     WB and NE exempted from convocation fees (conv = 0)
     ========================================================================= */
  const zone1Indian = [
    { name: 'Adya', order: 1, fee: 195, conv: 0 },
    { name: 'Madhya', order: 2, fee: 255, conv: 0 },
    { name: 'Purna', order: 3, fee: 265, conv: 0 },
    { name: '1st', order: 4, fee: 285, conv: 0 },
    { name: '2nd', order: 5, fee: 310, conv: 0 },
    { name: '3rd', order: 6, fee: 395, conv: 0 },
    { name: '4th', order: 7, fee: 510, conv: 0 },
    { name: '5th', order: 8, fee: 555, conv: 0 },
    { name: '6th', order: 9, fee: 570, conv: 0 },
    { name: '7th', order: 10, fee: 715, conv: 0 },
    { name: '8th', order: 11, fee: 830, conv: 0 },
    { name: 'All India Churamoni Examination', order: 12, fee: 2200, conv: 0 }
  ];
  for (const item of zone1Indian) {
    insertRate.run('zone1_ne_wb', 'indian', item.name, item.order, item.fee, item.conv);
  }

  const zone1Western = [
    { name: 'Grade 1', order: 1, fee: 430, conv: 0 },
    { name: 'Grade 2', order: 2, fee: 450, conv: 0 },
    { name: 'Grade 3', order: 3, fee: 475, conv: 0 },
    { name: 'Grade 4', order: 4, fee: 545, conv: 0 },
    { name: 'Grade 5', order: 5, fee: 565, conv: 0 },
    { name: 'Grade 6', order: 6, fee: 590, conv: 0 },
    { name: 'Grade 7', order: 7, fee: 600, conv: 0 },
    { name: 'Grade 8', order: 8, fee: 650, conv: 0 },
    { name: 'Grade 9', order: 9, fee: 690, conv: 0 }
  ];
  for (const item of zone1Western) {
    insertRate.run('zone1_ne_wb', 'western', item.name, item.order, item.fee, item.conv);
  }

  /* =========================================================================
     ZONE 2: Other States (AP, Goa, GJ, HR, HP, KA, KL, MP, MH, PB, RJ, TN, TS, UK, UP etc.)
     ========================================================================= */
  const zone2Indian = [
    { name: 'Adya', order: 1, fee: 385, conv: 0 },
    { name: 'Madhya', order: 2, fee: 475, conv: 0 },
    { name: 'Purna', order: 3, fee: 485, conv: 460 },
    { name: '1st', order: 4, fee: 515, conv: 0 },
    { name: '2nd', order: 5, fee: 525, conv: 0 },
    { name: '3rd', order: 6, fee: 615, conv: 460 },
    { name: '4th', order: 7, fee: 705, conv: 0 },
    { name: '5th', order: 8, fee: 745, conv: 460 },
    { name: '6th', order: 9, fee: 780, conv: 0 },
    { name: '7th', order: 10, fee: 905, conv: 460 },
    { name: '8th', order: 11, fee: 1030, conv: 460 },
    { name: 'All India Churamoni Examination', order: 12, fee: 2600, conv: 0 }
  ];
  for (const item of zone2Indian) {
    insertRate.run('zone2_other', 'indian', item.name, item.order, item.fee, item.conv);
  }

  const zone2Western = [
    { name: 'Grade 1', order: 1, fee: 640, conv: 0 },
    { name: 'Grade 2', order: 2, fee: 660, conv: 0 },
    { name: 'Grade 3', order: 3, fee: 660, conv: 460 },
    { name: 'Grade 4', order: 4, fee: 740, conv: 0 },
    { name: 'Grade 5', order: 5, fee: 740, conv: 460 },
    { name: 'Grade 6', order: 6, fee: 790, conv: 0 },
    { name: 'Grade 7', order: 7, fee: 790, conv: 460 },
    { name: 'Grade 8', order: 8, fee: 880, conv: 0 },
    { name: 'Grade 9', order: 9, fee: 880, conv: 460 }
  ];
  for (const item of zone2Western) {
    insertRate.run('zone2_other', 'western', item.name, item.order, item.fee, item.conv);
  }

  /* =========================================================================
     ZONE 3: Central-East (Bihar, Chhattisgarh, Jharkhand, Odisha)
     ========================================================================= */
  const zone3Indian = [
    { name: 'Adya', order: 1, fee: 290, conv: 0 },
    { name: 'Madhya', order: 2, fee: 340, conv: 0 },
    { name: 'Purna', order: 3, fee: 370, conv: 230 },
    { name: '1st', order: 4, fee: 385, conv: 0 },
    { name: '2nd', order: 5, fee: 395, conv: 0 },
    { name: '3rd', order: 6, fee: 485, conv: 230 },
    { name: '4th', order: 7, fee: 600, conv: 0 },
    { name: '5th', order: 8, fee: 605, conv: 350 },
    { name: '6th', order: 9, fee: 645, conv: 0 },
    { name: '7th', order: 10, fee: 755, conv: 350 },
    { name: '8th', order: 11, fee: 855, conv: 350 },
    { name: 'All India Churamoni Examination', order: 12, fee: 2200, conv: 0 }
  ];
  for (const item of zone3Indian) {
    insertRate.run('zone3_central_east', 'indian', item.name, item.order, item.fee, item.conv);
  }

  const zone3Western = [
    { name: 'Grade 1', order: 1, fee: 555, conv: 0 },
    { name: 'Grade 2', order: 2, fee: 600, conv: 0 },
    { name: 'Grade 3', order: 3, fee: 610, conv: 350 },
    { name: 'Grade 4', order: 4, fee: 670, conv: 0 },
    { name: 'Grade 5', order: 5, fee: 680, conv: 350 },
    { name: 'Grade 6', order: 6, fee: 740, conv: 0 },
    { name: 'Grade 7', order: 7, fee: 750, conv: 350 },
    { name: 'Grade 8', order: 8, fee: 820, conv: 0 },
    { name: 'Grade 9', order: 9, fee: 830, conv: 350 }
  ];
  for (const item of zone3Western) {
    insertRate.run('zone3_central_east', 'western', item.name, item.order, item.fee, item.conv);
  }

  /* =========================================================================
     ZONE 4: Kolkata (Pincode starts with 700)
     ========================================================================= */
  const zone4Indian = [
    { name: 'Adya', order: 1, fee: 195, conv: 0 },
    { name: 'Madhya', order: 2, fee: 255, conv: 0 },
    { name: 'Purna', order: 3, fee: 265, conv: 0 },
    { name: '1st', order: 4, fee: 285, conv: 0 },
    { name: '2nd', order: 5, fee: 310, conv: 0 },
    { name: '3rd', order: 6, fee: 395, conv: 175 },
    { name: '4th', order: 7, fee: 510, conv: 0 },
    { name: '5th', order: 8, fee: 555, conv: 175 },
    { name: '6th', order: 9, fee: 570, conv: 0 },
    { name: '7th', order: 10, fee: 715, conv: 175 },
    { name: '8th', order: 11, fee: 830, conv: 175 },
    { name: 'All India Churamoni Examination', order: 12, fee: 2200, conv: 0 }
  ];
  for (const item of zone4Indian) {
    insertRate.run('zone4_kolkata', 'indian', item.name, item.order, item.fee, item.conv);
  }

  const zone4Western = [
    { name: 'Grade 1', order: 1, fee: 430, conv: 0 },
    { name: 'Grade 2', order: 2, fee: 450, conv: 0 },
    { name: 'Grade 3', order: 3, fee: 475, conv: 175 },
    { name: 'Grade 4', order: 4, fee: 545, conv: 0 },
    { name: 'Grade 5', order: 5, fee: 565, conv: 175 },
    { name: 'Grade 6', order: 6, fee: 590, conv: 0 },
    { name: 'Grade 7', order: 7, fee: 600, conv: 175 },
    { name: 'Grade 8', order: 8, fee: 650, conv: 0 },
    { name: 'Grade 9', order: 9, fee: 690, conv: 175 }
  ];
  for (const item of zone4Western) {
    insertRate.run('zone4_kolkata', 'western', item.name, item.order, item.fee, item.conv);
  }

  /* =========================================================================
     YOGA: Universal (All-India)
     Convocation fee is ₹0 (not taken)
     ========================================================================= */
  const yogaRates = [
    { name: 'Semester 1', order: 1, fee: 250, conv: 0 },
    { name: 'Semester 2', order: 2, fee: 270, conv: 0 },
    { name: 'Semester 3', order: 3, fee: 340, conv: 0 },
    { name: 'Semester 4', order: 4, fee: 440, conv: 0 },
    { name: 'Semester 5', order: 5, fee: 480, conv: 0 },
    { name: 'Semester 6', order: 6, fee: 500, conv: 0 },
    { name: 'Semester 7', order: 7, fee: 630, conv: 0 },
    { name: 'Semester 8', order: 8, fee: 730, conv: 0 }
  ];
  for (const item of yogaRates) {
    insertRate.run('yoga', 'yoga', item.name, item.order, item.fee, item.conv);
  }

  console.log('Seeding complete!');
}

// Execute if run directly
if (process.argv[1] && process.argv[1].endsWith('seed-rates.js')) {
  seedRatesAndSettings();
}

