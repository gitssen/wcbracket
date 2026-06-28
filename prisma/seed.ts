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
  { id: 1, round: "ROUND_OF_32", homeTeam: "Germany", homeCode: "GER", awayTeam: "Paraguay", awayCode: "PAR", nextMatchId: 17, isHomeInNext: true },
  { id: 2, round: "ROUND_OF_32", homeTeam: "France", homeCode: "FRA", awayTeam: "Sweden", awayCode: "SWE", nextMatchId: 17, isHomeInNext: false },
  { id: 3, round: "ROUND_OF_32", homeTeam: "South Africa", homeCode: "RSA", awayTeam: "Canada", awayCode: "CAN", nextMatchId: 18, isHomeInNext: true },
  { id: 4, round: "ROUND_OF_32", homeTeam: "Netherlands", homeCode: "NED", awayTeam: "Morocco", awayCode: "MAR", nextMatchId: 18, isHomeInNext: false },
  { id: 5, round: "ROUND_OF_32", homeTeam: "Portugal", homeCode: "POR", awayTeam: "Croatia", awayCode: "CRO", nextMatchId: 19, isHomeInNext: true },
  { id: 6, round: "ROUND_OF_32", homeTeam: "Spain", homeCode: "ESP", awayTeam: "Austria", awayCode: "AUT", nextMatchId: 19, isHomeInNext: false },
  { id: 7, round: "ROUND_OF_32", homeTeam: "USA", homeCode: "USA", awayTeam: "Bosnia-Herzegovina", awayCode: "BIH", nextMatchId: 20, isHomeInNext: true },
  { id: 8, round: "ROUND_OF_32", homeTeam: "Belgium", homeCode: "BEL", awayTeam: "Senegal", awayCode: "SEN", nextMatchId: 20, isHomeInNext: false },

  // RIGHT HALF of bracket
  { id: 9, round: "ROUND_OF_32", homeTeam: "Brazil", homeCode: "BRA", awayTeam: "Japan", awayCode: "JPN", nextMatchId: 21, isHomeInNext: true },
  { id: 10, round: "ROUND_OF_32", homeTeam: "Ivory Coast", homeCode: "CIV", awayTeam: "Norway", awayCode: "NOR", nextMatchId: 21, isHomeInNext: false },
  { id: 11, round: "ROUND_OF_32", homeTeam: "Mexico", homeCode: "MEX", awayTeam: "Ecuador", awayCode: "ECU", nextMatchId: 22, isHomeInNext: true },
  { id: 12, round: "ROUND_OF_32", homeTeam: "England", homeCode: "ENG", awayTeam: "DR Congo", awayCode: "COD", nextMatchId: 22, isHomeInNext: false },
  { id: 13, round: "ROUND_OF_32", homeTeam: "Argentina", homeCode: "ARG", awayTeam: "Cape Verde", awayCode: "CPV", nextMatchId: 23, isHomeInNext: true },
  { id: 14, round: "ROUND_OF_32", homeTeam: "Australia", homeCode: "AUS", awayTeam: "Egypt", awayCode: "EGY", nextMatchId: 23, isHomeInNext: false },
  { id: 15, round: "ROUND_OF_32", homeTeam: "Switzerland", homeCode: "SUI", awayTeam: "Algeria", awayCode: "ALG", nextMatchId: 24, isHomeInNext: true },
  { id: 16, round: "ROUND_OF_32", homeTeam: "Colombia", homeCode: "COL", awayTeam: "Ghana", awayCode: "GHA", nextMatchId: 24, isHomeInNext: false },

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
