import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { MealSlot } from '@/lib/types';

const SLOT_OPTIONS: { value: MealSlot; label: string }[] = [
  { value: 'breakfast',   label: '🌅 Breakfast' },
  { value: 'pre_workout', label: '🏋️ Pre-Workout' },
  { value: 'lunch',       label: '☀️ Lunch' },
  { value: 'dinner',      label: '🌙 Dinner' },
  { value: 'snack',       label: '🍎 Snack' },
];

interface CustomMealRow {
  id: string;
  name: string;
  meal_slot: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface Props {
  onAdded: () => void;
}

type View = 'list' | 'add';

const AddCustomMealDialog = ({ onAdded }: Props) => {
  const [open, setOpen]       = useState(false);
  const [view, setView]       = useState<View>('list');
  const [saving, setSaving]   = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [meals, setMeals]     = useState<CustomMealRow[]>([]);
  const [loadingMeals, setLoadingMeals] = useState(false);

  // Add form state
  const [name, setName]       = useState('');
  const [slot, setSlot]       = useState<MealSlot>('lunch');
  const [kcal, setKcal]       = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs]     = useState('');
  const [fat, setFat]         = useState('');

  const resetForm = () => {
    setName(''); setSlot('lunch');
    setKcal(''); setProtein(''); setCarbs(''); setFat('');
  };

  // Load custom meals when dialog opens
  useEffect(() => {
    if (!open) return;
    loadMeals();
  }, [open]);

  const loadMeals = async () => {
    setLoadingMeals(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('custom_meals')
        .select('id, name, meal_slot, kcal, protein, carbs, fat')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setMeals((data as CustomMealRow[]) || []);
    } catch (err) {
      console.error('Failed to load custom meals:', err);
    } finally {
      setLoadingMeals(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error('กรุณาใส่ชื่อเมนู'); return; }

    // Limit: max 50 custom meals per user
    if (meals.length >= 50) {
      toast.error('มีเมนูเยอะสุดแล้ว (50 รายการ) กรุณาลบเมนูเก่าก่อน');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error('กรุณาเข้าสู่ระบบ'); return; }

    setSaving(true);
    const { error } = await supabase.from('custom_meals').insert({
      user_id: user.id,
      name: name.trim(),
      meal_slot: slot,
      kcal: Number(kcal) || 0,
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fat: Number(fat) || 0,
    });
    setSaving(false);

    if (error) { toast.error(error.message); return; }

    toast.success('เพิ่มเมนูสำเร็จ! 🎉');
    resetForm();
    await loadMeals();
    setView('list');
    onAdded();
  };

  const handleDelete = async (id: string, mealName: string) => {
    if (!confirm(`ลบ "${mealName}" ออกจากเมนูของคุณ?`)) return;
    setDeleting(id);
    try {
      const { error } = await supabase.from('custom_meals').delete().eq('id', id);
      if (error) throw error;
      setMeals(prev => prev.filter(m => m.id !== id));
      toast.success('ลบเมนูแล้ว');
      onAdded(); // reload Meal page
    } catch (err: any) {
      toast.error(err.message || 'ลบไม่สำเร็จ');
    } finally {
      setDeleting(null);
    }
  };

  const slotLabel = (s: string) => SLOT_OPTIONS.find(o => o.value === s)?.label || s;

  // Group meals by slot for display
  const grouped = SLOT_OPTIONS.map(opt => ({
    slot: opt,
    items: meals.filter(m => m.meal_slot === opt.value),
  })).filter(g => g.items.length > 0);

  return (
    <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) { setView('list'); resetForm(); } }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs gap-1">
          ➕ เพิ่มเมนูเอง
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-sm max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle>
              {view === 'list' ? 'เมนูของฉัน' : 'เพิ่มเมนูใหม่'}
            </DialogTitle>
            {view === 'list' ? (
              <Button
                variant="outline" size="sm"
                className="text-xs h-7"
                onClick={() => setView('add')}
              >
                + เพิ่ม
              </Button>
            ) : (
              <Button
                variant="ghost" size="sm"
                className="text-xs h-7"
                onClick={() => { setView('list'); resetForm(); }}
              >
                ← กลับ
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* LIST VIEW */}
        {view === 'list' && (
          <div className="flex-1 overflow-y-auto -mx-1 px-1">
            {loadingMeals ? (
              <div className="py-8 text-center">
                <div className="h-4 bg-muted rounded animate-pulse w-32 mx-auto mb-2" />
                <div className="h-4 bg-muted rounded animate-pulse w-24 mx-auto" />
              </div>
            ) : meals.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <div className="text-3xl">🍽️</div>
                <p className="text-sm text-muted-foreground">ยังไม่มีเมนูของคุณ</p>
                <Button
                  variant="accent" size="sm"
                  onClick={() => setView('add')}
                >
                  + เพิ่มเมนูแรก
                </Button>
              </div>
            ) : (
              <div className="space-y-4 py-1">
                {/* Meal count */}
                <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                  <span>ทั้งหมด {meals.length} รายการ</span>
                  <span className={meals.length >= 40 ? 'text-status-yellow' : ''}>
                    {meals.length >= 50 ? '⚠️ เต็มแล้ว' : `เหลือพื้นที่ ${50 - meals.length} รายการ`}
                  </span>
                </div>

                {grouped.map(({ slot: slotOpt, items }) => (
                  <div key={slotOpt.value}>
                    <div className="text-xs font-medium text-muted-foreground mb-2 px-1">
                      {slotOpt.label}
                    </div>
                    <div className="space-y-1">
                      {items.map(meal => (
                        <div
                          key={meal.id}
                          className="flex items-center justify-between bg-secondary rounded-lg px-3 py-2.5"
                        >
                          <div className="flex-1 min-w-0 mr-2">
                            <div className="text-sm font-medium truncate">{meal.name}</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">
                              {meal.kcal} kcal · P:{meal.protein}g · C:{meal.carbs}g · F:{meal.fat}g
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive flex-shrink-0"
                            onClick={() => handleDelete(meal.id, meal.name)}
                            disabled={deleting === meal.id}
                          >
                            {deleting === meal.id ? (
                              <span className="text-xs">...</span>
                            ) : (
                              <span className="text-sm">🗑</span>
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ADD VIEW */}
        {view === 'add' && (
          <div className="flex-1 overflow-y-auto space-y-3 py-1">
            <div>
              <Label>ชื่อเมนู</Label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="เช่น สลัดอกไก่"
                className="mt-1"
              />
            </div>
            <div>
              <Label>มื้อ</Label>
              <Select value={slot} onValueChange={v => setSlot(v as MealSlot)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SLOT_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Calories (kcal)</Label>
                <Input type="number" inputMode="numeric" min="0" value={kcal}
                  onChange={e => setKcal(e.target.value)} placeholder="0" className="mt-1" />
              </div>
              <div>
                <Label>Protein (g)</Label>
                <Input type="number" inputMode="numeric" min="0" value={protein}
                  onChange={e => setProtein(e.target.value)} placeholder="0" className="mt-1" />
              </div>
              <div>
                <Label>Carbs (g)</Label>
                <Input type="number" inputMode="numeric" min="0" value={carbs}
                  onChange={e => setCarbs(e.target.value)} placeholder="0" className="mt-1" />
              </div>
              <div>
                <Label>Fat (g)</Label>
                <Input type="number" inputMode="numeric" min="0" value={fat}
                  onChange={e => setFat(e.target.value)} placeholder="0" className="mt-1" />
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? 'กำลังบันทึก...' : 'บันทึกเมนู'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddCustomMealDialog;
