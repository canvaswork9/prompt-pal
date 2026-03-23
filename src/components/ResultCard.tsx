import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import ReadinessRing from '@/components/ReadinessRing';
import type { ReadinessResult, CheckinData } from '@/lib/types';

interface ResultCardProps {
  result: ReadinessResult;
  data: CheckinData;
  onBack: () => void;
}

// ── Share Card (rendered offscreen, captured as image) ──────────
const ShareCardCanvas = ({
  score, status, decision, split, date,
}: {
  score: number; status: string; decision: string; split: string; date: string;
}) => {
  const statusColor =
    status === 'Green'  ? '#baff29' :
    status === 'Yellow' ? '#fbbf24' : '#ef4444';

  const statusBg =
    status === 'Green'  ? 'rgba(186,255,41,0.12)' :
    status === 'Yellow' ? 'rgba(251,191,36,0.12)'  : 'rgba(239,68,68,0.12)';

  const ring = Math.round((score / 100) * 283);

  return (
    <div style={{
      width: 400, height: 400,
      background: 'linear-gradient(135deg,#0a0a1a 0%,#0d0d2a 100%)',
      borderRadius: 24, padding: 32,
      fontFamily: "'Barlow Condensed', sans-serif",
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      border: `1px solid ${statusColor}30`,
      boxSizing: 'border-box',
    }}>
      {/* Top — brand */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>⚡</span>
          <span style={{ color: '#ffffff', fontWeight: 800, fontSize: 18, letterSpacing: '0.08em' }}>
            FitDecide
          </span>
        </div>
        <span style={{ color: '#404070', fontSize: 13, letterSpacing: '0.06em' }}>
          {date}
        </span>
      </div>

      {/* Center — score ring */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <svg width="140" height="140" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#111125" strokeWidth="8" />
          <circle cx="50" cy="50" r="45"
            fill="none" stroke={statusColor} strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray="283"
            strokeDashoffset={283 - ring}
            transform="rotate(-90 50 50)"
          />
          <text x="50" y="44" textAnchor="middle"
            style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 30, fill: '#ffffff' }}>
            {score}
          </text>
          <text x="50" y="58" textAnchor="middle"
            style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 10, fill: '#404070', letterSpacing: 2 }}>
            / 100
          </text>
          <text x="50" y="70" textAnchor="middle"
            style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, fill: statusColor, letterSpacing: 2 }}>
            {status.toUpperCase()}
          </text>
        </svg>

        {/* Decision badge */}
        <div style={{
          padding: '6px 18px', borderRadius: 20,
          background: statusBg, border: `1px solid ${statusColor}40`,
          color: statusColor, fontWeight: 700, fontSize: 14, letterSpacing: '0.04em',
        }}>
          {decision}
        </div>
      </div>

      {/* Bottom — split + tagline */}
      <div>
        <div style={{ color: '#606090', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
          TODAY'S PLAN
        </div>
        <div style={{ color: '#e8e8ff', fontWeight: 700, fontSize: 17, letterSpacing: '0.02em' }}>
          {split}
        </div>
        <div style={{ color: '#2a2a50', fontSize: 11, marginTop: 8, letterSpacing: '0.04em' }}>
          fitdecide.app · Know before you train
        </div>
      </div>
    </div>
  );
};

