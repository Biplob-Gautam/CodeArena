
const starterCode = {
  JavaScript: `function twoSum(nums, target) {
  // Write your solution here

}`,
  Python: `def two_sum(nums, target):
    # Write your solution here
    pass`,
  Java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Write your solution here
        return new int[]{};
    }
}`,
  "C++": `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Write your solution here
        return {};
    }
};`,
  C: `// Write your solution here

`,
};

function CodeEditor({
  language,
  code,
  setCode,
  onSubmit,
  submitting = false,
}) {
  const resetCode = () => {
    setCode(starterCode[language] || "");
  };

  const lineCount = Math.max(code.split("\n").length, 1);

  return (
    <section className="flex min-h-125 flex-col overflow-hidden rounded-xl border border-slate-800 bg-[#101827]">

      {/* Editor Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 p-4">

        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-red-500" />
            <span className="h-3 w-3 rounded-full bg-yellow-500" />
            <span className="h-3 w-3 rounded-full bg-green-500" />
          </div>

          <span className="text-xs font-semibold text-slate-300">
            Solution.{language === "JavaScript"
              ? "js"
              : language === "Python"
              ? "py"
              : language === "Java"
              ? "java"
              : language === "C++"
              ? "cpp"
              : "c"}
          </span>
        </div>

        <button
          onClick={resetCode}
          className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-400 transition hover:border-blue-500 hover:text-white"
        >
          Reset Code
        </button>

      </div>

      {/* Editor Body */}
      <div className="flex flex-1 overflow-hidden bg-[#080b14]">

        {/* Line Numbers */}
        <div className="select-none border-r border-slate-800 px-3 py-4 text-right font-mono text-xs leading-6 text-slate-600">
          {Array.from({ length: lineCount }, (_, index) => (
            <div key={index}>{index + 1}</div>
          ))}
        </div>

        {/* Code Input */}
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck="false"
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          aria-label="Code editor"
          placeholder="Write your solution here..."
          className="min-h-100 w-full resize-none bg-transparent p-4 font-mono text-sm leading-6 text-green-300 outline-none placeholder:text-slate-600"
        />

      </div>

      {/* Editor Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 p-4">

        <p className="text-[10px] text-slate-500">
          Auto-save is not enabled
        </p>

        <button
          onClick={onSubmit}
          disabled={submitting || !code.trim()}
          className="rounded-lg bg-linear-to-r from-blue-600 to-violet-600 px-6 py-3 text-xs font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "▶ Submit Solution"}
        </button>

      </div>

    </section>
  );
}

export { starterCode };
export default CodeEditor;
