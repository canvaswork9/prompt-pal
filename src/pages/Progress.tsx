import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const ProgressPage = () => {
  // Mock data
  const stats = [
    { label: 'Avg Score', value: '74', sub: '30 days' },
    { label: 'Green Days', value: '68%', sub: '30 days' },
    { label: 'Streak', value: '8 🔥', sub: 'current' },
    { label: 'Sessions', value: '24', sub: 'this month' },
  ];

  const chartData = Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    score: Math.floor(50 + Math.random() * 40),
  }));

  const prs = [
    { exercise: 'Barbell Squat', est1rm: '105 kg', best: '90kg × 5', date: 'Mar 8' },
    { exercise: 'Bench Press', est1rm: '85 kg', best: '75kg × 6', date: 'Mar 5' },
    { exercise: 'Deadlift', est1rm: '130 kg', best: '110kg × 5', date: 'Feb 28' },
    { exercise: 'Overhead Press', est1rm: '65 kg', best: '55kg × 8', date: 'Mar 1' },
  ];

  const heatmapData = Array.from({ length: 84 }, () => {
    const r = Math.random();
    return r > 0.7 ? 'green' : r > 0.4 ? 'yellow' : r > 0.2 ? 'red' : 'gray';
  });

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      <h1 className="text-display text-2xl">Progress Dashboard</h1>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-card rounded-xl p-4 card-shadow text-center"
          >
            <div className="text-xs text-muted-foreground uppercase">{s.label}</div>
            <div className="font-display text-2xl font-bold mt-1">{s.value}</div>
            <div className="text-[10px] text-muted-foreground">{s.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Readiness Timeline */}
      <div className="bg-card rounded-xl p-5 card-shadow">
        <h3 className="font-semibold mb-4">Readiness Timeline (30 days)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="day" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
            <YAxis domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
            <Tooltip
              contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, color: 'hsl(var(--foreground))' }}
            />
            <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Training Heatmap */}
      <div className="bg-card rounded-xl p-5 card-shadow">
        <h3 className="font-semibold mb-4">Training Heatmap (12 weeks)</h3>
        <div className="grid grid-cols-[repeat(12,1fr)] gap-1">
          {heatmapData.map((color, i) => (
            <div
              key={i}
              className={`aspect-square rounded-sm ${
                color === 'green' ? 'bg-status-green' :
                color === 'yellow' ? 'bg-status-yellow' :
                color === 'red' ? 'bg-status-red' :
                'bg-secondary'
              }`}
            />
          ))}
        </div>
        <div className="flex gap-3 mt-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-status-green" /> Trained (Green)</span>
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-status-yellow" /> Light Day</span>
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-status-red" /> Rest</span>
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-secondary" /> No Data</span>
        </div>
      </div>

      {/* Personal Records */}
      <div className="bg-card rounded-xl p-5 card-shadow">
        <h3 className="font-semibold mb-4">Personal Records</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground text-xs uppercase border-b border-border">
                <th className="text-left py-2">Exercise</th>
                <th className="text-right py-2">Est. 1RM</th>
                <th className="text-right py-2">Best Set</th>
                <th className="text-right py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {prs.map(pr => (
                <tr key={pr.exercise} className="border-b border-border/50">
                  <td className="py-2 font-medium">{pr.exercise}</td>
                  <td className="py-2 text-right font-mono">{pr.est1rm}</td>
                  <td className="py-2 text-right font-mono text-muted-foreground">{pr.best}</td>
                  <td className="py-2 text-right text-muted-foreground">{pr.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProgressPage;
