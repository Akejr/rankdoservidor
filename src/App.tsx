import React, { useMemo } from 'react';
import { Player, MatchFormData, Match, MatchParticipant } from './types';
import { RankingCard } from './components/RankingCard';
import { AdminPanel } from './components/AdminPanel';
import { PlayerAvatar } from './components/PlayerAvatar';
import { PlayerDetailPage } from './components/PlayerDetailPage';
import { MatchHistoryModal } from './components/MatchHistoryModal';
import { useSupabase } from './hooks/useSupabase';
import { supabase } from './lib/supabase';
import { SupabaseTest } from './components/SupabaseTest';
import { PasswordPrompt } from './components/PasswordPrompt';
import { Crown, Gamepad2, Swords, Loader2, AlertCircle, RefreshCw, Shield, Zap, Star, Target, Heart, TrendingDown } from 'lucide-react';

function App() {
  const { players, laneLeaders, serverBagre, worstKDA, loading, error, addMatch, resetPlayerStats, refetch } = useSupabase();
  const [showResetPassword, setShowResetPassword] = React.useState(false);
  const [selectedPlayer, setSelectedPlayer] = React.useState<Player | null>(null);
  const [showMatchHistory, setShowMatchHistory] = React.useState(false);
  const [mvpCounts, setMvpCounts] = React.useState<Map<string, number>>(new Map());

  // Parâmetro de suavização da Média Bayesiana
  const BAYESIAN_WEIGHT = 5; // Número de "partidas virtuais"

  // Função para calcular a Média Bayesiana
  const calculateBayesianAverage = (playerRating: number, playerMatches: number, globalAverage: number) => {
    return (globalAverage * BAYESIAN_WEIGHT + playerRating * playerMatches) / (BAYESIAN_WEIGHT + playerMatches);
  };

  // Error boundary básico
  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Erro capturado:', event.error);
    };
    
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  // Debug do serverBagre
  React.useEffect(() => {
    if (serverBagre) {
      console.log('ServerBagre atualizado:', serverBagre);
      console.log('Avatar do bagre:', serverBagre.playerAvatar);
      console.log('Nome do bagre:', serverBagre.playerName);
    }
  }, [serverBagre]);

  // Calcular MVPs
  React.useEffect(() => {
    if (players.length > 0) {
      calculateMVPs();
    }
  }, [players]);

  const calculateMVPs = async () => {
    try {
      const { data: allMatchesData, error: allMatchesError } = await supabase
        .from('match_participants')
        .select(`
          player_id,
          rating,
          match_id,
          players (
            name,
            avatar
          )
        `);

      if (allMatchesError) {
        console.error('Erro ao buscar dados para MVP:', allMatchesError);
        return;
      }

      // Agrupar participantes por match_id
      const matchGroups = new Map<string, any[]>();
      
      allMatchesData?.forEach((participant: any) => {
        const matchId = participant.match_id;
        if (!matchGroups.has(matchId)) {
          matchGroups.set(matchId, []);
        }
        matchGroups.get(matchId)!.push({
          playerId: participant.player_id,
          rating: participant.rating
        });
      });

      const newMvpCounts = new Map<string, number>();

      // Para cada partida, encontrar o MVP
      matchGroups.forEach((participants) => {
        if (participants.length === 0) return;

        const mvp = participants.reduce((prev: any, current: any) => 
          prev.rating > current.rating ? prev : current
        );

        const currentCount = newMvpCounts.get(mvp.playerId) || 0;
        newMvpCounts.set(mvp.playerId, currentCount + 1);
      });

      setMvpCounts(newMvpCounts);
    } catch (error) {
      console.error('Erro ao calcular MVPs:', error);
    }
  };

  // Função para obter ícone da lane
  const getLaneIcon = (lane: string) => {
    switch (lane) {
      case 'TOP': return Shield;
      case 'JUNGLE': return Zap;
      case 'MID': return Star;
      case 'ADC': return Target;
      case 'SUP': return Heart;
      default: return Star;
    }
  };

  // Função para obter cores da lane - Tema Medieval LoL
  const getLaneColors = (lane: string) => {
    switch (lane) {
      case 'TOP': return {
        bg: 'from-slate-900/90 via-blue-900/60 to-slate-800/90',
        border: 'border-blue-300/60',
        text: 'text-blue-300',
        glow: 'bg-blue-300/30',
        shadow: 'shadow-blue-500/20'
      };
      case 'JUNGLE': return {
        bg: 'from-slate-900/90 via-emerald-900/60 to-green-900/90',
        border: 'border-emerald-300/60',
        text: 'text-emerald-300',
        glow: 'bg-emerald-300/30',
        shadow: 'shadow-emerald-500/20'
      };
      case 'MID': return {
        bg: 'from-slate-900/90 via-purple-900/60 to-indigo-900/90',
        border: 'border-purple-300/60',
        text: 'text-purple-300',
        glow: 'bg-purple-300/30',
        shadow: 'shadow-purple-500/20'
      };
      case 'ADC': return {
        bg: 'from-slate-900/90 via-red-900/60 to-rose-900/90',
        border: 'border-red-300/60',
        text: 'text-red-300',
        glow: 'bg-red-300/30',
        shadow: 'shadow-red-500/20'
      };
      case 'SUP': return {
        bg: 'from-slate-900/90 via-amber-900/60 to-yellow-900/90',
        border: 'border-amber-300/60',
        text: 'text-amber-300',
        glow: 'bg-amber-300/30',
        shadow: 'shadow-amber-500/20'
      };
      default: return {
        bg: 'from-slate-900/90 via-gray-800/60 to-slate-800/90',
        border: 'border-gray-400/60',
        text: 'text-gray-300',
        glow: 'bg-gray-400/30',
        shadow: 'shadow-gray-500/20'
      };
    }
  };

  const sortedPlayers = useMemo(() => {
    // Calcular a média geral de todos os jogadores com partidas
    const playersWithMatches = players.filter((player: Player) => player.totalMatches > 0);
    const globalAverage = playersWithMatches.length > 0 
      ? playersWithMatches.reduce((sum, player) => sum + player.averageRating, 0) / playersWithMatches.length
      : 5; // Valor padrão se não há jogadores com partidas

    // Separar jogadores com partidas dos sem partidas
    const playersWithMatchesAdjusted = playersWithMatches.map(player => ({
      ...player,
      bayesianRating: calculateBayesianAverage(player.averageRating, player.totalMatches, globalAverage)
    }));

    // Ordenar por Média Bayesiana
    const sortedPlayersWithMatches = playersWithMatchesAdjusted
      .sort((a, b) => {
        if (b.bayesianRating !== a.bayesianRating) {
          return b.bayesianRating - a.bayesianRating;
        }
        return b.totalMatches - a.totalMatches;
      });
    
    const playersWithoutMatches = players.filter((player: Player) => player.totalMatches === 0);
    
    return [...sortedPlayersWithMatches, ...playersWithoutMatches];
  }, [players, BAYESIAN_WEIGHT]);

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

  // Error state - Fallback mais simples
  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-4xl font-bold text-red-400 mb-4">Erro de Conexão</h1>
          <p className="text-gray-300 mb-4">Não foi possível conectar ao banco de dados.</p>
          <p className="text-gray-500 text-sm">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
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
            <p className="text-sm sm:text-base md:text-lg text-blue-400/80 mt-1 md:mt-2">Temporada 2025 • Fenda do Invocador</p>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 sm:w-32 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent"></div>
          </div>
        </div>



        {/* Lane Leaders */}
        {laneLeaders.length > 0 && (
          <div className="max-w-6xl mx-auto mb-8 md:mb-12">
            <div className="flex items-center space-x-3 mb-4 md:mb-6">
              <div className="w-1 h-6 sm:h-8 bg-gradient-to-b from-yellow-400 to-orange-500"></div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">LÍDERES POR POSIÇÃO</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
              {laneLeaders.map((leader) => {
                const LaneIcon = getLaneIcon(leader.lane);
                const colors = getLaneColors(leader.lane);
                
                return (
                  <div 
                    key={leader.lane} 
                    className={`relative bg-gradient-to-br ${colors.bg} rounded-none border-4 ${colors.border} text-center transition-all duration-500 hover:scale-110 hover:shadow-2xl ${colors.shadow} backdrop-blur-md overflow-hidden group transform hover:-translate-y-1`}
                    style={{
                      clipPath: 'polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 15px 100%, 0 calc(100% - 15px))',
                      background: `linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.95) 50%, rgba(0,0,0,0.8) 100%), ${colors.bg.replace('from-', 'linear-gradient(135deg, ').replace(' via-', ', ').replace(' to-', ', ')}`
                    }}
                  >
                    {/* Medieval border decoration */}
                    <div className="absolute inset-0 border-2 border-amber-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" 
                         style={{ clipPath: 'polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 15px 100%, 0 calc(100% - 15px))' }}></div>
                    
                    {/* Inner glow effect */}
                    <div className={`absolute inset-0 ${colors.glow} blur-2xl opacity-0 group-hover:opacity-40 transition-opacity duration-500`}></div>
                    
                    {/* Corner ornaments */}
                    <div className={`absolute top-0 left-0 w-6 h-6 ${colors.text} opacity-30`}>
                      <div className="absolute top-1 left-1 w-1 h-4 bg-current transform rotate-45"></div>
                      <div className="absolute top-1 left-1 w-4 h-1 bg-current transform rotate-45"></div>
                    </div>
                    <div className={`absolute top-0 right-0 w-6 h-6 ${colors.text} opacity-30`}>
                      <div className="absolute top-1 right-1 w-1 h-4 bg-current transform -rotate-45"></div>
                      <div className="absolute top-1 right-1 w-4 h-1 bg-current transform -rotate-45"></div>
                    </div>

                    <div className="relative z-10 p-4">
                      {/* Medieval banner with lane */}
                      <div className="relative mb-3">
                        <div className={`bg-gradient-to-r from-transparent via-amber-500/20 to-transparent h-8 flex items-center justify-center border-y border-amber-500/40`}>
                          <div className="flex items-center space-x-2">
                            <div className={`relative ${colors.text} drop-shadow-lg`}>
                              <LaneIcon className="w-4 h-4 filter drop-shadow-md" />
                              <div className={`absolute inset-0 ${colors.glow} rounded-full blur-sm opacity-60`}></div>
                            </div>
                            <div className={`text-xs font-bold ${colors.text} uppercase tracking-wider drop-shadow-md`} style={{ fontFamily: 'serif' }}>
                              {leader.lane}
                            </div>
                          </div>
                        </div>
                        {/* Banner tails */}
                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-amber-500/40"></div>
                      </div>

                      {/* Legendary Crown */}
                      <div className="relative z-10 mb-3">
                        <div className="relative inline-block">
                          <Crown className="w-6 h-6 text-amber-400 mx-auto animate-pulse filter drop-shadow-lg" />
                          <div className="absolute inset-0 bg-amber-400/40 rounded-full blur-lg animate-pulse"></div>
                          <div className="absolute -inset-2 border border-amber-500/30 rounded-full animate-spin" style={{ animationDuration: '8s' }}></div>
                        </div>
                      </div>

                                             {/* Epic Avatar Frame */}
                       <div className="relative z-10 mb-3">
                         <div className="relative inline-block">
                           {/* Power rings - Behind */}
                           <div className={`absolute -inset-4 border ${colors.border} rounded-full opacity-20 animate-spin z-0`} style={{ animationDuration: '10s', animationDirection: 'reverse' }}></div>
                           <div className={`absolute -inset-3 border-2 ${colors.border} rounded-full opacity-30 animate-spin z-0`} style={{ animationDuration: '6s' }}></div>
                           
                           {/* Magical aura - Behind */}
                           <div className={`absolute -inset-2 ${colors.glow} rounded-full blur-lg opacity-30 animate-pulse z-0`}></div>
                           
                           {/* Avatar with frame - Front */}
                           <div className={`relative z-20 bg-gradient-to-r ${colors.text.replace('text-', 'from-')} to-amber-400 rounded-full p-0.5 animate-pulse`}>
                             <div className="bg-slate-900 rounded-full p-0.5">
                               <img
                                 src={leader.playerAvatar}
                                 alt={leader.playerName}
                                 className="w-14 h-14 rounded-full shadow-2xl relative z-30 cursor-pointer hover:scale-110 transition-transform duration-200"
                                 onClick={() => {
                                   const player = players.find(p => p.id === leader.playerId);
                                   if (player) setSelectedPlayer(player);
                                 }}
                               />
                             </div>
                           </div>
                         </div>
                       </div>

                      {/* Champion Name */}
                      <div className="relative z-10 mb-2">
                        <p className="text-amber-100 font-bold text-sm drop-shadow-md truncate group-hover:text-amber-50 transition-colors" style={{ fontFamily: 'serif', letterSpacing: '0.05em' }}>
                          {leader.playerName}
                        </p>
                        <div className="h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent mt-1"></div>
                      </div>

                      {/* Epic Rating Display */}
                      <div className="relative z-10">
                        <div className={`${colors.text} font-bold text-xl drop-shadow-lg mb-1 group-hover:scale-110 transition-transform`} style={{ fontFamily: 'serif' }}>
                          {leader.bestRating.toFixed(1)}
                        </div>
                        <div className="text-xs text-amber-200/80 uppercase tracking-widest font-semibold drop-shadow-sm" style={{ fontFamily: 'serif' }}>
                          Lenda
                        </div>
                      </div>
                    </div>

                    {/* Medieval corner decorations */}
                    <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-amber-500/40"></div>
                    <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-amber-500/40"></div>
                    
                    {/* Mystical particles */}
                    <div className="absolute top-2 right-2 w-1 h-1 bg-amber-400 rounded-full animate-ping"></div>
                    <div className="absolute bottom-3 left-3 w-1 h-1 bg-amber-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
                    <div className="absolute top-1/2 left-1 w-0.5 h-0.5 bg-amber-400 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Ranking List */}
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 md:mb-8 space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="w-1 h-6 sm:h-8 bg-gradient-to-b from-blue-400 to-purple-500"></div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">CLASSIFICAÇÃO ATUAL</h2>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <button
                onClick={() => setShowMatchHistory(true)}
                className="text-xs sm:text-sm text-blue-400 hover:text-blue-300 bg-blue-900/20 px-3 sm:px-4 py-2 rounded-lg border border-blue-700/30 transition-colors flex items-center space-x-2"
                title="Ver histórico de partidas"
              >
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span>Histórico</span>
              </button>

              {/* Refresh Button */}
              <button
                onClick={() => refetch(true)}
                className="text-xs text-blue-400 hover:text-blue-300 bg-blue-900/20 px-3 py-2 rounded-lg border border-blue-700/30 transition-colors flex items-center space-x-1"
                title="Atualizar dados"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Atualizar</span>
              </button>
              
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
                onPlayerClick={setSelectedPlayer}
                mvpCount={mvpCounts.get(player.id) || 0}
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

          {/* Bagre do Servidor */}
          {serverBagre && sortedPlayers.filter(p => p.totalMatches > 0).length > 0 && (
            <div className="mt-12 md:mt-16">
              <div className="flex items-center justify-center space-x-4 mb-6 md:mb-8">
                <div className="w-2 h-8 bg-gradient-to-b from-red-500 via-orange-500 to-red-600 rounded-full"></div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-red-400 via-orange-400 to-red-300 bg-clip-text text-transparent">
                  HALL DA VERGONHA
                </h2>
                <div className="w-2 h-8 bg-gradient-to-b from-red-500 via-orange-500 to-red-600 rounded-full"></div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 max-w-7xl mx-auto px-4">
                {/* Card do Bagre do Servidor */}
                <div className="relative max-w-lg w-full mx-auto">
                  {/* Background with animated gradients */}
                  <div className="absolute inset-0 bg-gradient-to-br from-red-900/90 via-orange-900/90 to-red-800/90 rounded-2xl blur-sm"></div>
                  <div className="absolute inset-0 bg-gradient-to-tr from-red-800/50 via-orange-800/50 to-red-700/50 rounded-2xl animate-pulse"></div>
                  
                  {/* Main card */}
                  <div className="relative bg-gradient-to-br from-red-900/95 via-orange-900/95 to-red-800/95 backdrop-blur-md rounded-2xl border-2 border-red-500/60 shadow-2xl shadow-red-500/30 overflow-hidden group animate-shame-glow hover:scale-105 transition-transform duration-500">
                    
                    {/* Floating particles */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                      {[...Array(8)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute w-1 h-1 bg-red-400/60 rounded-full animate-floating-particle"
                          style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 3}s`,
                            animationDuration: `${3 + Math.random() * 2}s`
                          }}
                        ></div>
                      ))}
                    </div>

                    {/* Header section */}
                    <div className="relative z-10 bg-gradient-to-r from-red-800/80 to-orange-800/80 p-4 border-b-2 border-red-500/40 animate-degradation-pulse">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                          <span className="text-white text-sm font-bold">💀</span>
                        </div>
                        <h3 className="text-lg font-bold text-red-100 uppercase tracking-wide">
                          Pior Performance Registrada
                        </h3>
                        <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                          <span className="text-white text-sm font-bold">💀</span>
                        </div>
                      </div>
                    </div>

                    {/* Player info section */}
                    <div className="relative z-10 p-6">
                      {/* Avatar section with robust fallback */}
                      <div className="flex flex-col items-center mb-6">
                        <div className="relative mb-4">
                          {/* Animated rings */}
                          <div className="absolute -inset-8 border-2 border-red-500/30 rounded-full animate-spin" style={{ animationDuration: '8s' }}></div>
                          <div className="absolute -inset-6 border-2 border-orange-500/40 rounded-full animate-spin" style={{ animationDuration: '6s', animationDirection: 'reverse' }}></div>
                          <div className="absolute -inset-4 border-2 border-red-400/50 rounded-full animate-pulse"></div>
                          
                          {/* Avatar container */}
                          <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-red-500 to-orange-600 p-1 shadow-2xl shadow-red-500/50">
                            <div className="w-full h-full rounded-full bg-slate-900 p-1 overflow-hidden">
                                                              <div 
                                  className="cursor-pointer w-full h-full" 
                                  onClick={() => {
                                    const player = players.find(p => p.id === serverBagre.playerId);
                                    if (player) setSelectedPlayer(player);
                                  }}
                                >
                                  <PlayerAvatar 
                                    playerName={serverBagre.playerName}
                                    playerAvatar={serverBagre.playerAvatar}
                                    size="w-full h-full"
                                    className="rounded-full object-cover filter grayscale hover:grayscale-0 transition-all duration-500 contrast-110 hover:scale-105"
                                  />
                                </div>
                            </div>
                          </div>
                          
                          {/* Shame badge */}
                          <div className="absolute -bottom-2 -right-2 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full border-2 border-red-400 shadow-lg animate-shame-badge">
                            FRACASSO
                          </div>
                        </div>
                        
                        {/* Player name */}
                        <h3 className="text-2xl font-bold text-red-100 mb-2 text-center">
                          {serverBagre.playerName}
                        </h3>
                        <p className="text-red-300/80 text-sm font-semibold italic mb-4">
                          "O Imperador dos Feeds"
                        </p>
                      </div>

                      {/* Stats grid - Para manter altura similar ao outro card */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {/* Rating card */}
                        <div className="bg-gradient-to-br from-red-800/60 to-orange-800/60 rounded-xl p-4 border border-red-500/30 text-center">
                          <div className="text-3xl font-bold text-red-200 mb-1">
                            {serverBagre.worstRating.toFixed(1)}
                          </div>
                          <div className="text-xs text-red-300/80 uppercase tracking-widest font-semibold">
                            Nota Histórica
                          </div>
                        </div>
                        
                        {/* Spacer para alinhamento */}
                        <div className="bg-gradient-to-br from-red-800/30 to-orange-800/30 rounded-xl p-4 border border-red-500/20 text-center">
                          <div className="text-lg font-bold text-red-200/60 mb-1">
                            💀
                          </div>
                          <div className="text-xs text-red-300/60 uppercase tracking-widest font-semibold">
                            Hall Fame
                          </div>
                        </div>
                        
                        {/* Date card */}
                        <div className="bg-gradient-to-br from-orange-800/60 to-red-800/60 rounded-xl p-4 border border-orange-500/30 text-center">
                          <div className="text-sm font-bold text-orange-200 mb-1">
                            {new Date(serverBagre.matchDate).toLocaleDateString('pt-BR')}
                          </div>
                          <div className="text-xs text-orange-300/80 uppercase tracking-widest font-semibold">
                            Data do Feito
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 mb-6">
                        {/* Placeholder para manter altura */}
                        <div className="h-16"></div>
                      </div>

                      {/* Shame messages */}
                      <div className="space-y-3">
                        <div className="bg-black/30 rounded-lg p-4 border border-red-500/20">
                          <div className="flex items-start space-x-3">
                            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-white text-xs font-bold">!</span>
                            </div>
                            <div>
                              <p className="text-red-200 text-sm font-semibold mb-1">Alerta do Sistema</p>
                              <p className="text-red-300/90 text-xs">
                                Performance tão impressionante que o servidor teve que criar uma categoria especial para registrar o feito.
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="bg-red-900/30 rounded-lg p-3 border border-red-500/20">
                            <div className="flex items-center space-x-2">
                              <span className="text-red-400 text-sm">🏆</span>
                              <div>
                                <p className="text-red-200 text-xs font-semibold">Conquista Desbloqueada</p>
                                <p className="text-red-300/80 text-xs">"Lenda Urbana"</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-orange-900/30 rounded-lg p-3 border border-orange-500/20">
                            <div className="flex items-center space-x-2">
                              <span className="text-orange-400 text-sm">📊</span>
                              <div>
                                <p className="text-orange-200 text-xs font-semibold">Status Atual</p>
                                <p className="text-orange-300/80 text-xs">"Imortalizado"</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Glow effect on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500/0 to-orange-500/0 group-hover:from-red-500/20 group-hover:to-orange-500/20 rounded-2xl transition-all duration-500 pointer-events-none"></div>
                  </div>
                </div>

                {/* Card do Pior KDA Registrado */}
                {worstKDA && (
                  <div className="relative max-w-lg w-full mx-auto">
                    {/* Background with animated gradients */}
                    <div className="absolute inset-0 bg-gradient-to-br from-red-900/90 via-orange-900/90 to-red-800/90 rounded-2xl blur-sm"></div>
                    <div className="absolute inset-0 bg-gradient-to-tr from-red-800/50 via-orange-800/50 to-red-700/50 rounded-2xl animate-pulse"></div>
                    
                    {/* Main card */}
                    <div className="relative bg-gradient-to-br from-red-900/95 via-orange-900/95 to-red-800/95 backdrop-blur-md rounded-2xl border-2 border-red-500/60 shadow-2xl shadow-red-500/30 overflow-hidden group animate-shame-glow hover:scale-105 transition-transform duration-500">
                      
                      {/* Floating particles */}
                      <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        {[...Array(8)].map((_, i) => (
                          <div
                            key={i}
                            className="absolute w-1 h-1 bg-red-400/60 rounded-full animate-floating-particle"
                            style={{
                              left: `${Math.random() * 100}%`,
                              top: `${Math.random() * 100}%`,
                              animationDelay: `${Math.random() * 3}s`,
                              animationDuration: `${3 + Math.random() * 2}s`
                            }}
                          ></div>
                        ))}
                      </div>

                      {/* Header section */}
                      <div className="relative z-10 bg-gradient-to-r from-red-800/80 to-orange-800/80 p-4 border-b-2 border-red-500/40 animate-degradation-pulse">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                            <span className="text-white text-sm font-bold">⚔️</span>
                          </div>
                          <h3 className="text-lg font-bold text-red-100 uppercase tracking-wide">
                            Pior KDA Registrado
                          </h3>
                          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                            <span className="text-white text-sm font-bold">⚔️</span>
                          </div>
                        </div>
                      </div>

                      {/* Player info section */}
                      <div className="relative z-10 p-6">
                        {/* Avatar section with robust fallback */}
                        <div className="flex flex-col items-center mb-6">
                          <div className="relative mb-4">
                            {/* Animated rings */}
                            <div className="absolute -inset-8 border-2 border-red-500/30 rounded-full animate-spin" style={{ animationDuration: '8s' }}></div>
                            <div className="absolute -inset-6 border-2 border-orange-500/40 rounded-full animate-spin" style={{ animationDuration: '6s', animationDirection: 'reverse' }}></div>
                            <div className="absolute -inset-4 border-2 border-red-400/50 rounded-full animate-pulse"></div>
                            
                            {/* Avatar container */}
                            <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-red-500 to-orange-600 p-1 shadow-2xl shadow-red-500/50">
                              <div className="w-full h-full rounded-full bg-slate-900 p-1 overflow-hidden">
                                <div 
                                  className="cursor-pointer w-full h-full" 
                                  onClick={() => {
                                    const player = players.find(p => p.id === worstKDA.playerId);
                                    if (player) setSelectedPlayer(player);
                                  }}
                                >
                                  <PlayerAvatar 
                                    playerName={worstKDA.playerName}
                                    playerAvatar={worstKDA.playerAvatar}
                                    size="w-full h-full"
                                    className="rounded-full object-cover filter grayscale hover:grayscale-0 transition-all duration-500 contrast-110 hover:scale-105"
                                  />
                                </div>
                              </div>
                            </div>
                            
                            {/* Shame badge */}
                            <div className="absolute -bottom-2 -right-2 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full border-2 border-red-400 shadow-lg animate-shame-badge">
                              FEEDS
                            </div>
                          </div>
                          
                          {/* Player name */}
                          <h3 className="text-2xl font-bold text-red-100 mb-2 text-center">
                            {worstKDA.playerName}
                          </h3>
                          <p className="text-red-300/80 text-sm font-semibold italic mb-4">
                            "O Mestre dos Feeds"
                          </p>
                        </div>

                        {/* Stats grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                          {/* KDA card */}
                          <div className="bg-gradient-to-br from-red-800/60 to-orange-800/60 rounded-xl p-4 border border-red-500/30 text-center">
                            <div className="text-lg font-bold text-green-200 mb-1">
                              {worstKDA.kills}
                            </div>
                            <div className="text-xs text-green-300/80 uppercase tracking-widest font-semibold">
                              Kills
                            </div>
                          </div>
                          
                          <div className="bg-gradient-to-br from-orange-800/60 to-red-800/60 rounded-xl p-4 border border-orange-500/30 text-center">
                            <div className="text-lg font-bold text-red-200 mb-1">
                              {worstKDA.deaths}
                            </div>
                            <div className="text-xs text-red-300/80 uppercase tracking-widest font-semibold">
                              Deaths
                            </div>
                          </div>
                          
                          <div className="bg-gradient-to-br from-red-800/60 to-orange-800/60 rounded-xl p-4 border border-blue-500/30 text-center">
                            <div className="text-lg font-bold text-blue-200 mb-1">
                              {worstKDA.assists}
                            </div>
                            <div className="text-xs text-blue-300/80 uppercase tracking-widest font-semibold">
                              Assists
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                          {/* KDA Ratio card */}
                          <div className="bg-gradient-to-br from-red-800/60 to-orange-800/60 rounded-xl p-4 border border-red-500/30 text-center">
                            <div className="text-3xl font-bold text-red-200 mb-1">
                              {worstKDA.kdRatio.toFixed(2)}
                            </div>
                            <div className="text-xs text-red-300/80 uppercase tracking-widest font-semibold">
                              KDA Ratio
                            </div>
                          </div>
                          
                          {/* Date card */}
                          <div className="bg-gradient-to-br from-orange-800/60 to-red-800/60 rounded-xl p-4 border border-orange-500/30 text-center">
                            <div className="text-sm font-bold text-orange-200 mb-1">
                              {new Date(worstKDA.matchDate).toLocaleDateString('pt-BR')}
                            </div>
                            <div className="text-xs text-orange-300/80 uppercase tracking-widest font-semibold">
                              Data do Feito
                            </div>
                          </div>
                        </div>

                        {/* Shame messages */}
                        <div className="space-y-3">
                          <div className="bg-black/30 rounded-lg p-4 border border-red-500/20">
                            <div className="flex items-start space-x-3">
                              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-white text-xs font-bold">!</span>
                              </div>
                              <div>
                                <p className="text-red-200 text-sm font-semibold mb-1">Alerta do Sistema</p>
                                <p className="text-red-300/90 text-xs">
                                  KDA tão épico que quebrou os limites conhecidos da matemática. Um feito que entrará para a história.
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="bg-red-900/30 rounded-lg p-3 border border-red-500/20">
                              <div className="flex items-center space-x-2">
                                <span className="text-red-400 text-sm">💀</span>
                                <div>
                                  <p className="text-red-200 text-xs font-semibold">Conquista Desbloqueada</p>
                                  <p className="text-red-300/80 text-xs">"Feed Master"</p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="bg-orange-900/30 rounded-lg p-3 border border-orange-500/20">
                              <div className="flex items-center space-x-2">
                                <span className="text-orange-400 text-sm">⚔️</span>
                                <div>
                                  <p className="text-orange-200 text-xs font-semibold">Status Atual</p>
                                  <p className="text-orange-300/80 text-xs">"Legendary Feeder"</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Glow effect on hover */}
                      <div className="absolute inset-0 bg-gradient-to-br from-red-500/0 to-orange-500/0 group-hover:from-red-500/20 group-hover:to-orange-500/20 rounded-2xl transition-all duration-500 pointer-events-none"></div>
                    </div>
                  </div>
                )}
              </div>
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

      {/* Modal da Página Individual do Jogador */}
      {selectedPlayer && (
        <PlayerDetailPage
          player={selectedPlayer}
          allPlayers={players}
          onClose={() => setSelectedPlayer(null)}
        />
      )}

      {/* Modal do Histórico de Partidas */}
      <MatchHistoryModal
        isOpen={showMatchHistory}
        onClose={() => setShowMatchHistory(false)}
        onPlayerClick={setSelectedPlayer}
        players={players}
      />
    </div>
  );
}

export default App;