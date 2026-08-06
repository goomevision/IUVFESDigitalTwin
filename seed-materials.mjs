import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

const materials = [
  { name: 'Nilam (Patchouli)', defaultWaterContent: 45, defaultOilContent: 3.5, oilComposition: JSON.stringify({patchouliAlcohol: 50, terpenes: 30, other: 20}) },
  { name: 'Lavender', defaultWaterContent: 50, defaultOilContent: 0.8, oilComposition: JSON.stringify({linalool: 40, linalylAcetate: 35, other: 25}) },
  { name: 'Peppermint', defaultWaterContent: 55, defaultOilContent: 1.2, oilComposition: JSON.stringify({menthol: 50, menthone: 20, other: 30}) },
  { name: 'Rosemary', defaultWaterContent: 40, defaultOilContent: 1.5, oilComposition: JSON.stringify({pinene: 30, camphor: 25, other: 45}) },
  { name: 'Eucalyptus', defaultWaterContent: 35, defaultOilContent: 2.0, oilComposition: JSON.stringify({cineole: 70, pinene: 15, other: 15}) },
];

try {
  for (const material of materials) {
    await connection.execute(
      'INSERT INTO materials (name, defaultWaterContent, defaultOilContent, oilComposition) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE defaultWaterContent=?, defaultOilContent=?, oilComposition=?',
      [material.name, material.defaultWaterContent, material.defaultOilContent, material.oilComposition, material.defaultWaterContent, material.defaultOilContent, material.oilComposition]
    );
    console.log(`✓ Added/Updated: ${material.name}`);
  }
  console.log('✓ All materials seeded successfully!');
} catch (error) {
  console.error('Error seeding materials:', error);
} finally {
  await connection.end();
}
