
function LoadingSpinner({ size = "md", text = "Loading..." }) {
  const sizes = {
    sm: "h-5 w-5 border-2",
    md: "h-8 w-8 border-[3px]",
    lg: "h-12 w-12 border-4",
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`animate-spin rounded-full border-blue-500 border-t-transparent ${
          sizes[size] || sizes.md
        }`}
      />

      {text && (
        <p className="text-sm font-medium text-slate-400">
          {text}
        </p>
      )}
    </div>
  );
}

export default LoadingSpinner;
