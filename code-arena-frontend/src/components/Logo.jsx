
function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-violet-600 text-lg font-bold text-white shadow-lg shadow-blue-500/20">
        {"</>"}
      </div>

      <h1 className="text-xl font-extrabold tracking-tight text-white">
        Code<span className="text-blue-400">Arena</span>
      </h1>
    </div>
  );
}

export default Logo;
