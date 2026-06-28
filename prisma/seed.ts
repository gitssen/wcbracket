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
  { id: 1, round: "ROUND_OF_32", homeTeam: "South Africa", homeCode: "ZA", awayTeam: "Canada", awayCode: "CA", nextMatchId: 17, isHomeInNext: true },
  { id: 2, round: "ROUND_OF_32", homeTeam: "Brazil", homeCode: "BR", awayTeam: "Japan", awayCode: "JP", nextMatchId: 17, isHomeInNext: false },
  { id: 3, round: "ROUND_OF_32", homeTeam: "Germany", homeCode: "DE", awayTeam: "Paraguay", awayCode: "PY", nextMatchId: 18, isHomeInNext: true },
  { id: 4, round: "ROUND_OF_32", homeTeam: "Netherlands", homeCode: "NL", awayTeam: "Morocco", awayCode: "MA", nextMatchId: 18, isHomeInNext: false },
  { id: 5, round: "ROUND_OF_32", homeTeam: "Ivory Coast", homeCode: "CI", awayTeam: "Norway", awayCode: "NO", nextMatchId: 19, isHomeInNext: true },
  { id: 6, round: "ROUND_OF_32", homeTeam: "France", homeCode: "FR", awayTeam: "Sweden", awayCode: "SE", nextMatchId: 19, isHomeInNext: false },
  { id: 7, round: "ROUND_OF_32", homeTeam: "Mexico", homeCode: "MX", awayTeam: "Ecuador", awayCode: "EC", nextMatchId: 20, isHomeInNext: true },
  { id: 8, round: "ROUND_OF_32", homeTeam: "England", homeCode: "GB", awayTeam: "DR Congo", awayCode: "CD", nextMatchId: 20, isHomeInNext: false },
  { id: 9, round: "ROUND_OF_32", homeTeam: "Belgium", homeCode: "BE", awayTeam: "Senegal", awayCode: "SN", nextMatchId: 21, isHomeInNext: true },
  { id: 10, round: "ROUND_OF_32", homeTeam: "USA", homeCode: "US", awayTeam: "Bosnia-Herzegovina", awayCode: "BA", nextMatchId: 21, isHomeInNext: false },
  { id: 11, round: "ROUND_OF_32", homeTeam: "Spain", homeCode: "ES", awayTeam: "Austria", awayCode: "AT", nextMatchId: 22, isHomeInNext: true },
  { id: 12, round: "ROUND_OF_32", homeTeam: "Portugal", homeCode: "PT", awayTeam: "Croatia", awayCode: "HR", nextMatchId: 22, isHomeInNext: false },
  { id: 13, round: "ROUND_OF_32", homeTeam: "Switzerland", homeCode: "CH", awayTeam: "Algeria", awayCode: "DZ", nextMatchId: 23, isHomeInNext: true },
  { id: 14, round: "ROUND_OF_32", homeTeam: "Australia", homeCode: "AU", awayTeam: "Egypt", awayCode: "EG", nextMatchId: 23, isHomeInNext: false },
  { id: 15, round: "ROUND_OF_32", homeTeam: "Argentina", homeCode: "AR", awayTeam: "Cape Verde", awayCode: "CV", nextMatchId: 24, isHomeInNext: true },
  { id: 16, round: "ROUND_OF_32", homeTeam: "Colombia", homeCode: "CO", awayTeam: "Ghana", awayCode: "GH", nextMatchId: 24, isHomeInNext: false },

  // Round of 16 (Matches 17 to 24)
  { id: 17, round: "ROUND_OF_16", homeTeam: "TBD", homeCode: "", awayTeam: "TBD", awayCode: "", nextMatchId: 25, isHomeInNext: true },
  { id: 18, round: "ROUND_OF_16", homeTeam: "TBD", homeCode: "", awayTeam: "TBD", awayCode: "", nextMatchId: 25, isHomeInNext: false },
  { id: 19, round: "ROUND_OF_16", homeTeam: "TBD", homeCode: "", awayTeam: "TBD", awayCode: "", nextMatchId: 26, isHomeInNext: true },
  { id: 20, round: "ROUND_OF_16", homeTeam: "TBD", homeCode: "", awayTeam: "TBD", awayCode: "", nextMatchId: 26, isHomeInNext: false },
  { id: 21, round: "ROUND_OF_16", homeTeam: "TBD", homeCode: "", awayTeam: "TBD", awayCode: "", nextMatchId: 27, isHomeInNext: true },
  { id: 22, round: "ROUND_OF_16", homeTeam: "TBD", homeCode: "", awayTeam: "TBD", awayCode: "", nextMatchId: 27, isHomeInNext: false },
  { id: 23, round: "ROUND_OF_16", homeTeam: "TBD", homeCode: "", awayTeam: "TBD", awayCode: "", nextMatchId: 28, isHomeInNext: true },
  { id: 24, round: "ROUND_OF_16", homeTeam: "TBD", homeCode: "", awayTeam: "TBD", awayCode: "", nextMatchId: 28, isHomeInNext: false },

  // Quarter Finals (Matches 25 to 28)
  { id: 25, round: "QUARTER_FINALS", homeTeam: "TBD", homeCode: "", awayTeam: "TBD", awayCode: "", nextMatchId: 29, isHomeInNext: true },
  { id: 26, round: "QUARTER_FINALS", homeTeam: "TBD", homeCode: "", awayTeam: "TBD", awayCode: "", nextMatchId: 29, isHomeInNext: false },
  { id: 27, round: "QUARTER_FINALS", homeTeam: "TBD", homeCode: "", awayTeam: "TBD", awayCode: "", nextMatchId: 30, isHomeInNext: true },
  { id: 28, round: "QUARTER_FINALS", homeTeam: "TBD", homeCode: "", awayTeam: "TBD", awayCode: "", nextMatchId: 30, isHomeInNext: false },

  // Semi Finals (Matches 29 to 30)
  { id: 29, round: "SEMI_FINALS", homeTeam: "TBD", homeCode: "", awayTeam: "TBD", awayCode: "", nextMatchId: 31, isHomeInNext: true },
  { id: 30, round: "SEMI_FINALS", homeTeam: "TBD", homeCode: "", awayTeam: "TBD", awayCode: "", nextMatchId: 31, isHomeInNext: false },

  // Finals (Match 31)
  { id: 31, round: "FINALS", homeTeam: "TBD", homeCode: "", awayTeam: "TBD", awayCode: "", nextMatchId: null, isHomeInNext: false }
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
