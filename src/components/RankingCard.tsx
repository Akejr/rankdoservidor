import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Player } from '../types';
import { Crown } from 'lucide-react';
import { Trophy, TrendingUp, TrendingDown, Sword, Shield, Target } from 'lucide-react';

interface RankingCardProps {
  player: Player;
  rank: number;
  onPlayerClick?: (player: Player) => void;
  mvpCount?: number;
  topPlayerScore?: number;
  globalAverage?: number;
}

// Componente de Tooltip
const Tooltip: React.FC<{ 
  children: React.ReactNode; 
  content: string; 
  show: boolean; 
  targetRef: React.RefObject<HTMLElement> 
}> = ({ children, content, show, targetRef }) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (show && targetRef.current) {
      const rect = targetRef.current.getBoundingClientRect();
      setPosition({
        top: rect.top - 100, // Mais espaço para o texto da piada
        left: rect.left + rect.width / 2 // Centralizado
      });
    }
  }, [show, targetRef]);

  if (!show) return <>{children}</>;

  const isImpossible = content === 'impossible';

  return (
    <>
      {children}
      {createPortal(
        <div 
          className="fixed pointer-events-none z-[9999] transition-opacity duration-300"
          style={{ 
            top: position.top, 
            left: position.left,
            transform: 'translateX(-50%)'
          }}
        >
          <div className={`text-white text-sm px-4 py-3 rounded-lg border shadow-2xl ${
            isImpossible 
              ? 'bg-red-900 border-red-500 max-w-xs' 
              : 'bg-gray-900 border-gray-700 whitespace-nowrap'
          }`}>
            <div className="text-center">
              {isImpossible ? (
                <>
                  <div className="font-semibold text-red-400 mb-2">🙏 MISSÃO IMPOSSÍVEL 🙏</div>
                  <div className="text-yellow-300 text-xs leading-relaxed">
                    Nem com nota 10 você passa o #1!<br/>
                    Só rezando mesmo... 😅<br/>
                    <span className="text-red-300">Ou esperar ele jogar mal!</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="font-semibold text-yellow-400 mb-1">Para superar o #1:</div>
                  <div className="font-bold text-green-400 text-lg">{content}/10</div>
                  <div className="text-xs text-gray-300">na próxima partida</div>
                </>
              )}
            </div>
            <div className={`absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent ${
              isImpossible ? 'border-t-red-900' : 'border-t-gray-900'
            }`}></div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export const RankingCard: React.FC<RankingCardProps> = ({ player, rank, onPlayerClick, mvpCount = 0, topPlayerScore, globalAverage }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const scoreRefMobile = useRef<HTMLSpanElement>(null);
  const scoreRefDesktop = useRef<HTMLSpanElement>(null);

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1: 
        return {
          bg: 'bg-gradient-to-r from-yellow-900/40 via-yellow-800/30 to-yellow-900/40',
          border: 'border-yellow-400/50 shadow-yellow-400/20',
          glow: 'shadow-2xl shadow-yellow-400/10',
          text: 'text-yellow-300'
        };
      case 2: 
        return {
          bg: 'bg-gradient-to-r from-gray-800/40 via-gray-700/30 to-gray-800/40',
          border: 'border-gray-400/50 shadow-gray-400/20',
          glow: 'shadow-2xl shadow-gray-400/10',
          text: 'text-gray-300'
        };
      case 3: 
        return {
          bg: 'bg-gradient-to-r from-amber-900/40 via-amber-800/30 to-amber-900/40',
          border: 'border-amber-500/50 shadow-amber-500/20',
          glow: 'shadow-2xl shadow-amber-500/10',
          text: 'text-amber-400'
        };
      default: 
        return {
          bg: 'bg-gradient-to-r from-slate-900/60 via-slate-800/40 to-slate-900/60',
          border: 'border-slate-600/30',
          glow: 'shadow-xl shadow-black/20',
          text: 'text-blue-300'
        };
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank <= 3) {
      return <Trophy className="w-6 h-6" />;
    }
    return null;
  };

  const getPerformanceIndicator = (rating: number) => {
    if (rating >= 7) return { icon: TrendingUp, color: 'text-green-400' };
    if (rating <= 4) return { icon: TrendingDown, color: 'text-red-400' };
    return null;
  };

  const style = getRankStyle(rank);
  const performance = getPerformanceIndicator(player.averageRating);
  const kdRatio = player.averageKDA.deaths > 0 ? (player.averageKDA.kills / player.averageKDA.deaths).toFixed(2) : player.averageKDA.kills.toFixed(2);

  // Calcular diferença de pontos para superar o top 1
  const calculateScoreDifference = (): number | string | null => {
    if (!topPlayerScore || rank === 1 || !player.bayesianRating) return null;
    
    const currentScore = player.bayesianRating;
    const scoreDifference = topPlayerScore - currentScore;
    
    // Se a diferença for muito grande (mais que 3 pontos), é quase impossível
    if (scoreDifference > 3) {
      return 'impossible';
    }
    
    return Math.round(scoreDifference * 100) / 100; // Arredondar para 2 casas decimais
  };

  const scoreDifference: number | string | null = calculateScoreDifference();

  const getTooltipContent = () => {
    if (scoreDifference === null) return '';
    
    if (scoreDifference === 'impossible') {
      return '🙏 MISSÃO IMPOSSÍVEL 🙏 A diferença é muito grande! Só rezando mesmo... 😅';
    }
    
    return `Você precisa de ${scoreDifference} pontos a mais no score para passar o #1`;
  };

  return (
    <div className={`${style.bg} ${style.border} ${style.glow} border-2 rounded-2xl p-3 sm:p-4 md:p-6 mb-2 md:mb-3 hover:scale-[1.02] transition-all duration-500 backdrop-blur-sm relative overflow-hidden group`}>
      {/* Rank Glow Effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className={`absolute inset-0 ${style.bg} blur-xl`}></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        {/* Mobile Layout */}
        <div className="flex md:hidden items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Rank Number */}
            <div className={`text-2xl sm:text-3xl font-bold ${style.text} relative flex items-center space-x-1`}>
              <span>#{rank}</span>
              {getRankIcon(rank) && <div className="w-4 h-4">{getRankIcon(rank)}</div>}
            </div>
            
            {/* Player Avatar */}
            <div className="relative">
              <img 
                src={player.avatar} 
                alt={player.name}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-blue-500/60 shadow-lg cursor-pointer hover:scale-110 transition-transform duration-200"
                onClick={() => onPlayerClick?.(player)}
              />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-400 rounded-full border border-black shadow-lg animate-pulse"></div>
              {rank <= 3 && (
                <div className={`absolute -top-1 -left-1 w-5 h-5 ${style.bg} ${style.border} border rounded-full flex items-center justify-center`}>
                  <span className={`text-xs font-bold ${style.text}`}>{rank}</span>
                </div>
              )}
            </div>
            
            {/* Player Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg sm:text-xl font-bold text-white truncate">{player.name}</h3>
              <div className="flex items-center space-x-3 flex-wrap">
                <p className="text-xs text-gray-400">{player.totalMatches} {player.totalMatches === 1 ? 'partida' : 'partidas'}</p>
                <div className={`flex items-center space-x-1 px-2 py-0.5 rounded-full border shadow-sm transition-all duration-300 relative ${
                  mvpCount >= 10 
                    ? 'bg-gradient-to-r from-yellow-500/40 to-amber-400/40 border-yellow-300/50 shadow-yellow-500/20 animate-pulse' 
                    : mvpCount >= 5 
                    ? 'bg-gradient-to-r from-yellow-700/40 to-amber-700/40 border-yellow-400/40 shadow-yellow-500/10' 
                    : 'bg-yellow-900/30 border-yellow-500/30'
                }`}>
                  {mvpCount >= 10 && (
                    <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
                  )}
                  <Crown className={`w-3 h-3 ${
                    mvpCount >= 10 ? 'text-yellow-200' : mvpCount >= 5 ? 'text-yellow-300' : 'text-yellow-400'
                  }`} />
                  <span className={`text-xs font-bold ${
                    mvpCount >= 10 ? 'text-yellow-100' : mvpCount >= 5 ? 'text-yellow-200' : 'text-yellow-400'
                  }`}>{mvpCount}</span>
                </div>
                <div className="flex items-center space-x-2 text-xs bg-slate-800/30 px-2 py-1 rounded-lg border border-slate-600/30">
                  <div className="flex items-center space-x-1">
                    <span className="text-green-400 font-bold">K</span>
                    <span className="text-white font-semibold">{player.totalKills}</span>
                  </div>
                  <div className="w-px h-3 bg-gray-600"></div>
                  <div className="flex items-center space-x-1">
                    <span className="text-red-400 font-bold">M</span>
                    <span className="text-white font-semibold">{player.totalDeaths}</span>
                  </div>
                  <div className="w-px h-3 bg-gray-600"></div>
                  <div className="flex items-center space-x-1">
                    <span className="text-blue-400 font-bold">A</span>
                    <span className="text-white font-semibold">{player.totalAssists}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Stats */}
          <div className="flex flex-col items-end space-y-1">
            <div className="flex items-center space-x-1">
              <Tooltip 
                content={getTooltipContent()} 
                show={showTooltip && !!scoreDifference} 
                targetRef={scoreRefMobile}
              >
                <span 
                  ref={scoreRefMobile}
                  className="text-xl sm:text-2xl font-bold text-white cursor-help"
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                >
                  {player.bayesianRating ? player.bayesianRating.toFixed(1) : player.averageRating.toFixed(1)}
                </span>
              </Tooltip>
              {performance && (
                <performance.icon className={`w-4 h-4 ${performance.color}`} />
              )}
            </div>
            {player.bayesianRating && (
              <div className="text-xs text-gray-400">
                Média Geral: {player.averageRating.toFixed(1)}
              </div>
            )}

            <div className="flex items-center space-x-1 text-xs">
              <span className="text-green-400 font-semibold">{player.averageKDA.kills.toFixed(1)}</span>
              <span className="text-gray-500">/</span>
              <span className="text-red-400 font-semibold">{player.averageKDA.deaths.toFixed(1)}</span>
              <span className="text-gray-500">/</span>
              <span className="text-blue-400 font-semibold">{player.averageKDA.assists.toFixed(1)}</span>
            </div>
            <div className="flex items-center space-x-1 text-xs bg-slate-800/30 px-2 py-1 rounded border border-slate-600/30">
              <div className="flex items-center space-x-1">
                <span className="text-green-400 font-bold text-xs">K</span>
                <span className="text-white font-semibold text-xs">{player.totalKills}</span>
              </div>
              <div className="w-px h-2 bg-gray-600"></div>
              <div className="flex items-center space-x-1">
                <span className="text-red-400 font-bold text-xs">M</span>
                <span className="text-white font-semibold text-xs">{player.totalDeaths}</span>
              </div>
              <div className="w-px h-2 bg-gray-600"></div>
              <div className="flex items-center space-x-1">
                <span className="text-blue-400 font-bold text-xs">A</span>
                <span className="text-white font-semibold text-xs">{player.totalAssists}</span>
              </div>
            </div>
            <div className="text-xs text-purple-300 font-semibold">
              KD: {kdRatio}
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:flex items-center justify-between">
        <div className="flex items-center space-x-6">
          {/* Rank Number */}
          <div className="flex items-center space-x-3">
            <div className={`text-4xl font-bold ${style.text} relative`}>
              #{rank}
              {rank <= 3 && (
                <div className="absolute -inset-2 bg-gradient-to-r from-transparent via-current to-transparent opacity-20 blur-sm"></div>
              )}
            </div>
            {getRankIcon(rank)}
          </div>
          
          {/* Player Avatar */}
          <div className="relative">
            <div className="relative">
              <img 
                src={player.avatar} 
                alt={player.name}
                className="w-16 h-16 rounded-full border-3 border-blue-500/60 shadow-lg cursor-pointer hover:scale-110 transition-transform duration-200"
                onClick={() => onPlayerClick?.(player)}
              />
              <div className="absolute inset-0 w-16 h-16 rounded-full bg-gradient-to-tr from-blue-500/20 to-purple-500/20"></div>
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-black shadow-lg animate-pulse"></div>
            {/* Rank Badge */}
            {rank <= 3 && (
              <div className={`absolute -top-2 -left-2 w-6 h-6 ${style.bg} ${style.border} border rounded-full flex items-center justify-center`}>
                <span className={`text-xs font-bold ${style.text}`}>{rank}</span>
              </div>
            )}
          </div>
          
          {/* Player Info */}
          <div>
            <h3 className="text-2xl font-bold text-white mb-1">{player.name}</h3>
            <div className="flex items-center space-x-4 text-sm flex-wrap">
              <span className="text-gray-400">{player.totalMatches} {player.totalMatches === 1 ? 'partida' : 'partidas'}</span>
              <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
              <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border shadow-lg transition-all duration-300 relative ${
                mvpCount >= 10 
                  ? 'bg-gradient-to-r from-yellow-500/50 to-amber-400/50 border-yellow-300/60 shadow-yellow-500/30 animate-pulse' 
                  : mvpCount >= 5
                  ? 'bg-gradient-to-r from-yellow-600/50 to-amber-500/50 border-yellow-400/50 shadow-yellow-500/20'
                  : 'bg-gradient-to-r from-yellow-900/40 to-amber-900/40 border-yellow-500/40'
              }`}>
                {mvpCount >= 10 && (
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-amber-400/20 rounded-full blur-sm"></div>
                )}
                <Crown className={`w-4 h-4 relative z-10 ${
                  mvpCount >= 10 ? 'text-yellow-200' : mvpCount >= 5 ? 'text-yellow-300' : 'text-yellow-400'
                }`} />
                <span className={`font-bold relative z-10 ${
                  mvpCount >= 10 ? 'text-yellow-100 text-lg' : mvpCount >= 5 ? 'text-yellow-200' : 'text-yellow-400'
                }`}>{mvpCount}</span>
                <span className={`text-xs font-semibold uppercase tracking-wide relative z-10 ${
                  mvpCount >= 10 ? 'text-yellow-200' : mvpCount >= 5 ? 'text-yellow-300' : 'text-yellow-300'
                }`}>{mvpCount === 1 ? 'MVP' : 'MVPs'}</span>
                {mvpCount >= 10 && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
                )}
              </div>
              <div className="flex items-center space-x-3 text-sm bg-slate-800/30 px-3 py-1.5 rounded-lg border border-slate-600/30">
                <div className="flex items-center space-x-1">
                  <span className="text-green-400 font-bold">K</span>
                  <span className="text-white font-semibold">{player.totalKills}</span>
                </div>
                <div className="w-px h-4 bg-gray-600"></div>
                <div className="flex items-center space-x-1">
                  <span className="text-red-400 font-bold">M</span>
                  <span className="text-white font-semibold">{player.totalDeaths}</span>
                </div>
                <div className="w-px h-4 bg-gray-600"></div>
                <div className="flex items-center space-x-1">
                  <span className="text-blue-400 font-bold">A</span>
                  <span className="text-white font-semibold">{player.totalAssists}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

          {/* Desktop Stats */}
        <div className="flex items-center space-x-8">
          {/* Average Rating */}
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-1">
              <Tooltip 
                content={getTooltipContent()} 
                show={showTooltip && !!scoreDifference} 
                targetRef={scoreRefDesktop}
              >
                <span 
                  ref={scoreRefDesktop}
                  className="text-3xl font-bold text-white cursor-help"
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                >
                  {player.bayesianRating ? player.bayesianRating.toFixed(1) : player.averageRating.toFixed(1)}
                </span>
              </Tooltip>
              {performance && (
                <performance.icon className={`w-5 h-5 ${performance.color}`} />
              )}
            </div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Score Ajustado</p>
            {player.bayesianRating && (
              <div className="text-xs text-gray-500 mt-1">
                Média Geral: {player.averageRating.toFixed(1)}
              </div>
            )}
          </div>

          {/* KDA */}
          <div className="text-center">
            <div className="flex items-center space-x-1 mb-1">
              <Sword className="w-4 h-4 text-red-400" />
              <span className="text-lg font-bold text-green-400">
                {player.averageKDA.kills.toFixed(1)}
              </span>
              <span className="text-gray-500">/</span>
              <span className="text-lg font-bold text-red-400">
                {player.averageKDA.deaths.toFixed(1)}
              </span>
              <span className="text-gray-500">/</span>
              <span className="text-lg font-bold text-blue-400">
                {player.averageKDA.assists.toFixed(1)}
              </span>
            </div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">K/D/A Médio</p>
          </div>

          {/* KD Ratio */}
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Target className="w-4 h-4 text-purple-400" />
              <span className="text-xl font-bold text-purple-300">
                {kdRatio}
              </span>
            </div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">KD Ratio</p>
          </div>

          {/* Efficiency Badge */}
          <div className="text-center">
            <div className="relative">
              <div className={`w-12 h-12 rounded-full ${style.bg} ${style.border} border flex items-center justify-center`}>
                <Shield className={`w-6 h-6 ${style.text}`} />
              </div>
              {player.averageRating >= 8 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                  <span className="text-xs text-black font-bold">★</span>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mt-1">Elite</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};