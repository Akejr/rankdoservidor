-- Migração para adicionar coluna lane na tabela match_participants
-- Execute este comando no Supabase SQL Editor

-- Adicionar coluna lane se ela não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'match_participants' 
    AND column_name = 'lane'
  ) THEN
    ALTER TABLE match_participants 
    ADD COLUMN lane VARCHAR(10) DEFAULT 'TOP';
  END IF;
END $$;

-- Adicionar restrição de valores válidos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'match_participants_lane_check'
  ) THEN
    ALTER TABLE match_participants 
    ADD CONSTRAINT match_participants_lane_check 
    CHECK (lane IN ('TOP', 'JUNGLE', 'MID', 'ADC', 'SUP'));
  END IF;
END $$;

-- Atualizar registros existentes com lanes padrão em ordem
WITH ranked_participants AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY match_id ORDER BY created_at) as row_num
  FROM match_participants
)
UPDATE match_participants 
SET lane = CASE 
  WHEN rp.row_num = 1 THEN 'TOP'
  WHEN rp.row_num = 2 THEN 'JUNGLE'
  WHEN rp.row_num = 3 THEN 'MID'
  WHEN rp.row_num = 4 THEN 'ADC'
  WHEN rp.row_num = 5 THEN 'SUP'
  ELSE 'TOP'
END
FROM ranked_participants rp
WHERE match_participants.id = rp.id; 