import { createClient } from '@libsql/client';

const url = process.env.TURSO_DATABASE_URL!;
const authToken = process.env.TURSO_AUTH_TOKEN!;

const client = createClient({ url, authToken });

// ISO-2 → TLA mapping for migration
const ISO_TO_TLA: Record<string, string> = {
  DE: 'GER', PY: 'PAR', FR: 'FRA', SE: 'SWE', ZA: 'RSA', CA: 'CAN',
  NL: 'NED', MA: 'MAR', PT: 'POR', HR: 'CRO', ES: 'ESP', AT: 'AUT',
  US: 'USA', BA: 'BIH', BE: 'BEL', SN: 'SEN', BR: 'BRA', JP: 'JPN',
  CI: 'CIV', NO: 'NOR', MX: 'MEX', EC: 'ECU', GB: 'ENG', CD: 'COD',
  AR: 'ARG', CV: 'CPV', AU: 'AUS', EG: 'EGY', CH: 'SUI', DZ: 'ALG',
  CO: 'COL', GH: 'GHA',
};

async function main() {
  // 1. Add kickoffTime column
  try {
    await client.execute('ALTER TABLE Match ADD COLUMN kickoffTime TEXT');
    console.log('Added kickoffTime column');
  } catch (e: any) {
    if (String(e).includes('duplicate column')) {
      console.log('kickoffTime column already exists');
    } else {
      throw e;
    }
  }

  // 2. Migrate Match homeCode/awayCode/actualWinnerCode from ISO-2 to TLA
  const matches = await client.execute('SELECT id, homeCode, awayCode, actualWinnerCode FROM Match');
  let matchUpdated = 0;
  for (const row of matches.rows) {
    const homeCode = row.homeCode as string;
    const awayCode = row.awayCode as string;
    const actualWinnerCode = row.actualWinnerCode as string | null;

    const newHome = ISO_TO_TLA[homeCode] || homeCode;
    const newAway = ISO_TO_TLA[awayCode] || awayCode;
    const newWinner = actualWinnerCode ? (ISO_TO_TLA[actualWinnerCode] || actualWinnerCode) : null;

    if (newHome !== homeCode || newAway !== awayCode || newWinner !== actualWinnerCode) {
      await client.execute({
        sql: 'UPDATE Match SET homeCode = ?, awayCode = ?, actualWinnerCode = ? WHERE id = ?',
        args: [newHome, newAway, newWinner, row.id as number],
      });
      matchUpdated++;
    }
  }
  console.log(`Updated ${matchUpdated} matches to TLA codes`);

  // 3. Migrate Prediction predictedWinnerCode from ISO-2 to TLA
  const predictions = await client.execute('SELECT id, predictedWinnerCode FROM Prediction');
  let predUpdated = 0;
  for (const row of predictions.rows) {
    const code = row.predictedWinnerCode as string;
    const newCode = ISO_TO_TLA[code] || code;
    if (newCode !== code) {
      await client.execute({
        sql: 'UPDATE Prediction SET predictedWinnerCode = ? WHERE id = ?',
        args: [newCode, row.id as string],
      });
      predUpdated++;
    }
  }
  console.log(`Updated ${predUpdated} predictions to TLA codes`);

  console.log('Migration complete!');
}

main().catch(console.error);
