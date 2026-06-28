'use client';

import React, { useState, useTransition } from 'react';
import Flag from 'react-world-flags';
import { useSession } from 'next-auth/react';
import { saveBracket, PredictionInput } from '@/actions/saveBracket';
import { useRouter } from 'next/navigation';

interface Match {
  id: number;
  round: string;
  homeTeam: string;
  homeCode: string;
  awayTeam: string;
  awayCode: string;
  homeScore: number | null;
  awayScore: number | null;
  wentToPenalties: boolean;
  actualWinner: string | null;
  actualWinnerCode: string | null;
  isCompleted: boolean;
  nextMatchId: number | null;
  isHomeInNext: boolean;
}

interface Prediction {
  matchId: number;
  predictedWinner: string;
  predictedWinnerCode: string;
  predictedHomeScore: number;
  predictedAwayScore: number;
  predictPenalties: boolean;
}

interface BracketPredictorProps {
  initialMatches: Match[];
  initialPredictions: Prediction[];
  isLocked: boolean;
}

const ROUND_LABELS: Record<string, string> = {
  ROUND_OF_32: 'Round of 32',
  ROUND_OF_16: 'Round of 16',
  QUARTER_FINALS: 'Quarter-Finals',
  SEMI_FINALS: 'Semi-Finals',
  FINALS: 'Final',
};

