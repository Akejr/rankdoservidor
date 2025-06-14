# 🚀 RIFT LEGENDS - Sistema de Ranking League of Legends

Um sistema moderno de ranking para jogadores de League of Legends com interface gaming, integração com Supabase e design responsivo.

![RIFT LEGENDS](https://img.shields.io/badge/RIFT-LEGENDS-blue?style=for-the-badge&logo=riot-games)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase)

## ✨ Funcionalidades

### 🎮 Sistema de Ranking
- **Ranking dinâmico** baseado em performance média
- **Estatísticas KDA** detalhadas por jogador
- **Histórico de partidas** com dados completos
- **Atualizações em tempo real** via Supabase

### 🔐 Segurança
- **Proteção por senha** para reset de dados (`aeiou123`)
- **Confirmação protegida** para cadastro de partidas
- **Validação de dados** robusta

### 📱 Interface Responsiva
- **Design mobile-first** otimizado para todos os dispositivos
- **Layout adaptativo** (mobile compacto + desktop completo)
- **Tema gaming** com gradientes e animações
- **Ícones Lucide** para melhor UX

### ⚡ Funcionalidades Avançadas
- **Suporte flexível** para 1-5 jogadores por partida
- **Cálculo automático** de médias e estatísticas
- **Interface de administração** intuitiva
- **Modo debug** para desenvolvimento

## 🛠️ Stack Tecnológica

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Icons**: Lucide React
- **Deployment**: Vercel/Netlify ready

## 🚀 Instalação e Configuração

### 1. Clone o repositório
```bash
git clone https://github.com/Akejr/rankdoservidor.git
cd rankdoservidor
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure o Supabase
Crie um arquivo `.env` na raiz do projeto:
```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

### 4. Configure o banco de dados
Execute o seguinte SQL no seu painel do Supabase:

```sql
-- Tabela de jogadores
CREATE TABLE players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  avatar TEXT NOT NULL,
  total_matches INTEGER DEFAULT 0,
  total_rating DECIMAL DEFAULT 0,
  total_kills INTEGER DEFAULT 0,
  total_deaths INTEGER DEFAULT 0,
  total_assists INTEGER DEFAULT 0,
  average_rating DECIMAL DEFAULT 0,
  average_kills DECIMAL DEFAULT 0,
  average_deaths DECIMAL DEFAULT 0,
  average_assists DECIMAL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de partidas
CREATE TABLE matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de participantes das partidas
CREATE TABLE match_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  rating DECIMAL NOT NULL,
  kills INTEGER NOT NULL,
  deaths INTEGER NOT NULL,
  assists INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_participants ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (permitir tudo para desenvolvimento)
CREATE POLICY "Allow all operations on players" ON players FOR ALL USING (true);
CREATE POLICY "Allow all operations on matches" ON matches FOR ALL USING (true);
CREATE POLICY "Allow all operations on match_participants" ON match_participants FOR ALL USING (true);

-- Inserir jogadores iniciais
INSERT INTO players (name, avatar) VALUES
('Akejr', 'https://ddragon.leagueoflegends.com/cdn/13.24.1/img/champion/Yasuo.png'),
('Player2', 'https://ddragon.leagueoflegends.com/cdn/13.24.1/img/champion/Zed.png'),
('Player3', 'https://ddragon.leagueoflegends.com/cdn/13.24.1/img/champion/Jinx.png'),
('Player4', 'https://ddragon.leagueoflegends.com/cdn/13.24.1/img/champion/Thresh.png'),
('Player5', 'https://ddragon.leagueoflegends.com/cdn/13.24.1/img/champion/LeeSin.png');
```

### 5. Execute o projeto
```bash
npm run dev
```

## 🌐 Deploy no GitHub Pages

### Configuração Automática
O projeto está configurado para deploy automático no GitHub Pages via GitHub Actions.

### Deploy Manual
```bash
npm run deploy
```

### Configurar GitHub Pages
1. Vá para **Settings** > **Pages** no seu repositório
2. Em **Source**, selecione **GitHub Actions**
3. O deploy será feito automaticamente a cada push na branch `main`

### URL do Projeto
Após o deploy, o projeto estará disponível em:
`https://seu-usuario.github.io/rankdoservidor/`

### ⚠️ Importante para GitHub Pages
- As variáveis de ambiente (.env) não funcionam no GitHub Pages
- Para usar o Supabase em produção, configure as variáveis diretamente no código ou use GitHub Secrets
- O projeto funcionará offline sem o Supabase (modo demo)

## 🎯 Como Usar

### Visualizar Ranking
- Acesse a página principal para ver o ranking atual
- Jogadores são ordenados por performance média
- Estatísticas KDA são exibidas para cada jogador

### Adicionar Partida
1. Clique no botão **"+"** no canto inferior direito
2. **Passo 1**: Selecione 1-5 jogadores
3. **Passo 2**: Configure ratings (1-10) e estatísticas KDA
4. Digite a senha `aeiou123` para confirmar
5. A partida será salva e o ranking atualizado automaticamente

### Reset de Dados (Desenvolvimento)
- Clique em **"Reset Debug"** (apenas em modo desenvolvimento)
- Digite a senha `aeiou123` para confirmar
- Todos os dados de partidas serão resetados

## 📱 Responsividade

### Mobile (< 768px)
- Layout compacto com informações essenciais
- Cards de ranking otimizados para toque
- Interface de administração adaptada

### Desktop (≥ 768px)
- Layout completo com todas as estatísticas
- Experiência visual rica
- Múltiplas colunas de informação

## 🔧 Desenvolvimento

### Scripts Disponíveis
```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build para produção
npm run preview      # Preview do build
npm run lint         # Linting do código
```

### Estrutura do Projeto
```
src/
├── components/          # Componentes React
│   ├── AdminPanel.tsx   # Painel de administração
│   ├── RankingCard.tsx  # Card de jogador no ranking
│   ├── PasswordPrompt.tsx # Modal de senha
│   └── SupabaseTest.tsx # Componente de debug
├── hooks/
│   └── useSupabase.ts   # Hook para integração com Supabase
├── lib/
│   └── supabase.ts      # Cliente Supabase
├── types.ts             # Definições de tipos TypeScript
└── App.tsx              # Componente principal
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🎮 Créditos

- **Riot Games** pelos assets do League of Legends
- **Supabase** pela infraestrutura de banco de dados
- **Lucide** pelos ícones
- **Tailwind CSS** pelo sistema de design

---

**Desenvolvido com ❤️ para a comunidade League of Legends**

[🔗 Repositório GitHub](https://github.com/Akejr/rankdoservidor) 