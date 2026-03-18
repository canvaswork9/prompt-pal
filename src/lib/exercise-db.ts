import type { Exercise } from './types';

export const EXERCISE_DB: Exercise[] = [
  // LOWER BODY
  { key: 'squat_barbell', name_en: 'Barbell Back Squat', name_th: 'สควอทบาร์เบล', muscles: 'Quads, Glutes, Core', split: 'lower', type: 'compound', green_sets: '4×5–6', yellow_sets: '3×10–12', min_level: 'intermediate', avoid_when: 'lower', form_tips_th: ['ก้นลงต่ำกว่าหัวเข่า', 'หัวเข่าชี้ทิศทางเดียวกับนิ้วเท้า', 'หลังตรง แน่น core ตลอด'], form_tips_en: ['Hip crease below knee', 'Knees track over toes', 'Keep back straight, brace core'] },
  { key: 'rdl', name_en: 'Romanian Deadlift', name_th: 'RDL', muscles: 'Hamstrings, Glutes', split: 'lower', type: 'compound', green_sets: '4×8–10', yellow_sets: '3×12–15', min_level: 'intermediate', avoid_when: 'lower', form_tips_th: ['ดันก้นไปข้างหลัง', 'รู้สึกยืดที่หลังขา', 'หลังตรงตลอด'], form_tips_en: ['Push hips back', 'Feel the stretch in hamstrings', 'Keep back flat'] },
  { key: 'leg_press', name_en: 'Leg Press', name_th: 'เลกเพรส', muscles: 'Quads, Glutes', split: 'lower', type: 'compound', green_sets: '3×10–12', yellow_sets: '3×15–20', min_level: 'beginner', form_tips_th: ['วางเท้ากว้างเท่าไหล่', 'ไม่ล็อคเข่า'], form_tips_en: ['Feet shoulder width', 'Don\'t lock knees'] },
  { key: 'hip_thrust', name_en: 'Hip Thrust', name_th: 'ฮิปทรัสต์', muscles: 'Glutes', split: 'lower', type: 'compound', green_sets: '3×10–12', yellow_sets: '3×15–20', min_level: 'beginner', form_tips_th: ['บีบก้นด้านบน', 'หลังส่วนบนพิงม้านั่ง'], form_tips_en: ['Squeeze glutes at top', 'Upper back on bench'] },
  { key: 'goblet_squat', name_en: 'Goblet Squat', name_th: 'กอบเล็ตสควอท', muscles: 'Quads, Glutes', split: 'lower', type: 'compound', green_sets: '3×12–15', yellow_sets: '3×15', min_level: 'beginner', form_tips_th: ['ถือดัมเบลชิดอก', 'ลงลึกที่สุดเท่าที่ทำได้'], form_tips_en: ['Hold dumbbell at chest', 'Go as deep as possible'] },
  { key: 'leg_curl_lying', name_en: 'Lying Leg Curl', name_th: 'เลกเคิร์ลนอน', muscles: 'Hamstrings', split: 'lower', type: 'isolation', green_sets: '3×10–12', yellow_sets: '3×15', min_level: 'beginner', form_tips_th: ['ควบคุมตลอดการเคลื่อนไหว'], form_tips_en: ['Control through full ROM'] },
  { key: 'calf_standing', name_en: 'Standing Calf Raise', name_th: 'ยืนยกน่อง', muscles: 'Gastrocnemius', split: 'lower', type: 'isolation', green_sets: '4×15–20', yellow_sets: '3×20', min_level: 'beginner', form_tips_th: ['ยืดเต็มที่ด้านล่าง', 'หยุดค้างด้านบน 2 วิ'], form_tips_en: ['Full stretch at bottom', 'Pause at top for 2s'] },
  // NEW LOWER
  { key: 'bulgarian', name_en: 'Bulgarian Split Squat', name_th: 'บัลแกเรียนสควอท', muscles: 'Quads, Glutes', split: 'lower', type: 'compound', green_sets: '3×8–10ea', yellow_sets: '3×12ea', min_level: 'intermediate', avoid_when: 'lower', form_tips_th: ['เท้าหลังวางบนม้านั่ง', 'ลงตรงๆ ไม่เอนไปข้างหน้า', 'เข่าหน้าไม่เกินนิ้วเท้า'], form_tips_en: ['Rear foot on bench', 'Drop straight down', 'Front knee behind toes'] },
  { key: 'nordic_curl', name_en: 'Nordic Curl', name_th: 'นอร์ดิกเคิร์ล', muscles: 'Hamstrings (eccentric)', split: 'lower', type: 'compound', green_sets: '3×5–8', yellow_sets: 'Skip', min_level: 'advanced', avoid_when: 'lower', form_tips_th: ['ให้ขาลงช้าๆ 4 วินาที', 'ใช้มือรับตัวเมื่อใกล้พื้น'], form_tips_en: ['Lower slowly 4 seconds', 'Catch yourself at bottom'] },
  { key: 'calf_seated', name_en: 'Seated Calf Raise', name_th: 'นั่งยกน่อง', muscles: 'Soleus', split: 'lower', type: 'isolation', green_sets: '3×15–20', yellow_sets: '3×20', min_level: 'beginner', form_tips_th: ['เน้น soleus ส่วนล่าง', 'หยุดค้างด้านบน'], form_tips_en: ['Targets deeper soleus', 'Pause at top'] },

  // UPPER — CHEST
  { key: 'bench_barbell', name_en: 'Barbell Bench Press', name_th: 'เบนช์เพรสบาร์เบล', muscles: 'Chest, Front Delt, Triceps', split: 'upper_chest', type: 'compound', green_sets: '4×5–6', yellow_sets: '3×10–12', min_level: 'intermediate', avoid_when: 'upper', form_tips_th: ['หลังโค้งเล็กน้อย', 'จับกว้างกว่าไหล่', 'ลดลงถึงอก'], form_tips_en: ['Slight arch in back', 'Grip wider than shoulders', 'Touch chest'] },
  { key: 'bench_incline_db', name_en: 'Incline DB Press', name_th: 'อินไคลน์ดัมเบลเพรส', muscles: 'Upper Chest', split: 'upper_chest', type: 'compound', green_sets: '3×8–10', yellow_sets: '3×12–15', min_level: 'beginner', form_tips_th: ['ม้านั่งเอียง 30-45 องศา'], form_tips_en: ['Bench at 30-45 degree angle'] },
  { key: 'db_fly', name_en: 'Dumbbell Fly', name_th: 'ดัมเบลฟลาย', muscles: 'Chest', split: 'upper_chest', type: 'isolation', green_sets: '3×12–15', yellow_sets: '2×15', min_level: 'beginner', form_tips_th: ['งอศอกเล็กน้อย', 'รู้สึกยืดที่อก'], form_tips_en: ['Slight bend in elbows', 'Feel stretch in chest'] },
  { key: 'pushup', name_en: 'Push-up', name_th: 'วิดพื้น', muscles: 'Chest, Triceps, Core', split: 'upper_chest', type: 'compound', green_sets: '3×AMRAP', yellow_sets: '3×15', min_level: 'beginner', form_tips_th: ['ลำตัวตรง', 'ลงจนอกเกือบถึงพื้น'], form_tips_en: ['Keep body straight', 'Lower until chest nearly touches'] },

  // UPPER — BACK
  { key: 'pullup', name_en: 'Pull-up', name_th: 'ดึงข้อ', muscles: 'Lats, Biceps', split: 'upper_back', type: 'compound', green_sets: '4×6–8', yellow_sets: '3×AMRAP', min_level: 'intermediate', avoid_when: 'upper', form_tips_th: ['ดึงจนคางผ่านบาร์', 'ควบคุมขาลง'], form_tips_en: ['Pull until chin over bar', 'Control the descent'] },
  { key: 'lat_pulldown', name_en: 'Lat Pulldown', name_th: 'แลทพูลดาวน์', muscles: 'Lats', split: 'upper_back', type: 'compound', green_sets: '4×8–10', yellow_sets: '3×12–15', min_level: 'beginner', form_tips_th: ['ดึงลงถึงอก', 'เอนหลังเล็กน้อย'], form_tips_en: ['Pull to chest', 'Slight lean back'] },
  { key: 'bb_row', name_en: 'Barbell Row', name_th: 'โรว์บาร์เบล', muscles: 'Mid Back, Lats', split: 'upper_back', type: 'compound', green_sets: '4×6–8', yellow_sets: '3×10–12', min_level: 'intermediate', avoid_when: 'upper', form_tips_th: ['ลำตัวเอียง 45 องศา', 'ดึงเข้าท้อง'], form_tips_en: ['Torso at 45 degrees', 'Pull to belly'] },
  { key: 'face_pull', name_en: 'Face Pull', name_th: 'เฟซพูล', muscles: 'Rear Delt, Rotator Cuff', split: 'upper_back', type: 'isolation', green_sets: '3×15–20', yellow_sets: '3×20', min_level: 'beginner', form_tips_th: ['ดึงมาที่หน้า', 'กางศอกออก'], form_tips_en: ['Pull to face level', 'Flare elbows out'] },
  // NEW BACK
  { key: 'db_row', name_en: 'Dumbbell Row', name_th: 'ดัมเบลโรว์', muscles: 'Lats, Rhomboids', split: 'upper_back', type: 'compound', green_sets: '3×10–12ea', yellow_sets: '3×12–15ea', min_level: 'beginner', avoid_when: 'upper', form_tips_th: ['วางเข่าและมือบนม้านั่ง', 'ดึงข้อศอกขึ้นท้องฟ้า'], form_tips_en: ['Support knee and hand on bench', 'Drive elbow toward ceiling'] },
  { key: 'cable_row', name_en: 'Seated Cable Row', name_th: 'เคเบิลโรว์นั่ง', muscles: 'Mid Back', split: 'upper_back', type: 'compound', green_sets: '3×10–12', yellow_sets: '3×12–15', min_level: 'beginner', avoid_when: 'upper', form_tips_th: ['บีบหัวไหล่เข้าหากัน', 'หลังตรงตลอด'], form_tips_en: ['Squeeze shoulder blades', 'Keep back straight'] },

  // UPPER — SHOULDERS
  { key: 'ohp_barbell', name_en: 'Barbell OHP', name_th: 'โอเวอร์เฮดเพรส', muscles: 'Front+Side Delt', split: 'upper_shoulders', type: 'compound', green_sets: '4×6–8', yellow_sets: '3×10–12', min_level: 'intermediate', avoid_when: 'upper', form_tips_th: ['ดันขึ้นตรง', 'แน่น core'], form_tips_en: ['Press straight up', 'Brace core'] },
  { key: 'lateral_raise', name_en: 'Lateral Raise', name_th: 'ยกข้าง', muscles: 'Side Delt', split: 'upper_shoulders', type: 'isolation', green_sets: '3×12–15', yellow_sets: '3×15–20', min_level: 'beginner', form_tips_th: ['ยกถึงระดับไหล่', 'ค่อยๆ ลด'], form_tips_en: ['Raise to shoulder level', 'Lower slowly'] },
  // NEW SHOULDERS
  { key: 'rear_delt_fly', name_en: 'Rear Delt Fly', name_th: 'เรียร์เดลต์ฟลาย', muscles: 'Rear Delt', split: 'upper_shoulders', type: 'isolation', green_sets: '3×15–20', yellow_sets: '3×20', min_level: 'beginner', avoid_when: 'upper', form_tips_th: ['โน้มตัวไปข้างหน้า', 'ยกแขนออกด้านข้าง', 'ไม่ใช้แรงสะบัด'], form_tips_en: ['Hinge forward', 'Raise arms to sides', 'No momentum'] },
  { key: 'ohp_db', name_en: 'DB Shoulder Press', name_th: 'ดัมเบลโอเวอร์เฮด', muscles: 'Front+Side Delt', split: 'upper_shoulders', type: 'compound', green_sets: '4×8–10', yellow_sets: '3×12', min_level: 'beginner', avoid_when: 'upper', form_tips_th: ['หลังพิงพนักเก้าอี้', 'ดันขึ้นตรง'], form_tips_en: ['Seat with back support', 'Press straight up'] },

  // UPPER — ARMS
  { key: 'bb_curl', name_en: 'Barbell Curl', name_th: 'บาร์เบลเคิร์ล', muscles: 'Biceps', split: 'upper_arms', type: 'isolation', green_sets: '3×8–10', yellow_sets: '2×12', min_level: 'beginner', form_tips_th: ['ศอกชิดลำตัว', 'ไม่แกว่งตัว'], form_tips_en: ['Elbows close to body', 'No swinging'] },
  { key: 'pushdown', name_en: 'Tricep Pushdown', name_th: 'พุชดาวน์', muscles: 'Triceps', split: 'upper_arms', type: 'isolation', green_sets: '3×12–15', yellow_sets: '2×15–20', min_level: 'beginner', form_tips_th: ['ศอกชิดลำตัว', 'กดลงจนแขนตรง'], form_tips_en: ['Elbows pinned', 'Push down until arms straight'] },
  // NEW ARMS
  { key: 'hammer_curl', name_en: 'Hammer Curl', name_th: 'แฮมเมอร์เคิร์ล', muscles: 'Brachialis, Biceps', split: 'upper_arms', type: 'isolation', green_sets: '3×10–12', yellow_sets: '2×12', min_level: 'beginner', form_tips_th: ['หัวแม่มือชี้ขึ้น', 'ศอกชิดลำตัว'], form_tips_en: ['Thumbs up grip', 'Elbows pinned'] },
  { key: 'skull_crusher', name_en: 'Skull Crusher', name_th: 'สกัลครัชเชอร์', muscles: 'Triceps (long head)', split: 'upper_arms', type: 'isolation', green_sets: '3×10–12', yellow_sets: 'Skip', min_level: 'intermediate', form_tips_th: ['ข้อศอกชี้ขึ้น', 'ลดลงข้างหัว ไม่ใช่หน้าผาก'], form_tips_en: ['Elbows pointing up', 'Lower beside head not forehead'] },

  // FULL BODY
  { key: 'squat_goblet_fb', name_en: 'Goblet Squat', name_th: 'กอบเล็ตสควอท (ฟูลบอดี้)', muscles: 'Quads, Glutes', split: 'full_body', type: 'compound', green_sets: '3×12', yellow_sets: '3×15', min_level: 'beginner', form_tips_th: ['ถือดัมเบลชิดอก', 'ลงลึก'], form_tips_en: ['Hold dumbbell at chest', 'Deep squat'] },
  { key: 'pushup_fb', name_en: 'Push-up', name_th: 'วิดพื้น (ฟูลบอดี้)', muscles: 'Chest, Triceps', split: 'full_body', type: 'compound', green_sets: '3×AMRAP', yellow_sets: '3×10', min_level: 'beginner', form_tips_th: ['ลำตัวตรง'], form_tips_en: ['Keep body straight'] },
  { key: 'db_row_fb', name_en: 'DB Row (Full Body)', name_th: 'ดัมเบลโรว์ (ฟูลบอดี้)', muscles: 'Back, Biceps', split: 'full_body', type: 'compound', green_sets: '3×10ea', yellow_sets: '3×12ea', min_level: 'beginner', form_tips_th: ['หลังตรง', 'ดึงเข้าท้อง'], form_tips_en: ['Flat back', 'Pull to hip'] },
  { key: 'hip_thrust_fb', name_en: 'Hip Thrust (Full Body)', name_th: 'ฮิปทรัสต์ (ฟูลบอดี้)', muscles: 'Glutes', split: 'full_body', type: 'compound', green_sets: '3×12', yellow_sets: '3×15', min_level: 'beginner', form_tips_th: ['บีบก้นด้านบน'], form_tips_en: ['Squeeze glutes at top'] },
  { key: 'ohp_db_fb', name_en: 'DB Shoulder Press (Full Body)', name_th: 'ดัมเบลเพรส (ฟูลบอดี้)', muscles: 'Shoulders', split: 'full_body', type: 'compound', green_sets: '3×10', yellow_sets: '3×12', min_level: 'beginner', form_tips_th: ['ดันขึ้นตรง'], form_tips_en: ['Press straight overhead'] },
];