export default function BracketPredictor({ initialMatches, initialPredictions, isLocked }: BracketPredictorProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [hasSubmitted, setHasSubmitted] = useState(isLocked);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // State for active bracket matches (with updated slots as teams advance)
  const [matches, setMatches] = useState<Match[]>(() => {
    // We want to reconstruct the bracket matching what predictions already dictate.
    // If the user already has predictions from the database, we need to propagate them
    // on initialization to fill TBD slots!
    const matchesCopy = JSON.parse(JSON.stringify(initialMatches)) as Match[];
    
    // Sort predictions by matchId (lower round matches first)
    const sortedPreds = [...initialPredictions].sort((a, b) => a.matchId - b.matchId);

    // Propagate existing predictions
    for (const pred of sortedPreds) {
      const match = matchesCopy.find((m) => m.id === pred.matchId);
      if (match && pred.predictedWinnerCode) {
        const nextId = match.nextMatchId;
        if (nextId) {
          const nextMatch = matchesCopy.find((m) => m.id === nextId);
          if (nextMatch) {
            if (match.isHomeInNext) {
              nextMatch.homeTeam = pred.predictedWinner;
              nextMatch.homeCode = pred.predictedWinnerCode;
            } else {
              nextMatch.awayTeam = pred.predictedWinner;
              nextMatch.awayCode = pred.predictedWinnerCode;
            }
          }
        }
      }
    }
    return matchesCopy;
  });

  // State for user predictions
  const [predictions, setPredictions] = useState<Record<number, Prediction>>(() => {
    const map: Record<number, Prediction> = {};
    for (const pred of initialPredictions) {
      map[pred.matchId] = pred;
    }
    return map;
  });

  // UI States
  const [activeMobileRound, setActiveMobileRound] = useState<string>('ROUND_OF_32');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Helper to render flag SVG
  const renderFlag = (code: string) => {
    if (!code || code === 'TBD' || code.trim() === '') {
      return (
        <div className="w-6 h-4 bg-slate-800 border border-slate-700 flex items-center justify-center rounded-sm text-[9px] text-slate-500">
          ⚽
        </div>
      );
    }
    return (
      <Flag
        code={code}
        className="w-6 h-4 object-cover rounded-sm shadow-sm border border-slate-800/40"
        fallback={
          <div className="w-6 h-4 bg-slate-800 border border-slate-700 flex items-center justify-center rounded-sm text-[9px] text-slate-500">
            ⚽
          </div>
        }
      />
    );
  };

  // Downstream propagation: updates slots in matches and clears invalid predictions
  const propagateWinnerInState = (
    matchId: number,
    winnerName: string,
    winnerCode: string,
    currentMatches: Match[],
    currentPredictions: Record<number, Prediction>
  ) => {
    const match = currentMatches.find((m) => m.id === matchId);
    if (!match || !match.nextMatchId) return;

    const nextMatchId = match.nextMatchId;
    const isHome = match.isHomeInNext;
    const nextMatch = currentMatches.find((m) => m.id === nextMatchId);
    if (!nextMatch) return;

    const oldSlotCode = isHome ? nextMatch.homeCode : nextMatch.awayCode;

    if (oldSlotCode !== winnerCode) {
      // Update the slot team name and code
      if (isHome) {
        nextMatch.homeTeam = winnerName || 'TBD';
        nextMatch.homeCode = winnerCode || '';
      } else {
        nextMatch.awayTeam = winnerName || 'TBD';
        nextMatch.awayCode = winnerCode || '';
      }

      // Since the participant changed, we must clear the prediction for the next match
      const nextPred = currentPredictions[nextMatchId];
      if (nextPred) {
        const oldNextWinnerCode = nextPred.predictedWinnerCode;

        // Remove prediction for next match
        delete currentPredictions[nextMatchId];

        // Recursively clear further downstream if there was a predicted winner
        if (oldNextWinnerCode) {
          propagateWinnerInState(nextMatchId, 'TBD', '', currentMatches, currentPredictions);
        }
      }
    }
  };

  // Handles updating scores or penalty selections
  const handlePredictionChange = (
    matchId: number,
    updates: {
      homeScore?: string;
      awayScore?: string;
      predictPenalties?: boolean;
      penaltyWinnerCode?: string;
    }
  ) => {
    const match = matches.find((m) => m.id === matchId);
    if (!match) return;

    // Do not allow predicting completed matches or if bracket is already submitted
    if (match.isCompleted || hasSubmitted) return;

    const matchesCopy = JSON.parse(JSON.stringify(matches)) as Match[];
    const predictionsCopy = { ...predictions };

    const existing = predictionsCopy[matchId] || {
      matchId,
      predictedWinner: '',
      predictedWinnerCode: '',
      predictedHomeScore: 0,
      predictedAwayScore: 0,
      predictPenalties: false,
    };

    // Determine new scores
    const finalHomeScoreStr = updates.homeScore !== undefined ? updates.homeScore : String(existing.predictedHomeScore);
    const finalAwayScoreStr = updates.awayScore !== undefined ? updates.awayScore : String(existing.predictedAwayScore);

    // Clean empty/whitespace
    const parsedHome = finalHomeScoreStr.trim() === '' ? NaN : parseInt(finalHomeScoreStr, 10);
    const parsedAway = finalAwayScoreStr.trim() === '' ? NaN : parseInt(finalAwayScoreStr, 10);

    let isTie = false;
    let newPredictPenalties = existing.predictPenalties;

    if (!isNaN(parsedHome) && !isNaN(parsedAway)) {
      isTie = parsedHome === parsedAway;
    }

    if (updates.predictPenalties !== undefined) {
      newPredictPenalties = updates.predictPenalties;
    } else if (!isTie) {
      // Turn off penalties if it's no longer a tie
      newPredictPenalties = false;
    }

    // Determine predicted winner
    let winnerName = '';
    let winnerCode = '';

    const currentMatch = matchesCopy.find((m) => m.id === matchId) || match;
    const currentHomeTeam = currentMatch.homeTeam;
    const currentHomeCode = currentMatch.homeCode;
    const currentAwayTeam = currentMatch.awayTeam;
    const currentAwayCode = currentMatch.awayCode;

    if (!isNaN(parsedHome) && !isNaN(parsedAway)) {
      if (parsedHome > parsedAway) {
        winnerName = currentHomeTeam;
        winnerCode = currentHomeCode;
      } else if (parsedAway > parsedHome) {
        winnerName = currentAwayTeam;
        winnerCode = currentAwayCode;
      } else if (isTie && newPredictPenalties) {
        // If penalties is checked, check if there's a specified shootout winner
        const pWinner = updates.penaltyWinnerCode || existing.predictedWinnerCode;
        if (pWinner === currentHomeCode) {
          winnerName = currentHomeTeam;
          winnerCode = currentHomeCode;
        } else if (pWinner === currentAwayCode) {
          winnerName = currentAwayTeam;
          winnerCode = currentAwayCode;
        }
      }
    }

    // Update prediction object
    const updatedPred: Prediction = {
      matchId,
      predictedWinner: winnerName,
      predictedWinnerCode: winnerCode,
      predictedHomeScore: isNaN(parsedHome) ? 0 : parsedHome,
      predictedAwayScore: isNaN(parsedAway) ? 0 : parsedAway,
      predictPenalties: newPredictPenalties,
    };

    // Only save predictions if both scores are filled out
    if (!isNaN(parsedHome) && !isNaN(parsedAway)) {
      predictionsCopy[matchId] = updatedPred;
      propagateWinnerInState(matchId, winnerName, winnerCode, matchesCopy, predictionsCopy);
    } else {
      // If one of the score fields is cleared, delete the prediction
      delete predictionsCopy[matchId];
      propagateWinnerInState(matchId, 'TBD', '', matchesCopy, predictionsCopy);
    }

    setMatches(matchesCopy);
    setPredictions(predictionsCopy);
  };

  // Get final winner / champion info
  const getChampion = () => {
    // Finals match is ID 31
    const finalsMatch = matches.find((m) => m.id === 31);
    const finalsPred = predictions[31];
    
    if (finalsMatch?.isCompleted) {
      return {
        name: finalsMatch.actualWinner || 'TBD',
        code: finalsMatch.actualWinnerCode || '',
        isReal: true,
      };
    }

    if (finalsPred && finalsPred.predictedWinnerCode) {
      return {
        name: finalsPred.predictedWinner,
        code: finalsPred.predictedWinnerCode,
        isReal: false,
      };
    }

    return null;
  };

  const champion = getChampion();

  // Collect all eliminated teams in actual completed matches
  const eliminatedTeams = new Set<string>();
  for (const m of matches) {
    if (m.isCompleted && m.actualWinnerCode) {
      const loserCode = m.actualWinnerCode.toUpperCase() === m.homeCode.toUpperCase()
        ? m.awayCode
        : m.homeCode;
      if (loserCode && loserCode !== 'TBD') {
        eliminatedTeams.add(loserCode.toUpperCase());
      }
    }
  }

  const isChampionBusted = !!(champion && !champion.isReal && eliminatedTeams.has(champion.code.toUpperCase()));

  // Save changes to DB
  const handleSave = () => {
    if (hasSubmitted) return;
    setStatusMsg(null);

    if (!session) {
      router.push('/login');
      return;
    }

    setShowConfirmDialog(true);
  };

  const confirmSave = () => {
    setShowConfirmDialog(false);

    startTransition(async () => {
      const listToSave: PredictionInput[] = Object.values(predictions).map((p) => ({
        matchId: p.matchId,
        predictedWinner: p.predictedWinner,
        predictedWinnerCode: p.predictedWinnerCode,
        predictedHomeScore: p.predictedHomeScore,
        predictedAwayScore: p.predictedAwayScore,
        predictPenalties: p.predictPenalties,
      }));

      const res = await saveBracket(listToSave);

      if (res?.error) {
        setStatusMsg({ type: 'error', text: res.error });
      } else {
        setStatusMsg({ type: 'success', text: 'Bracket predictions saved successfully!' });
        setHasSubmitted(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        router.refresh();
      }
    });
  };

  // Group matches by round for display
  const getRoundMatches = (round: string) => matches.filter((m) => m.round === round);

  const rounds = ['ROUND_OF_32', 'ROUND_OF_16', 'QUARTER_FINALS', 'SEMI_FINALS', 'FINALS'];

  const getMatchesByIds = (ids: number[]) =>
    ids.map((id) => matches.find((m) => m.id === id)).filter((m): m is Match => !!m);

  const renderDesktopColumn = (title: string, columnMatches: Match[]) => {
    return (
      <div className="flex-1 min-w-[240px] max-w-[280px] flex flex-col justify-around h-full">
        <div className="text-center py-1.5 bg-slate-900/40 border border-slate-800/80 rounded-xl">
          <h3 className="font-extrabold text-xs text-slate-300 tracking-wider uppercase">
            {title}
          </h3>
        </div>
        <div className="flex-1 flex flex-col justify-around py-4">
          {columnMatches.map((m) => {
            const pred = predictions[m.id];
            const isBusted = !!(
              pred &&
              pred.predictedWinnerCode &&
              (m.isCompleted
                ? pred.predictedWinnerCode.toUpperCase() !== m.actualWinnerCode?.toUpperCase()
                : eliminatedTeams.has(pred.predictedWinnerCode.toUpperCase()))
            );
            return (
              <MatchCard
                key={m.id}
                match={m}
                prediction={pred}
                isBusted={isBusted}
                isLocked={hasSubmitted}
                onChange={(updates) => handlePredictionChange(m.id, updates)}
                renderFlag={renderFlag}
              />
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner with Actions */}
      {!hasSubmitted && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              🎯 Build Your World Cup Bracket
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Predict scores, toggle penalty shootouts on ties, and click team rows to select advancing winners.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {session ? (
              <button
                onClick={handleSave}
                disabled={isPending}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm sm:text-base transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-[0.98] w-full md:w-auto"
              >
                {isPending ? 'Saving predictions...' : 'Save Predictions'}
              </button>
            ) : (
              <button
                onClick={() => router.push('/login')}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm sm:text-base transition-all duration-200 w-full md:w-auto shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20"
              >
                Log In to Save Bracket
              </button>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Confirm Submission</h3>
            <p className="text-sm text-slate-400 mb-6">
              Are you sure? Predictions cannot be changed after submission.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-sm font-semibold hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmSave}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-bold transition-colors"
              >
                Confirm & Lock
              </button>
            </div>
          </div>
        </div>
      )}

      {statusMsg && (
        <div
          className={`p-4 rounded-xl border text-sm flex items-center justify-between animate-fade-in ${
            statusMsg.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
              : 'bg-red-950/40 border-red-500/30 text-red-300'
          }`}
        >
          <span>
            {statusMsg.type === 'success' ? '✓' : '⚠️'} {statusMsg.text}
          </span>
          <button onClick={() => setStatusMsg(null)} className="text-xs font-semibold hover:opacity-80">
            Dismiss
          </button>
        </div>
      )}

      {/* Mobile Tab Selectors */}
      <div className="md:hidden flex overflow-x-auto gap-2 py-2 border-b border-slate-900">
        {rounds.map((r) => (
          <button
            key={r}
            onClick={() => setActiveMobileRound(r)}
            className={`whitespace-nowrap px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
              activeMobileRound === r
                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {ROUND_LABELS[r]}
          </button>
        ))}
        <button
          onClick={() => setActiveMobileRound('CHAMPION')}
          className={`whitespace-nowrap px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
            activeMobileRound === 'CHAMPION'
              ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          Champion Showcase
        </button>
      </div>

      {/* Bracket Tree Layout */}
      {/* Desktop view shows all columns side-by-side. Mobile view shows only the active tab */}
      <div className="relative">
        {/* Zoom Controls (Desktop only) */}
        <div className="hidden md:flex items-center gap-2 mb-3 justify-end">
          <span className="text-xs text-slate-500 font-medium">{Math.round(zoomLevel * 100)}%</span>
          <button
            onClick={() => setZoomLevel((z) => Math.max(0.4, z - 0.1))}
            className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 flex items-center justify-center text-sm font-bold transition-colors"
          >
            -
          </button>
          <button
            onClick={() => setZoomLevel(1)}
            className="px-2 h-8 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 flex items-center justify-center text-xs font-bold transition-colors"
          >
            Reset
          </button>
          <button
            onClick={() => setZoomLevel((z) => Math.min(1.5, z + 0.1))}
            className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 flex items-center justify-center text-sm font-bold transition-colors"
          >
            +
          </button>
        </div>

        {/* Desktop Symmetrical Bracket */}
        <div className="hidden md:block overflow-x-auto pb-8" style={{ height: `${1100 * zoomLevel}px` }}>
        <div className="flex flex-row gap-4 h-[1100px] select-none" style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left', width: `${100 / zoomLevel}%` }}>
          {/* LEFT WING */}
          {/* Column 1: Round of 32 Left */}
          {renderDesktopColumn('Round of 32', getMatchesByIds([1, 2, 3, 4, 5, 6, 7, 8]))}
          {/* Column 2: Round of 16 Left */}
          {renderDesktopColumn('Round of 16', getMatchesByIds([17, 18, 19, 20]))}
          {/* Column 3: Quarter-Finals Left */}
          {renderDesktopColumn('Quarter-Finals', getMatchesByIds([25, 26]))}
          {/* Column 4: Semi-Finals Left */}
          {renderDesktopColumn('Semi-Finals', getMatchesByIds([29]))}

          {/* CENTER: Finals & Champion */}
          <div className="flex-1 min-w-[280px] max-w-[320px] flex flex-col justify-center gap-12 h-full items-center">
            {/* Champion Showcase at top of center */}
            <div className="w-full flex flex-col items-center">
              <div className="text-center w-full py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-3">
                <h3 className="font-extrabold text-xs text-amber-400 tracking-wider uppercase">
                  World Champion
                </h3>
              </div>
              {champion ? (
                <div className={`w-full p-6 rounded-2xl bg-gradient-to-b from-amber-500/15 via-slate-900/90 to-slate-950 border border-amber-500/30 text-center flex flex-col items-center gap-3 shadow-xl hover:border-amber-400 transition-all duration-300 ${
                  isChampionBusted ? 'opacity-40 grayscale border-slate-900 shadow-none' : ''
                }`}>
                  <span className="text-4xl animate-bounce">🏆</span>
                  <div>
                    <span className="text-[10px] text-amber-500 font-extrabold tracking-widest uppercase block mb-0.5">
                      {champion.isReal ? 'Live Champion' : 'Your Champion'}
                      {isChampionBusted && ' (BUSTED)'}
                    </span>
                    <h4 className="text-lg font-black text-white">{champion.name}</h4>
                  </div>
                  <div className="scale-125 py-1">{renderFlag(champion.code)}</div>
                </div>
              ) : (
                <div className="w-full p-6 rounded-2xl bg-slate-900/20 border border-dashed border-slate-800 text-center flex flex-col items-center gap-2">
                  <span className="text-3xl opacity-30">🏆</span>
                  <p className="text-xs text-slate-500 font-medium max-w-[180px]">
                    Predict all matches to crown your Champion!
                  </p>
                </div>
              )}
            </div>

            {/* Finals Match Card in middle of center */}
            <div className="w-full">
              <div className="text-center w-full py-1.5 bg-slate-900/40 border border-slate-800/80 rounded-xl mb-3">
                <h3 className="font-extrabold text-xs text-slate-300 tracking-wider uppercase">
                  Grand Final
                </h3>
              </div>
              {getMatchesByIds([31]).map((m) => {
                const pred = predictions[m.id];
                const isBusted = !!(
                  pred &&
                  pred.predictedWinnerCode &&
                  (m.isCompleted
                    ? pred.predictedWinnerCode.toUpperCase() !== m.actualWinnerCode?.toUpperCase()
                    : eliminatedTeams.has(pred.predictedWinnerCode.toUpperCase()))
                );
                return (
                  <MatchCard
                    key={m.id}
                    match={m}
                    prediction={pred}
                    isBusted={isBusted}
                    onChange={(updates) => handlePredictionChange(m.id, updates)}
                    renderFlag={renderFlag}
                  />
                );
              })}
            </div>
          </div>

          {/* RIGHT WING */}
          {/* Column 6: Semi-Finals Right */}
          {renderDesktopColumn('Semi-Finals', getMatchesByIds([30]))}
          {/* Column 7: Quarter-Finals Right */}
          {renderDesktopColumn('Quarter-Finals', getMatchesByIds([27, 28]))}
          {/* Column 8: Round of 16 Right */}
          {renderDesktopColumn('Round of 16', getMatchesByIds([21, 22, 23, 24]))}
          {/* Column 9: Round of 32 Right */}
          {renderDesktopColumn('Round of 32', getMatchesByIds([9, 10, 11, 12, 13, 14, 15, 16]))}
        </div>
        </div>

        {/* Mobile View */}
        <div className="md:hidden flex flex-col gap-4 py-4">
          {activeMobileRound !== 'CHAMPION' ? (
            <div className="flex flex-col gap-4">
              <div className="text-center py-2 bg-slate-900/40 border border-slate-800/80 rounded-xl">
                <h3 className="font-extrabold text-sm text-slate-300 tracking-wider uppercase">
                  {ROUND_LABELS[activeMobileRound]}
                </h3>
              </div>
              {getRoundMatches(activeMobileRound).map((m) => {
                const pred = predictions[m.id];
                const isBusted = !!(
                  pred &&
                  pred.predictedWinnerCode &&
                  (m.isCompleted
                    ? pred.predictedWinnerCode.toUpperCase() !== m.actualWinnerCode?.toUpperCase()
                    : eliminatedTeams.has(pred.predictedWinnerCode.toUpperCase()))
                );
                return (
                  <MatchCard
                    key={m.id}
                    match={m}
                    prediction={pred}
                    isBusted={isBusted}
                    onChange={(updates) => handlePredictionChange(m.id, updates)}
                    renderFlag={renderFlag}
                  />
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center py-6">
              {champion ? (
                <div className={`w-full max-w-sm p-8 rounded-2xl bg-gradient-to-b from-amber-500/15 via-slate-900/95 to-slate-950 border border-amber-500/30 text-center flex flex-col items-center gap-4 shadow-xl ${
                  isChampionBusted ? 'opacity-40 grayscale border-slate-900 shadow-none' : ''
                }`}>
                  <span className="text-6xl animate-bounce">🏆</span>
                  <div>
                    <span className="text-xs text-amber-500 font-extrabold tracking-widest uppercase block mb-1">
                      {champion.isReal ? 'Live Champion' : 'Your Champion'}
                      {isChampionBusted && ' (BUSTED)'}
                    </span>
                    <h4 className="text-2xl font-black text-white">{champion.name}</h4>
                  </div>
                  <div className="scale-150 py-2">{renderFlag(champion.code)}</div>
                </div>
              ) : (
                <div className="w-full max-w-sm p-8 rounded-2xl bg-slate-900/20 border border-dashed border-slate-800 text-center flex flex-col items-center gap-3">
                  <span className="text-4xl opacity-30">🏆</span>
                  <p className="text-sm text-slate-500 font-medium">
                    Predict all rounds to crown your Champion!
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface MatchCardProps {
  match: Match;
  prediction?: Prediction;
  isBusted?: boolean;
  isLocked?: boolean;
  onChange: (updates: {
    homeScore?: string;
    awayScore?: string;
    predictPenalties?: boolean;
    penaltyWinnerCode?: string;
  }) => void;
  renderFlag: (code: string) => React.ReactNode;
}

function MatchCard({ match, prediction, isBusted, isLocked, onChange, renderFlag }: MatchCardProps) {
  const homeScore = prediction ? String(prediction.predictedHomeScore) : '';
  const awayScore = prediction ? String(prediction.predictedAwayScore) : '';
  const predictPenalties = prediction ? prediction.predictPenalties : false;
  const predictedWinnerCode = prediction ? prediction.predictedWinnerCode : '';

  // Determine tie status
  const parsedHome = homeScore.trim() === '' ? NaN : parseInt(homeScore, 10);
  const parsedAway = awayScore.trim() === '' ? NaN : parseInt(awayScore, 10);
  const showPenaltyToggle = !isNaN(parsedHome) && !isNaN(parsedAway) && parsedHome === parsedAway;

  const handleRowClick = (teamCode: string) => {
    if (match.isCompleted || !teamCode || teamCode === '') return;
    
    // Clicking a row either selects the penalty winner if scores are tied, or sets a default score
    if (showPenaltyToggle && predictPenalties) {
      onChange({ penaltyWinnerCode: teamCode });
    } else {
      if (teamCode === match.homeCode) {
        onChange({ homeScore: '1', awayScore: '0' });
      } else if (teamCode === match.awayCode) {
        onChange({ homeScore: '0', awayScore: '1' });
      }
    }
  };

  // Helpers to highlight predicted state
  const isHomeWinner =
    (!isNaN(parsedHome) && !isNaN(parsedAway) && parsedHome > parsedAway) ||
    (showPenaltyToggle && predictPenalties && predictedWinnerCode === match.homeCode);

  const isAwayWinner =
    (!isNaN(parsedHome) && !isNaN(parsedAway) && parsedAway > parsedHome) ||
    (showPenaltyToggle && predictPenalties && predictedWinnerCode === match.awayCode);

  // Calculate points earned for this prediction
  const getPointsEarned = () => {
    if (!match.isCompleted || !prediction) return null;
    
    const predWinner = prediction.predictedWinnerCode.toUpperCase();
    const actualWinner = match.actualWinnerCode?.toUpperCase();
    
    if (predWinner !== actualWinner) return 0;
    
    let points = 0;
    if (match.round === 'ROUND_OF_32') {
      points = 1;
    } else if (match.round === 'ROUND_OF_16') {
      points = 2;
    } else if (match.round === 'QUARTER_FINALS') {
      points = 4;
    } else if (match.round === 'SEMI_FINALS') {
      points = 8;
    } else if (match.round === 'FINALS') {
      points = 16;
    }

    const isExactScore = 
      prediction.predictedHomeScore === match.homeScore &&
      prediction.predictedAwayScore === match.awayScore &&
      prediction.predictPenalties === match.wentToPenalties;
      
    if (isExactScore) {
      points += 1;
    }
    return points;
  };

  const pointsEarned = getPointsEarned();

  return (
    <div className={`border rounded-xl p-3.5 hover:border-slate-700/80 transition-all duration-300 flex flex-col gap-2.5 shadow-sm shadow-slate-950/20 ${
      isBusted 
        ? 'opacity-40 grayscale border-slate-950 bg-slate-950/20 hover:border-slate-950'
        : 'bg-slate-900/50 border-slate-800/80'
    }`}>
      {/* Match Header */}
      <div className="flex items-center justify-between border-b border-slate-800/40 pb-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
        <span>Match {match.id}</span>
        <div className="flex items-center gap-1.5">
          {pointsEarned !== null && (
            <>
              {pointsEarned > 0 ? (
                <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                  match.round === 'ROUND_OF_32' && pointsEarned === 2
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                }`}>
                  +{pointsEarned} PTS {match.round === 'ROUND_OF_32' && pointsEarned === 2 ? '(Perfect)' : ''}
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded bg-slate-800/60 text-slate-500 border border-slate-800 text-[8px] font-bold uppercase tracking-wider">
                  +0 PTS
                </span>
              )}
            </>
          )}
          {isBusted ? (
            <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[8px] font-black uppercase tracking-wider">
              Busted
            </span>
          ) : match.isCompleted ? (
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Completed
            </span>
          ) : prediction ? (
            <span className="text-emerald-500">Predicted</span>
          ) : (
            <span className="text-slate-600">Pending</span>
          )}
        </div>
      </div>

      {/* Match Rows */}
      <div className="flex flex-col gap-2">
        {/* Home Row */}
        <div
          onClick={() => !match.isCompleted && handleRowClick(match.homeCode)}
          className={`flex items-center justify-between p-2 rounded-lg border transition-all duration-200 ${
            match.isCompleted
              ? 'border-transparent text-slate-300'
              : 'cursor-pointer hover:bg-slate-800/35 border-transparent text-slate-300 hover:text-slate-200'
          } ${
            isHomeWinner && !match.isCompleted
              ? 'bg-emerald-950/25 border-emerald-500/30 text-white font-semibold'
              : ''
          } ${
            match.isCompleted && match.actualWinnerCode === match.homeCode
              ? 'bg-emerald-950/15 text-white font-bold'
              : ''
          }`}
        >
          <div className="flex items-center gap-2.5 truncate">
            {renderFlag(match.homeCode)}
            <span className="text-xs font-bold truncate">{match.homeTeam}</span>
            {isHomeWinner && showPenaltyToggle && predictPenalties && !match.isCompleted && (
              <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1 py-0.5 rounded font-black">
                PEN
              </span>
            )}
            {match.isCompleted && match.actualWinnerCode === match.homeCode && (
              <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-extrabold uppercase">
                WIN
              </span>
            )}
          </div>
          {match.isCompleted ? (
            <div className="flex items-center gap-1.5 text-xs">
              <div className="flex flex-col items-center">
                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider leading-none mb-0.5">Pred</span>
                <span className="font-extrabold px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400 min-w-[20px] text-center text-[10px]">
                  {prediction ? prediction.predictedHomeScore : '-'}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider leading-none mb-0.5">Live</span>
                <span className="font-extrabold px-1.5 py-0.5 rounded bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 min-w-[20px] text-center text-[10px]">
                  {match.homeScore}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={homeScore}
                disabled={isLocked}
                onChange={(e) => onChange({ homeScore: e.target.value })}
                className={`w-10 h-7 rounded text-center text-xs font-bold focus:outline-none transition-all ${
                  isLocked
                    ? 'bg-slate-800/50 border border-slate-700/50 text-slate-500 cursor-not-allowed'
                    : 'bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-emerald-500 text-white'
                }`}
              />
            </div>
          )}
        </div>

        {/* Away Row */}
        <div
          onClick={() => !match.isCompleted && handleRowClick(match.awayCode)}
          className={`flex items-center justify-between p-2 rounded-lg border transition-all duration-200 ${
            match.isCompleted
              ? 'border-transparent text-slate-300'
              : 'cursor-pointer hover:bg-slate-800/35 border-transparent text-slate-300 hover:text-slate-200'
          } ${
            isAwayWinner && !match.isCompleted
              ? 'bg-emerald-950/25 border-emerald-500/30 text-white font-semibold'
              : ''
          } ${
            match.isCompleted && match.actualWinnerCode === match.awayCode
              ? 'bg-emerald-950/15 text-white font-bold'
              : ''
          }`}
        >
          <div className="flex items-center gap-2.5 truncate">
            {renderFlag(match.awayCode)}
            <span className="text-xs font-bold truncate">{match.awayTeam}</span>
            {isAwayWinner && showPenaltyToggle && predictPenalties && !match.isCompleted && (
              <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1 py-0.5 rounded font-black">
                PEN
              </span>
            )}
            {match.isCompleted && match.actualWinnerCode === match.awayCode && (
              <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-extrabold uppercase">
                WIN
              </span>
            )}
          </div>
          {match.isCompleted ? (
            <div className="flex items-center gap-1.5 text-xs">
              <div className="flex flex-col items-center">
                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider leading-none mb-0.5">Pred</span>
                <span className="font-extrabold px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400 min-w-[20px] text-center text-[10px]">
                  {prediction ? prediction.predictedAwayScore : '-'}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider leading-none mb-0.5">Live</span>
                <span className="font-extrabold px-1.5 py-0.5 rounded bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 min-w-[20px] text-center text-[10px]">
                  {match.awayScore}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={awayScore}
                disabled={isLocked}
                onChange={(e) => onChange({ awayScore: e.target.value })}
                className={`w-10 h-7 rounded text-center text-xs font-bold focus:outline-none transition-all ${
                  isLocked
                    ? 'bg-slate-800/50 border border-slate-700/50 text-slate-500 cursor-not-allowed'
                    : 'bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-emerald-500 text-white'
                }`}
              />
            </div>
          )}
        </div>
      </div>

      {/* Live Result Details */}
      {match.isCompleted && (
        <div className="p-2 rounded bg-slate-950/50 border border-slate-800/50 text-[10px] text-slate-400 mt-0.5">
          <div className="flex justify-between items-center mb-1">
            <span className="font-bold text-slate-500">Live Result:</span>
            <span className="font-extrabold text-emerald-400">
              {match.homeScore} - {match.awayScore}
              {match.wentToPenalties && ' (PEN)'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-bold text-slate-500">Winner:</span>
            <span className="font-extrabold text-slate-200">{match.actualWinner}</span>
          </div>
        </div>
      )}

      {/* Penalty shootout toggle */}
      {!match.isCompleted && showPenaltyToggle && (
        <div className="flex flex-col gap-1.5 mt-1 border-t border-slate-800/40 pt-2 animate-fade-in">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`penalties-${match.id}`}
              checked={predictPenalties}
              onChange={(e) => onChange({ predictPenalties: e.target.checked })}
              className="rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-950 h-3.5 w-3.5 cursor-pointer"
            />
            <label
              htmlFor={`penalties-${match.id}`}
              className="cursor-pointer text-[10px] font-bold text-slate-400 hover:text-slate-300 select-none"
            >
              Will go to penalty shootout
            </label>
          </div>
          {predictPenalties && !predictedWinnerCode && (
            <span className="text-[9px] text-amber-500 font-medium pl-5 animate-pulse">
              ⚠️ Click on a team row above to select the shootout winner
            </span>
          )}
        </div>
      )}
    </div>
  );
}
