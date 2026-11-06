
function SubmissionPanel({ submission }) {
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

            <span className="rounded-md bg-yellow-500/10 px-3 py-1 text-xs font-bold text-yellow-400">
              {submission.status}
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
              {submission.time}
            </span>
          </div>

          <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3">
            <p className="text-xs leading-6 text-yellow-300">
              Your code has been captured by the frontend.
              Actual compilation, test execution, and judging
              will be handled by the backend integration.
            </p>
          </div>

        </div>
      )}

    </section>
  );
}

export default SubmissionPanel;
