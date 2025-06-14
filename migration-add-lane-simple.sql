-- Migração simples para adicionar coluna lane na tabela match_participants
-- Execute estes comandos UM POR VEZ no Supabase SQL Editor

-- 1. Adicionar coluna lane
ALTER TABLE match_participants 
ADD COLUMN IF NOT EXISTS lane VARCHAR(10) DEFAULT 'TOP';

-- 2. Adicionar restrição de valores válidos
ALTER TABLE match_participants 
ADD CONSTRAINT IF NOT EXISTS match_participants_lane_check 
CHECK (lane IN ('TOP', 'JUNGLE', 'MID', 'ADC', 'SUP'));

-- 3. Atualizar registros existentes com lanes em ordem (execute separadamente)
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