import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';

const databaseUrl = process.env.TURSO_DATABASE_URL || 'file:prisma/dev.db';
const authToken = process.env.TURSO_AUTH_TOKEN;

const libsql = createClient({
  url: databaseUrl,
  authToken,
});

const adapter = new PrismaLibSQL(libsql);
const prisma = new PrismaClient({ adapter });

const initialMatches = [
  // Round of 32 (Matches 1 to 16)
  // LEFT HALF of bracket
  { id: 1, round: "ROUND_OF_32", homeTeam: "Germany", homeCode: "DE", awayTeam: "Paraguay", awayCode: "PY", nextMatchId: 17, isHomeInNext: true },     // M74 → M89
  { id: 2, round: "ROUND_OF_32", homeTeam: "France", homeCode: "FR", awayTeam: "Sweden", awayCode: "SE", nextMatchId: 17, isHomeInNext: false },        // M77 → M89
  { id: 3, round: "ROUND_OF_32", homeTeam: "South Africa", homeCode: "ZA", awayTeam: "Canada", awayCode: "CA", nextMatchId: 18, isHomeInNext: true },   // M73 → M90
  { id: 4, round: "ROUND_OF_32", homeTeam: "Netherlands", homeCode: "NL", awayTeam: "Morocco", awayCode: "MA", nextMatchId: 18, isHomeInNext: false },  // M75 → M90
  { id: 5, round: "ROUND_OF_32", homeTeam: "Portugal", homeCode: "PT", awayTeam: "Croatia", awayCode: "HR", nextMatchId: 19, isHomeInNext: true },      // M83 → M93
  { id: 6, round: "ROUND_OF_32", homeTeam: "Spain", homeCode: "ES", awayTeam: "Austria", awayCode: "AT", nextMatchId: 19, isHomeInNext: false },        // M84 → M93
  { id: 7, round: "ROUND_OF_32", homeTeam: "USA", homeCode: "US", awayTeam: "Bosnia-Herzegovina", awayCode: "BA", nextMatchId: 20, isHomeInNext: true },// M81 → M94
  { id: 8, round: "ROUND_OF_32", homeTeam: "Belgium", homeCode: "BE", awayTeam: "Senegal", awayCode: "SN", nextMatchId: 20, isHomeInNext: false },      // M82 → M94

  // RIGHT HALF of bracket
  { id: 9, round: "ROUND_OF_32", homeTeam: "Brazil", homeCode: "BR", awayTeam: "Japan", awayCode: "JP", nextMatchId: 21, isHomeInNext: true },          // M76 → M91
  { id: 10, round: "ROUND_OF_32", homeTeam: "Ivory Coast", homeCode: "CI", awayTeam: "Norway", awayCode: "NO", nextMatchId: 21, isHomeInNext: false },   // M78 → M91
  { id: 11, round: "ROUND_OF_32", homeTeam: "Mexico", homeCode: "MX", awayTeam: "Ecuador", awayCode: "EC", nextMatchId: 22, isHomeInNext: true },        // M79 → M92
  { id: 12, round: "ROUND_OF_32", homeTeam: "England", homeCode: "GB", awayTeam: "DR Congo", awayCode: "CD", nextMatchId: 22, isHomeInNext: false },     // M80 → M92
  { id: 13, round: "ROUND_OF_32", homeTeam: "Argentina", homeCode: "AR", awayTeam: "Cape Verde", awayCode: "CV", nextMatchId: 23, isHomeInNext: true },   // M86 → M95
  { id: 14, round: "ROUND_OF_32", homeTeam: "Australia", homeCode: "AU", awayTeam: "Egypt", awayCode: "EG", nextMatchId: 23, isHomeInNext: false },       // M88 → M95
  { id: 15, round: "ROUND_OF_32", homeTeam: "Switzerland", homeCode: "CH", awayTeam: "Algeria", awayCode: "DZ", nextMatchId: 24, isHomeInNext: true },    // M85 → M96
  { id: 16, round: "ROUND_OF_32", homeTeam: "Colombia", homeCode: "CO", awayTeam: "Ghana", awayCode: "GH", nextMatchId: 24, isHomeInNext: false },       // M87 → M96

  // Round of 16 (Matches 17 to 24)
  // LEFT HALF
  { id: 17, round: "ROUND_OF_16", homeTeam: "TBD", homeCode: "", awayTeam: "TBD", awayCode: "", nextMatchId: 25, isHomeInNext: true },   // M89 → M97
  { id: 18, round: "ROUND_OF_16", homeTeam: "TBD", homeCode: "", awayTeam: "TBD", awayCode: "", nextMatchId: 25, isHomeInNext: false },  // M90 → M97
  { id: 19, round: "ROUND_OF_16", homeTeam: "TBD", homeCode: "", awayTeam: "TBD", awayCode: "", nextMatchId: 26, isHomeInNext: true },   // M93 → M98
  { id: 20, round: "ROUND_OF_16", homeTeam: "TBD", homeCode: "", awayTeam: "TBD", awayCode: "", nextMatchId: 26, isHomeInNext: false },  // M94 → M98
  // RIGHT HALF
  { id: 21, round: "ROUND_OF_16", homeTeam: "TBD", homeCode: "", awayTeam: "TBD", awayCode: "", nextMatchId: 27, isHomeInNext: true },   // M91 → M99
  { id: 22, round: "ROUND_OF_16", homeTeam: "TBD", homeCode: "", awayTeam: "TBD", awayCode: "", nextMatchId: 27, isHomeInNext: false },  // M92 → M99
  { id: 23, round: "ROUND_OF_16", homeTeam: "TBD", homeCode: "", awayTeam: "TBD", awayCode: "", nextMatchId: 28, isHomeInNext: true },   // M95 → M100
  { id: 24, round: "ROUND_OF_16", homeTeam: "TBD", homeCode: "", awayTeam: "TBD", awayCode: "", nextMatchId: 28, isHomeInNext: false },  // M96 → M100

  // Quarter Finals (Matches 25 to 28)
  { id: 25, round: "QUARTER_FINALS", homeTeam: "TBD", homeCode: "", awayTeam: "TBD", awayCode: "", nextMatchId: 29, isHomeInNext: true },  // M97 → M101
  { id: 26, round: "QUARTER_FINALS", homeTeam: "TBD", homeCode: "", awayTeam: "TBD", awayCode: "", nextMatchId: 29, isHomeInNext: false }, // M98 → M101
  { id: 27, round: "QUARTER_FINALS", homeTeam: "TBD", homeCode: "", awayTeam: "TBD", awayCode: "", nextMatchId: 30, isHomeInNext: true },  // M99 → M102
  { id: 28, round: "QUARTER_FINALS", homeTeam: "TBD", homeCode: "", awayTeam: "TBD", awayCode: "", nextMatchId: 30, isHomeInNext: false }, // M100 → M102

  // Semi Finals (Matches 29 to 30)
  { id: 29, round: "SEMI_FINALS", homeTeam: "TBD", homeCode: "", awayTeam: "TBD", awayCode: "", nextMatchId: 31, isHomeInNext: true },   // M101 → M104
  { id: 30, round: "SEMI_FINALS", homeTeam: "TBD", homeCode: "", awayTeam: "TBD", awayCode: "", nextMatchId: 31, isHomeInNext: false },  // M102 → M104

  // Finals (Match 31)
  { id: 31, round: "FINALS", homeTeam: "TBD", homeCode: "", awayTeam: "TBD", awayCode: "", nextMatchId: null, isHomeInNext: false }       // M104
];

async function main() {
  console.log('Seeding matches...');
  await prisma.match.deleteMany({});
  
  for (const m of initialMatches) {
    await prisma.match.create({
      data: {
        id: m.id,
        round: m.round,
        homeTeam: m.homeTeam,
        homeCode: m.homeCode,
        awayTeam: m.awayTeam,
        awayCode: m.awayCode,
        wentToPenalties: false,
        isCompleted: false,
        nextMatchId: m.nextMatchId,
        isHomeInNext: m.isHomeInNext,
      }
    });
  }
  
  console.log('Matches seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
