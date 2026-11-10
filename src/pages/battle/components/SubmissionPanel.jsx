
function SubmissionPanel({ submission }) {
  const statusLabel = submission?.status
    ? submission.status
        .toLowerCase()
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase())
    : "";
  const isAccepted = submission?.status === "ACCEPTED";
  const isFailure =
    submission?.status === "REQUEST_FAILED" ||
    (submission?.status &&
      !["QUEUED", "PROCESSING", "ACCEPTED"].includes(submission.status));

  return (
    <section className="rounded-xl border border-slate-800 bg-[#101827] p-5">

      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-sm font-bold text-white">
          Submission Results
        </h2>

        <span className="rounded-md bg-blue-500/10 px-3 py-1 text-[10px] font-bold text-blue-400">
          LATEST SUBMISSION
        </span>
      </div>

      {!submission ? (
        <div className="rounded-lg border border-dashed border-slate-700 py-8 text-center">
          <div className="mb-3 text-3xl text-slate-600">
            {"</>"}
          </div>

          <p className="text-sm font-semibold text-slate-400">
            No submissions yet
          </p>

          <p className="mt-2 text-xs text-slate-600">
            Submit your code to see its status here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Status
            </span>

            <span
              className={`rounded-md px-3 py-1 text-xs font-bold ${
                isAccepted
                  ? "bg-green-500/10 text-green-400"
                  : isFailure
                  ? "bg-red-500/10 text-red-400"
                  : "bg-yellow-500/10 text-yellow-400"
              }`}
            >
              {statusLabel}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Language
            </span>

            <span className="text-xs font-semibold text-white">
              {submission.language}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Submitted At
            </span>

            <span className="text-xs text-white">
              {submission.submittedAt
                ? new Date(submission.submittedAt).toLocaleTimeString()
                : "—"}
            </span>
          </div>

          {submission.totalTestCases != null && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Test cases passed</span>
              <span className="text-xs font-semibold text-white">
                {submission.passedTestCases ?? 0} / {submission.totalTestCases}
              </span>
            </div>
          )}

          {submission.executionTimeMs != null && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Execution time</span>
              <span className="text-xs font-semibold text-white">
                {submission.executionTimeMs} ms
              </span>
            </div>
          )}

          {submission.memoryUsedKb != null && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Memory used</span>
              <span className="text-xs font-semibold text-white">
                {submission.memoryUsedKb} KB
              </span>
            </div>
          )}

          {(submission.error || submission.compileOutput || submission.stderr) && (
            <pre
              role={submission.error ? "alert" : undefined}
              className="max-h-56 overflow-auto whitespace-pre-wrap rounded-lg border border-slate-700 bg-[#080b14] p-3 text-xs leading-5 text-red-300"
            >
              {submission.error ||
                submission.compileOutput ||
                submission.stderr}
            </pre>
          )}
        </div>
      )}

    </section>
  );
}

export default SubmissionPanel;
