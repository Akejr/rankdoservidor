import React, { useMemo } from 'react';
import { Player, MatchFormData, Match, MatchParticipant } from './types';
import { RankingCard } from './components/RankingCard';
import { AdminPanel } from './components/AdminPanel';
import { useSupabase } from './hooks/useSupabase';
import { SupabaseTest } from './components/SupabaseTest';
import { PasswordPrompt } from './components/PasswordPrompt';
import { Crown, Gamepad2, Swords, Loader2, AlertCircle, RefreshCw, Shield, Zap, Star, Target, Heart } from 'lucide-react';

function App() {
  const { players, laneLeaders, serverBagre, loading, error, addMatch, resetPlayerStats, refetch } = useSupabase();
  const [showResetPassword, setShowResetPassword] = React.useState(false);

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
    }
  }, [serverBagre]);

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
            <p className="text-sm sm:text-base md:text-lg text-blue-400/80 mt-1 md:mt-2">Temporada 2024 • Fenda do Invocador</p>
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
                                 className="w-14 h-14 rounded-full shadow-2xl relative z-30"
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
              <div className="text-xs sm:text-sm text-gray-400 bg-gray-900/50 px-3 sm:px-4 py-2 rounded-lg border border-gray-700/50">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Conectado ao Supabase</span>
                </div>
              </div>

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
              <div className="flex items-center justify-center space-x-3 mb-6 md:mb-8">
                <div className="w-1 h-6 sm:h-8 bg-gradient-to-b from-red-500 to-orange-600"></div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">BAGRE DO SERVIDOR</h2>
                <div className="w-1 h-6 sm:h-8 bg-gradient-to-b from-red-500 to-orange-600"></div>
              </div>
              
              <div className="flex justify-center">
                <div 
                  className="relative bg-gradient-to-br from-red-900/60 via-orange-900/60 to-red-800/60 rounded-lg md:rounded-xl p-6 md:p-8 border-4 border-red-500/60 text-center transition-all duration-500 hover:scale-105 hover:shadow-2xl shadow-red-500/20 backdrop-blur-md overflow-hidden group max-w-md"
                  style={{
                    clipPath: 'polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 15px 100%, 0 calc(100% - 15px))',
                  }}
                >
                  {/* Shame glow effect */}
                  <div className="absolute inset-0 bg-red-500/20 rounded-lg md:rounded-xl blur-2xl opacity-0 group-hover:opacity-50 transition-opacity duration-500"></div>
                  
                  {/* Shame banner */}
                  <div className="relative mb-4">
                    <div className="bg-gradient-to-r from-transparent via-red-500/30 to-transparent h-8 flex items-center justify-center border-y border-red-500/50">
                      <div className="text-sm font-bold text-red-300 uppercase tracking-wider drop-shadow-md" style={{ fontFamily: 'serif' }}>
                        💀 Pior Performance 💀
                      </div>
                    </div>
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-red-500/50"></div>
                  </div>

                  {/* Shame icon */}
                  <div className="relative z-10 mb-4">
                    <div className="relative inline-block">
                      <div className="text-4xl animate-bounce">🐟</div>
                      <div className="absolute inset-0 bg-red-500/30 rounded-full blur-lg animate-pulse"></div>
                    </div>
                  </div>

                  {/* Player avatar with shame frame */}
                  <div className="relative z-10 mb-4">
                    <div className="relative inline-block">
                      <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-full p-0.5 animate-pulse">
                        <div className="bg-slate-900 rounded-full p-0.5 flex items-center justify-center w-22 h-22">
                          {serverBagre.playerAvatar ? (
                            <img
                              src={serverBagre.playerAvatar}
                              alt={serverBagre.playerName}
                              className="w-20 h-20 rounded-full shadow-2xl grayscale hover:grayscale-0 transition-all duration-300"
                              onError={(e) => {
                                console.log('Erro ao carregar avatar do bagre, usando fallback');
                                (e.target as HTMLImageElement).style.display = 'none';
                                const parent = (e.target as HTMLImageElement).parentElement;
                                if (parent) {
                                  parent.innerHTML = `
                                    <div class="w-20 h-20 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-2xl font-bold text-white shadow-2xl">
                                      ${serverBagre.playerName.charAt(0).toUpperCase()}
                                    </div>
                                  `;
                                }
                              }}
                            />
                          ) : (
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-2xl font-bold text-white shadow-2xl">
                              {serverBagre.playerName.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-red-500/20 rounded-full blur-md opacity-50 animate-pulse"></div>
                    </div>
                  </div>

                  {/* Player name */}
                  <div className="relative z-10 mb-3">
                    <p className="text-red-100 font-bold text-lg drop-shadow-md group-hover:text-red-50 transition-colors" style={{ fontFamily: 'serif', letterSpacing: '0.05em' }}>
                      {serverBagre.playerName}
                    </p>
                    <div className="h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent mt-1"></div>
                  </div>

                  {/* Worst rating */}
                  <div className="relative z-10 mb-2">
                    <div className="text-red-300 font-bold text-2xl drop-shadow-lg group-hover:scale-110 transition-transform" style={{ fontFamily: 'serif' }}>
                      {serverBagre.worstRating.toFixed(1)}
                    </div>
                    <div className="text-xs text-red-200/80 uppercase tracking-widest font-semibold drop-shadow-sm" style={{ fontFamily: 'serif' }}>
                      Nota da Vergonha
                    </div>
                  </div>

                  {/* Date */}
                  <div className="text-xs text-red-300/60 mt-2">
                    {new Date(serverBagre.matchDate).toLocaleDateString('pt-BR')}
                  </div>

                  {/* Decorative elements */}
                  <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-red-500/40"></div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-red-500/40"></div>
                  
                  {/* Shame particles */}
                  <div className="absolute top-2 right-2 w-1 h-1 bg-red-400 rounded-full animate-ping"></div>
                  <div className="absolute bottom-3 left-3 w-1 h-1 bg-orange-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
                </div>
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
    </div>
  );
}

export default App;