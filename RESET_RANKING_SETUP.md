# Configuração das Novas Funcionalidades - Reset de Ranking

## Funcionalidades Adicionadas

1. **Botão "Resetar Rank"** - Aparece ao lado do botão "Histórico"
2. **Proteção por senha** - Solicita a senha 'aeiou123' para confirmar
3. **Salvamento do Top 3 semanal** - Antes de resetar, salva os 3 primeiros da semana
4. **Ícones de histórico de tops** - Mostra quantas vezes cada jogador foi top 1, 2 ou 3
5. **Novo banco de dados** - Tabela para armazenar histórico semanal

## Configuração do Banco de Dados

### 1. Criação da Tabela

Execute o script SQL no Supabase Dashboard (SQL Editor):

```sql
-- Execute o conteúdo do arquivo migration-create-weekly-top3.sql
```

Ou copie o conteúdo do arquivo `migration-create-weekly-top3.sql` e execute no SQL Editor do Supabase.

### 2. Verificação

Após executar o script, verifique se a tabela foi criada:

```sql
SELECT * FROM weekly_top3;
```

## Como Usar

### 1. Resetar Ranking

1. Clique no botão **"Resetar Rank"** ao lado de "Histórico"
2. Digite a senha: `aeiou123`
3. Clique em "Resetar"

**O que acontece:**
- O Top 3 atual é salvo na tabela `weekly_top3`
- Todos os dados de partidas são apagados
- Estatísticas dos jogadores são resetadas
- Histórico de tops semanais é mantido

### 2. Visualização do Histórico de Tops

- **Ícones dourados** 🏆: Quantas vezes foi TOP 1
- **Ícones prateados** 🏆: Quantas vezes foi TOP 2  
- **Ícones bronze** 🏆: Quantas vezes foi TOP 3

Os ícones aparecem:
- Na versão mobile: pequenos ao lado dos MVPs
- Na versão desktop: maiores com texto "TOP1", "TOP2", "TOP3"

## Estrutura da Tabela weekly_top3

```sql
- id: UUID (chave primária)
- week_start_date: Data de início da semana (domingo)
- week_end_date: Data de fim da semana (sábado)
- top1_player_id: ID do jogador top 1
- top1_player_name: Nome do jogador top 1
- top1_player_avatar: Avatar do jogador top 1
- top1_score: Score do jogador top 1
- top2_player_id: ID do jogador top 2
- top2_player_name: Nome do jogador top 2
- top2_player_avatar: Avatar do jogador top 2
- top2_score: Score do jogador top 2
- top3_player_id: ID do jogador top 3
- top3_player_name: Nome do jogador top 3
- top3_player_avatar: Avatar do jogador top 3
- top3_score: Score do jogador top 3
- created_at: Data de criação
- updated_at: Data de atualização
```

## Comportamento Técnico

### Salvamento Automático
- Ao resetar, o sistema automaticamente identifica os 3 melhores jogadores
- Salva suas informações na tabela `weekly_top3`
- Define a semana como domingo a sábado

### Contadores de Tops
- São calculados em tempo real baseados no histórico
- Atualizam automaticamente quando novos dados são carregados
- Não são armazenados diretamente no banco, são calculados

### Segurança
- Senha obrigatória: `aeiou123`
- Confirmação visual das ações que serão executadas
- Loading state durante o processo de reset

## Possíveis Problemas e Soluções

### 1. Tabela não existe
Se aparecer erro sobre tabela `weekly_top3`:
1. Execute o script SQL de migração
2. Verifique as permissões no Supabase
3. Confirme que a tabela foi criada

### 2. Contadores não aparecem
Se os ícones de top não aparecem:
1. Verifique se há dados na tabela `weekly_top3`
2. Faça um refresh da página
3. Verifique o console do navegador para erros

### 3. Reset não funciona
Se o reset não funciona:
1. Verifique a senha: `aeiou123`
2. Verifique permissões do Supabase
3. Verifique o console para erros de rede

## Manutenção

- A tabela `weekly_top3` cresce com o tempo
- Considere fazer backup periódico dos dados
- Os ícones são atualizados automaticamente
- Não é necessário manutenção manual dos contadores 