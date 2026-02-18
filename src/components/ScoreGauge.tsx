interface ScoreGaugeProps {
  score: number;
  label: string;
}

export function ScoreGauge({ score, label }: ScoreGaugeProps) {
  const getColor = (s: number) => {
    if (s >= 90) return { ring: "#22c55e", bg: "bg-emerald-500/10", text: "text-emerald-400", glow: "glow-green" };
    if (s >= 50) return { ring: "#eab308", bg: "bg-yellow-500/10", text: "text-yellow-400", glow: "glow-yellow" };
    return { ring: "#ef4444", bg: "bg-red-500/10", text: "text-red-400", glow: "glow-red" };
  };

  const getLabel = (s: number) => {
    if (s >= 90) return "Excellent";
    if (s >= 70) return "Bon";
    if (s >= 50) return "Moyen";
    return "À améliorer";
  };

  const colors = getColor(score);
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className={`relative w-32 h-32 mb-3 ${colors.glow} rounded-full`}>
        <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-white/5"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke={colors.ring}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="animate-score-fill"
            style={{ 
              "--initial-offset": circumference,
              transition: "stroke-dashoffset 1.2s ease-out"
            } as React.CSSProperties}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-3xl font-extrabold ${colors.text}`}>{score}</span>
        </div>
      </div>
      <p className="font-semibold text-white text-lg">{label}</p>
      <span
        className={`text-xs px-3 py-1 rounded-full mt-1.5 font-medium ${colors.bg} ${colors.text}`}
      >
        {getLabel(score)}
      </span>
    </div>
  );
}
