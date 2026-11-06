
const languages = [
  "JavaScript",
  "Python",
  "Java",
  "C++",
  "C",
];

function LanguageSelector({
  language,
  onLanguageChange,
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">

      <label
        htmlFor="language"
        className="text-xs font-semibold text-slate-400"
      >
        Language:
      </label>

      <select
        id="language"
        value={language}
        onChange={(e) => onLanguageChange(e.target.value)}
        className="rounded-lg border border-slate-700 bg-[#101827] px-4 py-2 text-xs font-semibold text-white outline-none transition focus:border-blue-500"
      >
        {languages.map((lang) => (
          <option key={lang} value={lang}>
            {lang}
          </option>
        ))}
      </select>

    </div>
  );
}

export default LanguageSelector;