export const MEAL_DB = {
  breakfast: [
    { name_th: 'ไข่ต้ม + ข้าวกล้อง + ผัก', name_en: 'Boiled eggs + brown rice + veggies', kcal: 420, protein: 30, carbs: 45, fat: 12 },
    { name_th: 'กล้วยปั่นโปรตีน', name_en: 'Protein banana smoothie', kcal: 350, protein: 28, carbs: 42, fat: 8 },
    { name_th: 'ข้าวโอ๊ต + ผลไม้ + นม', name_en: 'Oatmeal + fruits + milk', kcal: 380, protein: 18, carbs: 58, fat: 10 },
    { name_th: 'Greek yogurt + ธัญพืช', name_en: 'Greek yogurt + granola', kcal: 320, protein: 24, carbs: 38, fat: 8 },
  ],
  pre_workout: [
    { name_th: 'กล้วย + เวย์โปรตีน', name_en: 'Banana + whey protein', kcal: 280, protein: 25, carbs: 35, fat: 5 },
    { name_th: 'ข้าว + ไก่ต้ม', name_en: 'Rice + boiled chicken', kcal: 400, protein: 35, carbs: 42, fat: 6 },
  ],
  lunch: [
    { name_th: 'ข้าวไก่ย่าง + ผัก', name_en: 'Grilled chicken rice + veggies', kcal: 520, protein: 45, carbs: 48, fat: 14 },
    { name_th: 'ข้าวกล้องปลานึ่ง + ผัดผัก', name_en: 'Steamed fish + brown rice + stir-fry', kcal: 490, protein: 40, carbs: 50, fat: 10 },
    { name_th: 'ต้มยำกุ้ง + ข้าว', name_en: 'Tom Yum Goong + rice', kcal: 460, protein: 38, carbs: 48, fat: 10 },
  ],
  dinner: [
    { name_th: 'สเต็กเนื้อ + บรอกโคลี + มันฝรั่ง', name_en: 'Steak + broccoli + potato', kcal: 600, protein: 48, carbs: 45, fat: 20 },
    { name_th: 'อกไก่อบ + สลัด + ควินัว', name_en: 'Baked chicken breast + salad + quinoa', kcal: 480, protein: 45, carbs: 38, fat: 12 },
    { name_th: 'ปลาแซลมอนนึ่ง + ผัก + ข้าวกล้อง', name_en: 'Steamed salmon + veggies + brown rice', kcal: 540, protein: 42, carbs: 44, fat: 16 },
  ],
  snack: [
    { name_th: 'ถั่วรวม 30g', name_en: 'Mixed nuts 30g', kcal: 180, protein: 6, carbs: 8, fat: 14 },
    { name_th: 'Greek yogurt 150g', name_en: 'Greek yogurt 150g', kcal: 140, protein: 15, carbs: 12, fat: 4 },
    { name_th: 'เวย์โปรตีน 1 scoop', name_en: 'Whey protein 1 scoop', kcal: 120, protein: 24, carbs: 4, fat: 2 },
  ],
};