// ── Share buttons ───────────────────────────────────────────────
const ShareButtons = ({
  score, status, decision, imageDataUrl, onClose,
}: {
  score: number; status: string; decision: string;
  imageDataUrl: string | null; onClose: () => void;
}) => {
  const [copied, setCopied] = useState(false);

  const shareText = `My readiness score today: ${score}/100 — ${status} (${decision}) 💪\nTracked with FitDecide · fitdecide.app`;
  const encodedText = encodeURIComponent(shareText);
  const encodedUrl  = encodeURIComponent('https://fitdecide.app');

  const shareLinks = [
    {
      name: 'X (Twitter)',
      icon: '𝕏',
      color: '#000000',
      border: '#333',
      url: `https://twitter.com/intent/tweet?text=${encodedText}`,
    },
    {
      name: 'Facebook',
      icon: 'f',
      color: '#1877f2',
      border: '#1877f240',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
    },
  ];

  const handleDownload = () => {
    if (!imageDataUrl) return;
    const a  = document.createElement('a');
    a.href   = imageDataUrl;
    a.download = `fitdecide-score-${score}.png`;
    a.click();
  };

  const handleCopyText = async () => {
    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (!navigator.share) return;
    try {
      if (imageDataUrl && navigator.canShare) {
        const res  = await fetch(imageDataUrl);
        const blob = await res.blob();
        const file = new File([blob], 'fitdecide-score.png', { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: 'My FitDecide Score', text: shareText });
          return;
        }
      }
      await navigator.share({ title: 'My FitDecide Score', text: shareText, url: 'https://fitdecide.app' });
    } catch (err) {
      console.log('Share cancelled');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-card rounded-2xl p-5 space-y-4 card-shadow"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Share your score</h3>
          <button onClick={onClose} className="text-muted-foreground text-xl leading-none">×</button>
        </div>

        {/* Preview */}
        {imageDataUrl && (
          <div className="flex justify-center">
            <img src={imageDataUrl} alt="Score card"
              className="rounded-xl w-48 h-48 object-cover"
              style={{ border: '1px solid rgba(108,99,255,0.2)' }} />
          </div>
        )}

        {/* Native share (mobile) */}
        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <Button onClick={handleNativeShare} className="w-full" variant="accent">
            📤 Share
          </Button>
        )}

        {/* Platform buttons */}
        <div className="grid grid-cols-2 gap-2">
          {shareLinks.map(s => (
            <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.97]"
              style={{ background: `${s.color}18`, border: `1px solid ${s.border}`, color: s.color === '#000000' ? '#ffffff' : s.color }}>
              <span className="font-bold">{s.icon}</span>
              {s.name}
            </a>
          ))}
        </div>

        {/* Download + Copy */}
        <div className="grid grid-cols-2 gap-2">
          {imageDataUrl && (
            <Button variant="outline" size="sm" onClick={handleDownload} className="w-full">
              ⬇️ Download
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleCopyText}
            className={`w-full ${imageDataUrl ? '' : 'col-span-2'}`}>
            {copied ? '✓ Copied!' : '📋 Copy text'}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

// ── Main ResultCard ─────────────────────────────────────────────
const ResultCard = ({ result, data, onBack }: ResultCardProps) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const shareRef  = useRef<HTMLDivElement>(null);
  const [showShare, setShowShare]         = useState(false);
  const [imageDataUrl, setImageDataUrl]   = useState<string | null>(null);
  const [generating, setGenerating]       = useState(false);

  const breakdownItems = [
    { label: 'Sleep Duration', value: `${data.sleep_hours}h`,     score: result.score_breakdown.sleep_duration },
    { label: 'Sleep Quality',  value: data.sleep_quality,         score: result.score_breakdown.sleep_quality  },
    { label: 'Heart Rate',     value: `${data.resting_hr} bpm`,   score: result.score_breakdown.heart_rate     },
    { label: 'Recovery',       value: data.yesterday_training,    score: result.score_breakdown.recovery       },
    { label: 'Soreness',       value: data.muscle_soreness,       score: result.score_breakdown.soreness       },
    { label: 'Nutrition',      value: data.nutrition_load,        score: result.score_breakdown.nutrition      },
  ];

  const coachMessage = result.status === 'Green'
    ? "Your recovery looks solid today. Sleep was good and HR is in range. Hit your planned session with full intensity — you're in a great position to push for progress."
    : result.status === 'Yellow'
    ? "HR is a bit elevated and you have some lingering soreness. Train today but reduce load 15-20%. Focus on form and controlled reps. Sleep 8+ hours tonight and you'll be green tomorrow."
    : "Your body is signaling it needs rest. Elevated HR, poor sleep, and soreness all point to the same thing — take a recovery day. Light walking and stretching only.";

  const handleShare = async () => {
    setGenerating(true);
    try {
      // Dynamically import html2canvas to avoid bundle bloat
      const html2canvas = (await import('html2canvas')).default;
      if (shareRef.current) {
        const canvas = await html2canvas(shareRef.current, {
          backgroundColor: null,
          scale: 2,
          useCORS: true,
          logging: false,
        });
        setImageDataUrl(canvas.toDataURL('image/png'));
      }
    } catch (err) {
      console.error('Failed to generate share image:', err);
      // Still open share sheet without image
    }
    setGenerating(false);
    setShowShare(true);
  };

  const today = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <>
      {/* Hidden share card — rendered offscreen for html2canvas */}
      <div style={{ position: 'fixed', left: -9999, top: 0, pointerEvents: 'none' }}>
        <div ref={shareRef}>
          <ShareCardCanvas
            score={result.score}
            status={result.status}
            decision={result.decision}
            split={result.training_split}
            date={today}
          />
        </div>
      </div>

      {/* Share modal */}
      {showShare && (
        <ShareButtons
          score={result.score}
          status={result.status}
          decision={result.decision}
          imageDataUrl={imageDataUrl}
          onClose={() => setShowShare(false)}
        />
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
        <Button variant="ghost" onClick={onBack} className="mb-2">← Back to check-in</Button>

        {/* Ring */}
        <div className="flex justify-center">
          <ReadinessRing score={result.score} status={result.status} size={200} />
        </div>

        {/* Status Badge */}
        <div className="text-center">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
            result.status === 'Green'  ? 'bg-status-green-dim text-status-green' :
            result.status === 'Yellow' ? 'bg-status-yellow-dim text-status-yellow' :
            'bg-status-red-dim text-status-red'
          }`}>
            ● {result.status} — {result.decision}
          </div>
        </div>

        {/* Share button — prominent */}
        <Button
          onClick={handleShare}
          disabled={generating}
          className="w-full"
          variant="outline"
          style={{ borderColor: 'rgba(108,99,255,0.4)', color: 'hsl(245 100% 72%)' }}
        >
          {generating ? '⏳ Generating...' : '📤 Share my score'}
        </Button>

        {/* Decision Panel */}
        <div className="bg-card rounded-xl p-5 card-shadow space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><span className="text-label block">{t('decision')}</span><div className="font-semibold text-sm mt-0.5">{result.decision}</div></div>
            <div><span className="text-label block">{t('todays_split')}</span><div className="font-semibold text-sm mt-0.5">{result.training_split}</div></div>
            <div><span className="text-label block">{t('intensity')}</span><div className="font-semibold text-sm mt-0.5">{result.intensity_note}</div></div>
            <div><span className="text-muted-foreground">Cardio</span><div className="font-semibold">{result.cardio_zone}</div></div>
          </div>

          {result.skip_reasons.length > 0 && (
            <div className="border-t border-border pt-3">
              <div className="text-sm text-muted-foreground">⚠️ Skip today:</div>
              {result.skip_reasons.map((r, i) => (
                <div key={i} className="text-sm ml-4">• {r}</div>
              ))}
            </div>
          )}

          <div className="border-t border-border pt-3">
            <div className="text-sm text-muted-foreground mb-1">💬 {t('coach_says')}:</div>
            <p className="text-sm italic leading-relaxed">"{coachMessage}"</p>
          </div>
        </div>

        {/* Score Breakdown */}
        <details className="bg-card rounded-xl p-5 card-shadow">
          <summary className="font-semibold cursor-pointer">{t('score_breakdown')}</summary>
          <div className="mt-4 space-y-3">
            {breakdownItems.map(item => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground w-28">{item.label}</span>
                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${item.score >= 75 ? 'bg-status-green' : item.score >= 50 ? 'bg-status-yellow' : 'bg-status-red'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${item.score}%` }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  />
                </div>
                <span className="text-sm font-mono w-8 text-right">{item.score}</span>
              </div>
            ))}
            <div className="border-t border-border pt-2 flex justify-between font-semibold">
              <span>Weighted Total</span>
              <span className="font-mono">{result.score} / 100</span>
            </div>
          </div>
        </details>

        {/* Next Steps */}
        <div className="bg-secondary/40 rounded-xl p-4 space-y-2.5">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">What to do next</p>
          {result.status !== 'Red' ? (
            <>
              <button onClick={() => navigate('/workout')}
                className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-all active:scale-[0.98] glow-lime-btn"
                style={{ background: 'hsl(77 100% 58%)', color: 'hsl(240 60% 3%)' }}>
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0" style={{ background: 'rgba(0,0,0,0.15)' }}>1</span>
                <div className="flex-1">
                  <div className="text-sm font-bold">See today's workout plan</div>
                  <div className="text-[11px] opacity-60">{result.training_split}</div>
                </div>
                <span className="opacity-50">→</span>
              </button>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { step: 2, label: 'Log sets',  sub: 'Track reps',   path: '/log'  },
                  { step: 3, label: 'Log meals', sub: 'Track macros', path: '/meal' },
                ].map(s => (
                  <button key={s.step} onClick={() => navigate(s.path)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-card border border-border hover:border-primary/40 transition-all active:scale-[0.98]">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 bg-primary/15 text-primary">{s.step}</span>
                    <div>
                      <div className="text-xs font-semibold">{s.label}</div>
                      <div className="text-[10px] text-muted-foreground">{s.sub}</div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="space-y-2">
              {[
                { step: 1, label: 'Recovery exercises', sub: 'Mobility & stretching',    path: '/workout', lime: true  },
                { step: 2, label: 'Log meals',          sub: 'Nutrition supports recovery', path: '/meal', lime: false },
              ].map(s => (
                <button key={s.step} onClick={() => navigate(s.path)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all active:scale-[0.98] ${s.lime ? '' : 'bg-card border border-border'}`}
                  style={s.lime ? { background: 'hsl(77 100% 58%)', color: 'hsl(240 60% 3%)' } : {}}>
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                    style={{ background: s.lime ? 'rgba(0,0,0,0.15)' : 'hsl(245 100% 70% / 0.15)', color: s.lime ? 'inherit' : 'hsl(245 100% 70%)' }}>{s.step}</span>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{s.label}</div>
                    <div className={`text-[10px] ${s.lime ? 'opacity-60' : 'text-muted-foreground'}`}>{s.sub}</div>
                  </div>
                  <span className="opacity-40">→</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
};

export default ResultCard;
