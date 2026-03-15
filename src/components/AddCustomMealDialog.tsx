import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { MealSlot } from '@/lib/types';

const SLOT_OPTIONS: { value: MealSlot; label: string }[] = [
  { value: 'breakfast', label: '🌅 Breakfast' },
  { value: 'pre_workout', label: '🏋️ Pre-Workout' },
  { value: 'lunch', label: '☀️ Lunch' },
  { value: 'dinner', label: '🌙 Dinner' },
  { value: 'snack', label: '🍎 Snack' },
];

interface Props {
  onAdded: () => void;
}

const AddCustomMealDialog = ({ onAdded }: Props) => {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [slot, setSlot] = useState<MealSlot>('lunch');
  const [kcal, setKcal] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');

  const reset = () => {
    setName(''); setSlot('lunch'); setKcal(''); setProtein(''); setCarbs(''); setFat('');
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error('กรุณาใส่ชื่อเมนู'); return; }

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
    reset();
    setOpen(false);
    onAdded();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs gap-1">
          ➕ เพิ่มเมนูเอง
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>เพิ่มเมนูอาหารเอง</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>ชื่อเมนู</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="เช่น สลัดอกไก่" />
          </div>
          <div>
            <Label>มื้อ</Label>
            <Select value={slot} onValueChange={v => setSlot(v as MealSlot)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
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
              <Input type="number" min="0" value={kcal} onChange={e => setKcal(e.target.value)} placeholder="0" />
            </div>
            <div>
              <Label>Protein (g)</Label>
              <Input type="number" min="0" value={protein} onChange={e => setProtein(e.target.value)} placeholder="0" />
            </div>
            <div>
              <Label>Carbs (g)</Label>
              <Input type="number" min="0" value={carbs} onChange={e => setCarbs(e.target.value)} placeholder="0" />
            </div>
            <div>
              <Label>Fat (g)</Label>
              <Input type="number" min="0" value={fat} onChange={e => setFat(e.target.value)} placeholder="0" />
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? 'กำลังบันทึก...' : 'บันทึกเมนู'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddCustomMealDialog;
