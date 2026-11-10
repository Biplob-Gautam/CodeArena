
function ProblemPanel({
  problem = {
    title: "Two Sum",
    difficulty: "Easy",
    description:
      "Given an array of integers nums and an integer target, return the indices of the two numbers that add up to target.",
    input: "nums = [2, 7, 11, 15], target = 9",
    output: "[0, 1]",
    constraints: [
      "2 <= nums.length <= 10^4",
      "-10^9 <= nums[i] <= 10^9",
      "Only one valid answer exists.",
    ],
  },
}) {
  const difficultyColor = {
    Easy: "bg-green-500/10 text-green-400",
    Medium: "bg-yellow-500/10 text-yellow-400",
    Hard: "bg-red-500/10 text-red-400",
  };
  const constraints = Array.isArray(problem.constraints)
    ? problem.constraints
    : [];
  const example = Array.isArray(problem.examples) ? problem.examples[0] : null;

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-800 bg-[#101827]">

      {/* Header */}
      <div className="border-b border-slate-800 p-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[10px] font-bold tracking-widest text-slate-500">
            PROBLEM STATEMENT
          </span>

          <span className="text-xs text-slate-500">
            #001
          </span>
        </div>

        <h2 className="text-xl font-extrabold text-white">
          {problem.title}
        </h2>

        <span
          className={`mt-3 inline-block rounded-md px-3 py-1 text-xs font-bold ${
            difficultyColor[problem.difficulty] ||
            "bg-slate-700 text-slate-300"
          }`}
        >
          {problem.difficulty}
        </span>
      </div>

      {/* Problem Content */}
      <div className="flex-1 space-y-6 overflow-y-auto p-5">

        <div>
          <h3 className="mb-2 text-sm font-bold text-white">
            Description
          </h3>

          <p className="text-sm leading-7 text-slate-400">
            {problem.description}
          </p>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-bold text-white">
            Example
          </h3>

          <div className="rounded-lg border border-slate-700 bg-[#080b14] p-4 font-mono text-xs leading-7">
            <p className="text-slate-500">Input:</p>
            <p className="text-green-400">{example?.input ?? problem.input}</p>

            <p className="mt-2 text-slate-500">Output:</p>
            <p className="text-blue-400">{example?.output ?? problem.output}</p>
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-bold text-white">
            Constraints
          </h3>

          <ul className="list-inside list-disc space-y-2 text-xs leading-6 text-slate-400">
            {constraints.map((constraint, index) => (
              <li key={index}>{constraint}</li>
            ))}
          </ul>
        </div>

      </div>

    </section>
  );
}

export default ProblemPanel;
