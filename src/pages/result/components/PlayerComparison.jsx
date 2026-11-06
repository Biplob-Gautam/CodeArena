function PlayerComparison({ players }) {
  const stats = [
    {
      label: "Test Cases Passed",
      key: "testCases",
      suffix: "",
    },
    {
      label: "Execution Time",
      key: "executionTime",
      suffix: "s",
    },
    {
      label: "Code Submissions",
      key: "submissions",
      suffix: "",
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#101827] p-6">
      <h2 className="mb-6 text-xl font-bold text-white">
        Player Comparison
      </h2>

      <div className="mb-8 grid grid-cols-2 gap-4">
        {players.map((player, index) => (
          <div
            key={player.username}
            className={`rounded-xl border p-4 text-center ${
              index === 0
                ? "border-blue-500/30 bg-blue-500/10"
                : "border-violet-500/30 bg-violet-500/10"
            }`}
          >
            <div
              className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full text-xl font-bold ${
                index === 0
                  ? "bg-blue-500/20 text-blue-400"
                  : "bg-violet-500/20 text-violet-400"
              }`}
            >
              {player.username.charAt(0).toUpperCase()}
            </div>

            <h3 className="font-semibold text-white">
              {player.username}
            </h3>

            <p className="mt-1 text-sm text-slate-400">
              Rating: {player.rating}
            </p>

            {player.isWinner && (
              <span className="mt-3 inline-block rounded-full bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-400">
                Winner
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="space-y-6">
        {stats.map((stat) => {
          const player1Value = players[0][stat.key];
          const player2Value = players[1][stat.key];

          const firstWins =
            stat.key === "executionTime"
              ? player1Value < player2Value
              : player1Value > player2Value;

          return (
            <div key={stat.key}>
              <p className="mb-3 text-center text-sm text-slate-400">
                {stat.label}
              </p>

              <div className="flex items-center justify-between gap-3">
                <span
                  className={`font-bold ${
                    firstWins ? "text-blue-400" : "text-white"
                  }`}
                >
                  {player1Value}
                  {stat.suffix}
                </span>

                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="flex h-full"
                    style={{
                      width: "100%",
                    }}
                  >
                    <div
                      className="h-full bg-blue-500"
                      style={{
                        width: `${
                          (player1Value /
                            (player1Value + player2Value || 1)) *
                          100
                        }%`,
                      }}
                    />

                    <div className="h-full flex-1 bg-violet-500" />
                  </div>
                </div>

                <span
                  className={`font-bold ${
                    !firstWins ? "text-violet-400" : "text-white"
                  }`}
                >
                  {player2Value}
                  {stat.suffix}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex justify-between text-xs text-slate-500">
        <span>Blue: Player 1</span>
        <span>Violet: Player 2</span>
      </div>
    </div>
  );
}

export default PlayerComparison;