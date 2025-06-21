-- Criação da tabela weekly_top3 para armazenar o histórico semanal do top 3
CREATE TABLE IF NOT EXISTS weekly_top3 (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    week_start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    week_end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    top1_player_id UUID NOT NULL REFERENCES players(id),
    top1_player_name TEXT NOT NULL,
    top1_player_avatar TEXT NOT NULL,
    top1_score DECIMAL(4,2) NOT NULL,
    top2_player_id UUID NOT NULL REFERENCES players(id),
    top2_player_name TEXT NOT NULL,
    top2_player_avatar TEXT NOT NULL,
    top2_score DECIMAL(4,2) NOT NULL,
    top3_player_id UUID NOT NULL REFERENCES players(id),
    top3_player_name TEXT NOT NULL,
    top3_player_avatar TEXT NOT NULL,
    top3_score DECIMAL(4,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_weekly_top3_week_start ON weekly_top3(week_start_date);
CREATE INDEX IF NOT EXISTS idx_weekly_top3_created_at ON weekly_top3(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_weekly_top3_top1_player ON weekly_top3(top1_player_id);
CREATE INDEX IF NOT EXISTS idx_weekly_top3_top2_player ON weekly_top3(top2_player_id);
CREATE INDEX IF NOT EXISTS idx_weekly_top3_top3_player ON weekly_top3(top3_player_id);

-- Função para automatizar o update do updated_at
CREATE OR REPLACE FUNCTION update_weekly_top3_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER trigger_weekly_top3_updated_at
  BEFORE UPDATE ON weekly_top3
  FOR EACH ROW
  EXECUTE FUNCTION update_weekly_top3_updated_at();

-- Comentários para documentação
COMMENT ON TABLE weekly_top3 IS 'Tabela para armazenar o histórico semanal do top 3 jogadores';
COMMENT ON COLUMN weekly_top3.week_start_date IS 'Data de início da semana (domingo)';
COMMENT ON COLUMN weekly_top3.week_end_date IS 'Data de fim da semana (sábado)';
COMMENT ON COLUMN weekly_top3.top1_score IS 'Score do jogador top 1 da semana';
COMMENT ON COLUMN weekly_top3.top2_score IS 'Score do jogador top 2 da semana';
COMMENT ON COLUMN weekly_top3.top3_score IS 'Score do jogador top 3 da semana'; 