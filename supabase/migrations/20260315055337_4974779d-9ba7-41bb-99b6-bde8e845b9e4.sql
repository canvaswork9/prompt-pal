
CREATE OR REPLACE FUNCTION public.add_xp(
  p_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT,
  p_description TEXT DEFAULT NULL
)
RETURNS TABLE(new_total INTEGER, new_level INTEGER, did_level_up BOOLEAN)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_level INTEGER;
  v_new_total INTEGER;
  v_new_level INTEGER;
BEGIN
  UPDATE user_gamification
  SET total_xp = COALESCE(total_xp, 0) + p_amount,
      updated_at = now()
  WHERE id = p_user_id
  RETURNING total_xp INTO v_new_total;

  v_old_level := LEAST(GREATEST(floor(sqrt(GREATEST(v_new_total - p_amount, 0)::float / 200))::int + 1, 1), 50);
  v_new_level := LEAST(GREATEST(floor(sqrt(v_new_total::float / 200))::int + 1, 1), 50);

  UPDATE user_gamification
  SET current_level = v_new_level,
      tier_name = CASE
        WHEN v_new_level >= 50 THEN 'Immortal'
        WHEN v_new_level >= 30 THEN 'Legend'
        WHEN v_new_level >= 20 THEN 'Champion'
        WHEN v_new_level >= 10 THEN 'Warrior'
        WHEN v_new_level >= 5 THEN 'Sprout'
        ELSE 'Seedling'
      END
  WHERE id = p_user_id;

  INSERT INTO xp_transactions(user_id, xp_amount, reason, description)
  VALUES (p_user_id, p_amount, p_reason, p_description);

  RETURN QUERY SELECT v_new_total, v_new_level, (v_new_level > v_old_level);
END;
$$;
