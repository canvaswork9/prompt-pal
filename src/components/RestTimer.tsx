import { useState, useEffect } from 'react';

interface RestTimerProps {
  seconds: number;
  onDone: () => void;
}

const RestTimer = ({ seconds, onDone }: RestTimerProps) => {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (remaining <= 0) { onDone(); return; }
    const t = setTimeout(() => setRemaining(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, onDone]);

  const pct = ((seconds - remaining) / seconds) * 100;

  return (
    <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg border border-primary/30">
      <span className="font-mono text-primary text-lg">{remaining}s</span>
      <div className="flex-1">
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs text-muted-foreground mt-1">Rest — next set ready soon</span>
      </div>
      <button onClick={onDone} className="text-xs text-muted-foreground underline hover:text-foreground">Skip</button>
    </div>
  );
};

export default RestTimer;
