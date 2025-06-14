import React, { useMemo } from 'react';
import { Player, MatchFormData, Match, MatchParticipant } from './types';
import { RankingCard } from './components/RankingCard';
import { AdminPanel } from './components/AdminPanel';
import { useSupabase } from './hooks/useSupabase';
import { SupabaseTest } from './components/SupabaseTest';
import { PasswordPrompt } from './components/PasswordPrompt';
import { Crown, Gamepad2, Swords, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

function App() {
  const { players, loading, error, addMatch, resetPlayerStats, refetch } = useSupabase();
  const [showResetPassword, setShowResetPassword] = React.useState(false);

  const sortedPlayers = useMemo(() => {
    return [...players]
      .filter((player: Player) => player.totalMatches > 0)
      .sort((a, b) => {
        if (b.averageRating !== a.averageRating) {
          return b.averageRating - a.averageRating;
        }
        return b.totalMatches - a.totalMatches;
      })
      .concat(players.filter((player: Player) => player.totalMatches === 0));
  }, [players]);

  const handleAddMatch = async (matchData: MatchFormData) => {
    try {
      console.log('App.tsx - Recebendo dados da partida:', matchData);
      await addMatch(matchData);
      console.log('App.tsx - Partida adicionada com sucesso');
    } catch (error) {
      console.error('App.tsx - Erro ao adicionar partida:', error);
      throw error; // Re-throw para que o AdminPanel possa capturar
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-blue-400 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Carregando Dados...</h2>
          <p className="text-gray-400">Conectando ao Supabase</p>
        </div>
      </div>
    );
  }

  // Error state - Mostrar diagnóstico detalhado
  if (error) {
    return <SupabaseTest />;
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950/30 via-purple-950/20 to-black"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent"></div>
      
      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-blue-400/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          ></div>
        ))}
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      <div className="relative z-10 container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <div className="flex items-center justify-center space-x-2 sm:space-x-4 mb-4 md:mb-6">
            <div className="relative">
              <Swords className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-blue-400 animate-pulse" />
              <div className="absolute inset-0 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-blue-400/20 rounded-full blur-xl"></div>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-blue-300 bg-clip-text text-transparent">
              RIFT LEGENDS
            </h1>
            <div className="relative">
              <Crown className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-yellow-400 animate-pulse" />
              <div className="absolute inset-0 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-yellow-400/20 rounded-full blur-xl"></div>
            </div>
          </div>
          <div className="relative">
            <p className="text-lg sm:text-xl md:text-2xl text-gray-300 font-semibold tracking-wide">RANKING DOS INVOCADORES</p>
            <p className="text-sm sm:text-base md:text-lg text-blue-400/80 mt-1 md:mt-2">Temporada 2024 • Fenda do Invocador</p>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 sm:w-32 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent"></div>
          </div>
        </div>

        {/* Ranking List */}
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 md:mb-8 space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="w-1 h-6 sm:h-8 bg-gradient-to-b from-blue-400 to-purple-500"></div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">CLASSIFICAÇÃO ATUAL</h2>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="text-xs sm:text-sm text-gray-400 bg-gray-900/50 px-3 sm:px-4 py-2 rounded-lg border border-gray-700/50">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Conectado ao Supabase</span>
                </div>
              </div>
              
              {/* Debug Button - Remove in production */}
              {process.env.NODE_ENV === 'development' && (
                <button
                  onClick={() => setShowResetPassword(true)}
                  className="text-xs text-red-400 hover:text-red-300 bg-red-900/20 px-3 py-2 rounded-lg border border-red-700/30 transition-colors"
                  title="Resetar todos os dados (apenas desenvolvimento)"
                >
                  Reset Debug
                </button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {sortedPlayers.map((player, index) => (
              <RankingCard
                key={player.id}
                player={player}
                rank={index + 1}
              />
            ))}
          </div>

          {sortedPlayers.filter(p => p.totalMatches > 0).length === 0 && (
            <div className="text-center py-12 md:py-16">
              <div className="relative mb-4 md:mb-6">
                <Gamepad2 className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 text-gray-600 mx-auto" />
                <div className="absolute inset-0 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gray-600/10 rounded-full blur-2xl mx-auto"></div>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-400 mb-2 md:mb-3">Nenhuma Batalha Registrada</h3>
              <p className="text-gray-500 text-base sm:text-lg px-4">A Fenda aguarda pelos primeiros combates...</p>
              <div className="mt-3 md:mt-4 w-20 sm:w-24 h-1 bg-gradient-to-r from-transparent via-gray-600 to-transparent mx-auto"></div>
            </div>
          )}
        </div>

        {/* Admin Panel */}
        <AdminPanel players={players} onAddMatch={handleAddMatch} />
      </div>

      {/* Password Prompt para Reset Debug */}
      <PasswordPrompt
        isOpen={showResetPassword}
        onClose={() => setShowResetPassword(false)}
        onConfirm={resetPlayerStats}
        title="Reset Debug"
        description="Esta ação vai resetar todos os dados do ranking"
      />
    </div>
  );
}

export default App;