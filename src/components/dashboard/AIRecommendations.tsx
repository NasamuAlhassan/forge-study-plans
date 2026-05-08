import { Sparkles, Brain, Coffee, Sun } from "lucide-react";

const recs = [
  {
    icon: Brain,
    title: "Front-load Calculus this week",
    desc: "Your last quiz showed weak spots in integration. We've added 2× 90-min focus blocks before Friday's tutorial.",
  },
  {
    icon: Coffee,
    title: "Take a longer break Thursday evening",
    desc: "You've logged 4 high-intensity sessions in a row. A real recovery window will protect your streak.",
  },
  {
    icon: Sun,
    title: "Shift Linear Algebra to mornings",
    desc: "Your focus score is 38% higher between 8–11am. Forge can rebalance your week — one tap.",
  },
];

export function AIRecommendations() {
  return (
    <div className="ring-gradient glass rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-primary grid place-items-center shadow-glow">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-base font-semibold">AI recommendations</h3>
            <p className="text-xs text-muted-foreground">Tuned to your week, exams & energy</p>
          </div>
        </div>
        <button className="text-xs text-primary-glow hover:underline">Regenerate</button>
      </div>

      <div className="mt-4 space-y-3">
        {recs.map((r) => (
          <div key={r.title} className="flex gap-3 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors">
            <div className="h-8 w-8 shrink-0 rounded-lg bg-gradient-to-br from-indigo-500/40 to-purple-500/40 grid place-items-center">
              <r.icon className="h-4 w-4 text-primary-glow" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium">{r.title}</div>
              <p className="text-xs text-muted-foreground mt-0.5">{r.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
