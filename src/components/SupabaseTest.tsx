import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const SupabaseTest: React.FC = () => {
  const [status, setStatus] = useState('Testando...');
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testConnection = async () => {
      try {
        console.log('🔍 Iniciando teste de conexão...');
        
        // Teste 1: Verificar se as variáveis existem
        const url = import.meta.env.VITE_SUPABASE_URL;
        const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        console.log('🔗 URL:', url);
        console.log('🔑 Key exists:', !!key);
        
        if (!url || !key) {
          throw new Error(`Variáveis faltando - URL: ${!!url}, Key: ${!!key}`);
        }

        // Teste 2: Tentar listar tabelas
        console.log('📋 Testando acesso à tabela players...');
        const { data, error, count } = await supabase
          .from('players')
          .select('*', { count: 'exact' });

        if (error) {
          console.error('❌ Erro na query:', error);
          throw error;
        }

        console.log('✅ Sucesso! Dados:', data);
        setStatus('✅ Conexão OK!');
        setDetails({
          players: data,
          count: count,
          url: url.substring(0, 30) + '...',
          keyLength: key.length
        });

      } catch (err: any) {
        console.error('❌ Erro no teste:', err);
        setError(err.message || 'Erro desconhecido');
        setStatus('❌ Erro de conexão');
        
        // Diagnósticos específicos
        if (err.message?.includes('relation "players" does not exist')) {
          setError('Tabela "players" não existe - Execute o SQL no Supabase');
        } else if (err.message?.includes('JWT')) {
          setError('Problema com a chave de autenticação');
        } else if (err.message?.includes('network')) {
          setError('Problema de rede ou URL incorreta');
        }
      }
    };

    testConnection();
  }, []);

  const createTables = async () => {
    try {
      setStatus('🔧 Criando tabelas...');
      
      const { error } = await supabase.rpc('exec', {
        sql: `
          CREATE TABLE IF NOT EXISTS players (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            avatar TEXT NOT NULL,
            total_rating DECIMAL DEFAULT 0,
            total_matches INTEGER DEFAULT 0,
            average_rating DECIMAL DEFAULT 0,
            total_kills INTEGER DEFAULT 0,
            total_deaths INTEGER DEFAULT 0,
            total_assists INTEGER DEFAULT 0,
            average_kills DECIMAL DEFAULT 0,
            average_deaths DECIMAL DEFAULT 0,
            average_assists DECIMAL DEFAULT 0,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );
        `
      });

      if (error) throw error;
      
      setStatus('✅ Tabelas criadas! Recarregue a página.');
    } catch (err: any) {
      setError('Erro ao criar tabelas: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔧 Diagnóstico Supabase</h1>
        
        <div className="bg-gray-900 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Status da Conexão</h2>
          <p className="text-lg mb-4">{status}</p>
          
          {error && (
            <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-red-400 mb-2">Erro:</h3>
              <p className="text-red-300">{error}</p>
            </div>
          )}
          
          {details && (
            <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-4">
              <h3 className="font-semibold text-green-400 mb-2">Detalhes:</h3>
              <pre className="text-green-300 text-sm overflow-auto">
                {JSON.stringify(details, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {error?.includes('não existe') && (
          <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-6">
            <h3 className="font-semibold text-blue-400 mb-4">Solução:</h3>
            <p className="mb-4">As tabelas não existem no banco. Execute este SQL no Supabase:</p>
            <div className="bg-gray-800 rounded p-4 mb-4 text-sm overflow-auto">
              <code>
{`-- Execute no SQL Editor do Supabase:
CREATE TABLE players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  avatar TEXT NOT NULL,
  total_rating DECIMAL DEFAULT 0,
  total_matches INTEGER DEFAULT 0,
  average_rating DECIMAL DEFAULT 0,
  total_kills INTEGER DEFAULT 0,
  total_deaths INTEGER DEFAULT 0,
  total_assists INTEGER DEFAULT 0,
  average_kills DECIMAL DEFAULT 0,
  average_deaths DECIMAL DEFAULT 0,
  average_assists DECIMAL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Inserir jogadores
INSERT INTO players (name, avatar) VALUES
('Evandro', 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop'),
('Meimei', 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop');

-- Configurar políticas
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON players FOR ALL USING (true);`}
              </code>
            </div>
            <p className="text-sm text-gray-400">
              1. Vá em https://supabase.com/dashboard<br/>
              2. Selecione seu projeto<br/>
              3. Clique em "SQL Editor"<br/>
              4. Cole e execute o código acima<br/>
              5. Recarregue esta página
            </p>
          </div>
        )}

        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg mr-4"
        >
          🔄 Testar Novamente
        </button>

        <button
          onClick={() => window.location.href = '/'}
          className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-lg"
        >
          🏠 Voltar ao App
        </button>
      </div>
    </div>
  );
}; 