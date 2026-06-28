import React from 'react';

export default function RulesPage() {
  return (
    <div className="py-6 sm:py-8 max-w-3xl mx-auto px-4">
      {/* Page Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-2">
          Scoring Rules
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto">
          How points are calculated for your bracket predictions.
        </p>
      </div>

      {/* Points by Round */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-md shadow-lg p-6 sm:p-8 mb-6">
        <h2 className="text-lg font-bold text-white mb-4">Correct Winner Prediction</h2>
        <p className="text-sm text-slate-400 mb-5">
          Points are awarded for correctly predicting the advancing team. The value increases each round:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {[
            { round: 'Round of 32', points: 1, color: 'slate' },
            { round: 'Round of 16', points: 2, color: 'slate' },
            { round: 'Quarter-Finals', points: 4, color: 'blue' },
            { round: 'Semi-Finals', points: 8, color: 'purple' },
            { round: 'Final', points: 16, color: 'amber' },
          ].map((r) => (
            <div
              key={r.round}
              className={`flex flex-col items-center p-4 rounded-xl border ${
                r.color === 'amber'
                  ? 'bg-amber-950/20 border-amber-500/20'
                  : r.color === 'purple'
                  ? 'bg-purple-950/20 border-purple-500/20'
                  : r.color === 'blue'
                  ? 'bg-blue-950/20 border-blue-500/20'
                  : 'bg-slate-900/60 border-slate-800'
              }`}
            >
              <span className={`text-2xl font-black ${
                r.color === 'amber'
                  ? 'text-amber-400'
                  : r.color === 'purple'
                  ? 'text-purple-400'
                  : r.color === 'blue'
                  ? 'text-blue-400'
                  : 'text-emerald-400'
              }`}>
                +{r.points}
              </span>
              <span className="text-xs font-semibold text-slate-400 mt-1 text-center">{r.round}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Exact Score Bonus */}
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/10 backdrop-blur-md shadow-lg p-6 sm:p-8 mb-6">
        <h2 className="text-lg font-bold text-emerald-300 mb-4">Exact Score Bonus</h2>
        <p className="text-sm text-slate-400 mb-4">
          Earn <span className="text-emerald-400 font-bold">+1 bonus point</span> on top of the winner points if <span className="text-white font-semibold">all three</span> conditions match:
        </p>
        <ul className="space-y-2.5 text-sm text-slate-300">
          <li className="flex items-start gap-2.5">
            <span className="text-emerald-500 mt-0.5 shrink-0">&#10003;</span>
            Your predicted Team A score matches the actual Team A score
          </li>
          <li className="flex items-start gap-2.5">
            <span className="text-emerald-500 mt-0.5 shrink-0">&#10003;</span>
            Your predicted Team B score matches the actual Team B score
          </li>
          <li className="flex items-start gap-2.5">
            <span className="text-emerald-500 mt-0.5 shrink-0">&#10003;</span>
            Your penalty shootout prediction matches the actual outcome
          </li>
        </ul>
      </div>

      {/* Other Rules */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-md shadow-lg p-6 sm:p-8 mb-8">
        <h2 className="text-lg font-bold text-white mb-4">Other Rules</h2>
        <ul className="space-y-2.5 text-sm text-slate-300">
          <li className="flex items-start gap-2.5">
            <span className="text-red-400 mt-0.5 shrink-0">&#10007;</span>
            Wrong winner prediction = <span className="text-white font-semibold">0 points</span> (no partial credit)
          </li>
          <li className="flex items-start gap-2.5">
            <span className="text-amber-400 mt-0.5 shrink-0">&#9888;</span>
            Predictions must be <span className="text-white font-semibold">locked</span> before matches begin &mdash; no changes after submission
          </li>
          <li className="flex items-start gap-2.5">
            <span className="text-blue-400 mt-0.5 shrink-0">&#9432;</span>
            Points double each round, making later-round picks significantly more valuable
          </li>
          <li className="flex items-start gap-2.5">
            <span className="text-purple-400 mt-0.5 shrink-0">&#9733;</span>
            Maximum possible points: <span className="text-white font-semibold">31 base</span> + <span className="text-emerald-400 font-semibold">31 bonus</span> = <span className="text-amber-400 font-bold">62 total</span>
          </li>
        </ul>
      </div>

      {/* Scoring Example */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-md shadow-lg p-6 sm:p-8">
        <h2 className="text-lg font-bold text-white mb-6">Scoring Example</h2>

        {/* Round of 16 */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 uppercase tracking-wider">
              Round of 16
            </span>
            <span className="text-xs text-slate-500">+2 per correct winner</span>
          </div>

          <div className="space-y-3">
            {/* Match 1 - Exact score */}
            <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="text-sm font-bold text-white mb-1">Germany vs Argentina</div>
                  <div className="flex flex-col sm:flex-row gap-1 sm:gap-4 text-xs">
                    <span className="text-slate-400">Your prediction: <span className="text-blue-400 font-semibold">Germany 2-1</span></span>
                    <span className="text-slate-400">Actual result: <span className="text-emerald-400 font-semibold">Germany 2-1</span></span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 text-xs font-bold">+2</span>
                  <span className="text-slate-600">+</span>
                  <span className="px-2 py-1 rounded bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 text-xs font-bold">+1 bonus</span>
                  <span className="text-slate-600">=</span>
                  <span className="px-2.5 py-1 rounded bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-sm font-black">3 pts</span>
                </div>
              </div>
            </div>

            {/* Match 2 - Wrong winner */}
            <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4 opacity-60">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="text-sm font-bold text-white mb-1">Spain vs Belgium</div>
                  <div className="flex flex-col sm:flex-row gap-1 sm:gap-4 text-xs">
                    <span className="text-slate-400">Your prediction: <span className="text-blue-400 font-semibold">Spain 1-0</span></span>
                    <span className="text-slate-400">Actual result: <span className="text-emerald-400 font-semibold">Belgium 2-1</span></span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded bg-red-500/15 border border-red-500/20 text-red-400 text-sm font-black">0 pts</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quarter-Finals */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-2.5 py-1 rounded-lg bg-blue-950/40 border border-blue-500/20 text-xs font-bold text-blue-300 uppercase tracking-wider">
              Quarter-Finals
            </span>
            <span className="text-xs text-slate-500">+4 per correct winner</span>
          </div>

          <div className="space-y-3">
            {/* Match 3 - Exact score with penalties */}
            <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="text-sm font-bold text-white mb-1">Germany vs Belgium</div>
                  <div className="flex flex-col sm:flex-row gap-1 sm:gap-4 text-xs">
                    <span className="text-slate-400">Your prediction: <span className="text-blue-400 font-semibold">1-1 (Germany on pens)</span></span>
                    <span className="text-slate-400">Actual result: <span className="text-emerald-400 font-semibold">1-1 (Germany on pens)</span></span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 text-xs font-bold">+4</span>
                  <span className="text-slate-600">+</span>
                  <span className="px-2 py-1 rounded bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 text-xs font-bold">+1 bonus</span>
                  <span className="text-slate-600">=</span>
                  <span className="px-2.5 py-1 rounded bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-sm font-black">5 pts</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Running Total */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-emerald-500/10 border border-amber-500/20">
          <span className="text-sm font-bold text-slate-300">Running Total</span>
          <span className="text-xl font-black text-amber-400">3 + 0 + 5 = 8 points</span>
        </div>
      </div>
    </div>
  );
}
