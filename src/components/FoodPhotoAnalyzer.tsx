import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n';
import { toast } from 'sonner';

/* ─────────────────────────────────────────────────────────────────
   FoodPhotoAnalyzer
   Props:
     slot       — meal slot to log into ('breakfast' | 'lunch' | ...)
     onConfirm  — called with macro result when user confirms
     onClose    — close the analyzer
───────────────────────────────────────────────────────────────── */

export interface FoodMacros {
  meal_name: string;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  confidence: 'high' | 'medium' | 'low';
  notes: string;
}

interface Props {
  slot: string;
  onConfirm: (macros: FoodMacros) => void;
  onClose: () => void;
}

const CONFIDENCE_COLOR = {
  high:   'hsl(77 100% 58%)',
  medium: 'hsl(38 88% 58%)',
  low:    'hsl(2 84% 60%)',
};

const CONFIDENCE_LABEL = {
  high:   'High accuracy',
  medium: 'Moderate accuracy',
  low:    'Low accuracy — add ingredients for better results',
};

const FoodPhotoAnalyzer = ({ slot, onConfirm, onClose }: Props) => {
  const { lang } = useLanguage();

  // Steps: 'input' → 'analyzing' → 'result'
  const [step, setStep]             = useState<'input' | 'analyzing' | 'result'>('input');
  const [mealName, setMealName]     = useState('');
  const [ingredients, setIngredients] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64]   = useState<string | null>(null);
  const [imageMime, setImageMime]       = useState<string>('image/jpeg');
  const [result, setResult]         = useState<FoodMacros | null>(null);

  // Editable macros after AI result
  const [editKcal, setEditKcal]     = useState('');
  const [editProtein, setEditProtein] = useState('');
  const [editCarbs, setEditCarbs]   = useState('');
  const [editFat, setEditFat]       = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Resize image to max 800px and compress to ~50KB before encoding
  const resizeImage = useCallback((dataUrl: string, mime: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 800;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round((height * MAX) / width); width = MAX; }
          else { width = Math.round((width * MAX) / height); height = MAX; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);
        // Compress to JPEG quality 0.75 — typically 30–80KB
        const resized = canvas.toDataURL('image/jpeg', 0.75);
        resolve(resized.split(',')[1]); // return base64 only
      };
      img.src = dataUrl;
    });
  }, []);

  const handleImageSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageMime('image/jpeg'); // always output JPEG after resize

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      setImagePreview(dataUrl);
      // Resize + compress before storing base64
      const resizedBase64 = await resizeImage(dataUrl, file.type);
      setImageBase64(resizedBase64);
    };
    reader.readAsDataURL(file);
  }, [resizeImage]);

  const handleAnalyze = async () => {
    if (!mealName.trim()) {
      toast.error('Please enter a meal name first');
      return;
    }
    setStep('analyzing');
    try {
      const { data, error } = await supabase.functions.invoke('food-analyzer', {
        body: {
          meal_name:    mealName.trim(),
          ingredients:  ingredients.trim() || null,
          image_base64: imageBase64 || null,
          image_mime:   imageBase64 ? imageMime : null,
          lang,
        },
      });

      if (error || data?.error) throw new Error(error?.message || data?.error);

      const macros: FoodMacros = {
        meal_name:  mealName.trim(),
        kcal:       Math.round(data.kcal),
        protein_g:  Math.round(data.protein_g),
        carbs_g:    Math.round(data.carbs_g),
        fat_g:      Math.round(data.fat_g),
        confidence: data.confidence || 'medium',
        notes:      data.notes || '',
      };
      setResult(macros);
      setEditKcal(String(macros.kcal));
      setEditProtein(String(macros.protein_g));
      setEditCarbs(String(macros.carbs_g));
      setEditFat(String(macros.fat_g));
      setStep('result');
    } catch (err: any) {
      console.error('food-analyzer error:', err);
      toast.error('Analysis failed — try again or enter manually');
      setStep('input');
    }
  };

  const handleConfirm = () => {
    if (!result) return;
    onConfirm({
      ...result,
      kcal:      parseInt(editKcal)   || result.kcal,
      protein_g: parseInt(editProtein) || result.protein_g,
      carbs_g:   parseInt(editCarbs)  || result.carbs_g,
      fat_g:     parseInt(editFat)    || result.fat_g,
    });
  };

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 100, backdropFilter: 'blur(4px)' }}
      />

      {/* Sheet */}
      <motion.div
        initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 101,
          maxWidth: 520, margin: '0 auto',
          background: '#0d0d1f',
          border: '1px solid #16162a',
          borderRadius: '20px 20px 0 0',
          maxHeight: '92dvh',
          overflowY: 'auto',
          paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: '#16162a' }} />
        </div>

        <div style={{ padding: '8px 20px 0' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <p style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#404070', marginBottom: 2 }}>
                📷 SCAN FOOD · {slot.toUpperCase()}
              </p>
              <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 22, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                AI CALORIE ANALYZER
              </h2>
            </div>
            <button onClick={onClose}
              style={{ width: 30, height: 30, borderRadius: '50%', background: '#111125', border: '1px solid #16162a', color: '#404070', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ×
            </button>
          </div>

          {/* ── STEP: INPUT ── */}
          {step === 'input' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Image upload */}
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '1.5px dashed #16162a',
                  borderRadius: 14,
                  padding: imagePreview ? 0 : '20px 16px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  minHeight: imagePreview ? 180 : 'auto',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: '#07070f',
                  transition: 'border-color 0.15s',
                }}
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="food preview"
                    style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 12 }} />
                ) : (
                  <div>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>📸</div>
                    <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: '#404070' }}>Tap to take photo or choose from gallery</p>
                    <p style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, color: '#2a2a50', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 4 }}>Optional — improves accuracy</p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageSelect}
                style={{ display: 'none' }}
              />

              {imagePreview && (
                <button onClick={() => { setImagePreview(null); setImageBase64(null); }}
                  style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: '#404070', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                  × Remove photo
                </button>
              )}

              {/* Meal name — required */}
              <div>
                <label style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#404070', display: 'block', marginBottom: 6 }}>
                  Meal name <span style={{ color: 'hsl(2 84% 60%)' }}>*</span>
                </label>
                <input
                  type="text"
                  value={mealName}
                  onChange={e => setMealName(e.target.value)}
                  placeholder={lang === 'th' ? 'เช่น ผัดกะเพราหมู, ข้าวมันไก่' : 'e.g. Chicken breast with rice, Caesar salad'}
                  style={{
                    width: '100%', padding: '10px 14px',
                    background: '#07070f', border: '1px solid #16162a',
                    borderRadius: 10, color: '#e0e0ff',
                    fontFamily: "'DM Sans',sans-serif", fontSize: 14,
                    outline: 'none',
                  }}
                />
              </div>

              {/* Ingredients — optional */}
              <div>
                <label style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#404070', display: 'block', marginBottom: 6 }}>
                  Ingredients / portion notes
                  <span style={{ color: '#2a2a50', marginLeft: 6, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>optional — improves accuracy</span>
                </label>
                <textarea
                  value={ingredients}
                  onChange={e => setIngredients(e.target.value)}
                  placeholder={lang === 'th' ? 'เช่น หมูสับ 100g, ไข่ 1 ฟอง, ข้าว 1 ทัพพี' : 'e.g. 150g chicken, 1 cup rice, 2 tbsp olive oil'}
                  rows={2}
                  style={{
                    width: '100%', padding: '10px 14px',
                    background: '#07070f', border: '1px solid #16162a',
                    borderRadius: 10, color: '#e0e0ff',
                    fontFamily: "'DM Sans',sans-serif", fontSize: 13,
                    outline: 'none', resize: 'none',
                  }}
                />
              </div>

              {/* Accuracy hint */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[
                  { label: 'Name only', color: CONFIDENCE_COLOR.low },
                  { label: '+ Photo', color: CONFIDENCE_COLOR.medium },
                  { label: '+ Ingredients', color: CONFIDENCE_COLOR.high },
                ].map(h => (
                  <span key={h.label} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 600, letterSpacing: '0.04em', background: `${h.color}18`, color: h.color, border: `1px solid ${h.color}40` }}>
                    {h.label}
                  </span>
                ))}
                <span style={{ fontSize: 11, color: '#2a2a50', fontFamily: "'DM Sans',sans-serif", alignSelf: 'center' }}>= better accuracy</span>
              </div>

              <Button
                variant="accent"
                onClick={handleAnalyze}
                disabled={!mealName.trim()}
                className="w-full"
              >
                ⚡ Analyze with AI
              </Button>
            </div>
          )}

          {/* ── STEP: ANALYZING ── */}
          {step === 'analyzing' && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                style={{ width: 48, height: 48, margin: '0 auto 16px', borderRadius: '50%', border: '3px solid #16162a', borderTopColor: 'hsl(245 100% 70%)' }}
              />
              <p style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 16, color: '#8080c0', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Analyzing nutrition...
              </p>
              <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: '#2a2a50', marginTop: 6 }}>
                {imageBase64 ? 'Reading image + estimating portions' : 'Estimating from meal name'}
              </p>
            </div>
          )}

          {/* ── STEP: RESULT ── */}
          {step === 'result' && result && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Confidence badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontSize: 11, padding: '3px 10px', borderRadius: 20,
                  fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, letterSpacing: '0.06em',
                  background: `${CONFIDENCE_COLOR[result.confidence]}18`,
                  color: CONFIDENCE_COLOR[result.confidence],
                  border: `1px solid ${CONFIDENCE_COLOR[result.confidence]}40`,
                }}>
                  {result.confidence.toUpperCase()} CONFIDENCE
                </span>
                <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: '#404070' }}>
                  {CONFIDENCE_LABEL[result.confidence]}
                </span>
              </div>

              {/* Meal name */}
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 20, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                {result.meal_name}
              </div>

              {/* Editable macros */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { label: 'Calories', unit: 'kcal', value: editKcal, set: setEditKcal, color: 'hsl(245 100% 70%)' },
                  { label: 'Protein', unit: 'g', value: editProtein, set: setEditProtein, color: 'hsl(77 100% 58%)' },
                  { label: 'Carbs', unit: 'g', value: editCarbs, set: setEditCarbs, color: 'hsl(38 88% 58%)' },
                  { label: 'Fat', unit: 'g', value: editFat, set: setEditFat, color: 'hsl(2 84% 60%)' },
                ].map(({ label, unit, value, set, color }) => (
                  <div key={label} style={{ background: '#07070f', border: '1px solid #16162a', borderRadius: 12, padding: '10px 12px' }}>
                    <p style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#2a2a50', marginBottom: 6 }}>{label}</p>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                      <input
                        type="number"
                        value={value}
                        onChange={e => set(e.target.value)}
                        style={{
                          background: 'none', border: 'none', outline: 'none',
                          fontFamily: "'JetBrains Mono',monospace", fontWeight: 700,
                          fontSize: 22, color, width: '70%',
                        }}
                      />
                      <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, color: '#404070' }}>{unit}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* AI notes */}
              {result.notes && (
                <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: '#404070', lineHeight: 1.6, padding: '8px 12px', background: '#07070f', borderRadius: 8, borderLeft: '2px solid #16162a' }}>
                  {result.notes}
                </p>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => { setStep('input'); setResult(null); }}
                  style={{ flex: 1, padding: '13px', borderRadius: 12, border: '1px solid #16162a', background: '#07070f', color: '#404070', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}
                >
                  ← Re-scan
                </button>
                <Button variant="accent" className="flex-1" onClick={handleConfirm}>
                  ✓ Add to {slot}
                </Button>
              </div>
            </div>
          )}

        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FoodPhotoAnalyzer;