export function selectExercises(
  split: string,
  status: string,
  experience: string,
  soreness: string
): Exercise[] {
  const expIndex = experience === 'beginner' ? 0 : experience === 'intermediate' ? 1 : 2;
  const minLevelIndex = (level: string) => level === 'beginner' ? 0 : level === 'intermediate' ? 1 : 2;

  // Recovery day — return mobility/rest exercises, no heavy lifting
  if (split === 'Recovery') {
    return [
      { key: 'foam_roll', name_en: 'Foam Rolling', name_th: 'โฟมโรลลิ่ง', muscles: 'Full Body', split: 'recovery', type: 'mobility', green_sets: '10 min', yellow_sets: '10 min', min_level: 'beginner', form_tips_en: ['Roll slowly over tight areas', 'Pause 20–30s on tender spots'], form_tips_th: ['กลิ้งช้าๆ บริเวณที่ตึง', 'หยุดค้าง 20–30 วิ'] },
      { key: 'cat_cow', name_en: 'Cat-Cow Stretch', name_th: 'ยืดแมว-วัว', muscles: 'Spine, Core', split: 'recovery', type: 'mobility', green_sets: '3×10', yellow_sets: '3×10', min_level: 'beginner', form_tips_en: ['Inhale on cow, exhale on cat', 'Move slowly and deliberately'], form_tips_th: ['หายใจเข้าตอนแอ่น', 'เคลื่อนไหวช้าๆ'] },
      { key: 'hip_flexor_stretch', name_en: 'Hip Flexor Stretch', name_th: 'ยืดสะโพก', muscles: 'Hip Flexors', split: 'recovery', type: 'mobility', green_sets: '3×30s each', yellow_sets: '3×30s each', min_level: 'beginner', form_tips_en: ['Keep torso upright', 'Push hips gently forward'], form_tips_th: ['ลำตัวตรง', 'ดันสะโพกไปข้างหน้าเบาๆ'] },
      { key: 'thoracic_rotation', name_en: 'Thoracic Rotation', name_th: 'หมุนหลังส่วนบน', muscles: 'Upper Back', split: 'recovery', type: 'mobility', green_sets: '2×10 each', yellow_sets: '2×10 each', min_level: 'beginner', form_tips_en: ['Keep hips stable', 'Rotate elbow toward ceiling'], form_tips_th: ['สะโพกนิ่ง', 'หมุนศอกขึ้น'] },
      { key: 'easy_walk', name_en: 'Easy Walk', name_th: 'เดินเบาๆ', muscles: 'Full Body', split: 'recovery', type: 'cardio', green_sets: '20–30 min', yellow_sets: '15 min', min_level: 'beginner', form_tips_en: ['Conversational pace only', 'No incline or intensity'], form_tips_th: ['เดินแบบคุยได้สบาย', 'ไม่ต้องหัก'] },
    ] as any[];
  }

  let splitFilters: string[] = [];
  if (split === 'Lower Body') splitFilters = ['lower'];
  else if (split === 'Upper Body') splitFilters = ['upper_chest', 'upper_back', 'upper_shoulders', 'upper_arms'];
  else if (split === 'Full Body') splitFilters = ['full_body'];
  else if (split === 'Light Full Body') splitFilters = ['full_body'];
  else return [];

  const pool = EXERCISE_DB.filter(e =>
    splitFilters.includes(e.split) &&
    minLevelIndex(e.min_level) <= expIndex &&
    (!e.avoid_when || e.avoid_when !== soreness)
  );

  // Red status: limit=4 (was 0 — caused empty list bug)
  const limit = status === 'Green' ? 8 : status === 'Yellow' ? 6 : 4;
  return pool.slice(0, limit);
}
