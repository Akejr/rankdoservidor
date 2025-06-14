import React from 'react';
import { Player } from '../types';
import { Trophy, TrendingUp, TrendingDown, Sword, Shield, Target } from 'lucide-react';

interface RankingCardProps {
  player: Player;
  rank: number;
}

export const RankingCard: React.FC<RankingCardProps> = ({ player, rank }) => {
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
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-blue-500/60 shadow-lg"
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
              <p className="text-xs text-gray-400">{player.totalMatches} {player.totalMatches === 1 ? 'batalha' : 'batalhas'}</p>
            </div>
          </div>

          {/* Mobile Stats */}
          <div className="flex flex-col items-end space-y-1">
            <div className="flex items-center space-x-1">
              <span className="text-xl sm:text-2xl font-bold text-white">
                {player.averageRating.toFixed(1)}
              </span>
              {performance && (
                <performance.icon className={`w-4 h-4 ${performance.color}`} />
              )}
            </div>
            <div className="flex items-center space-x-1 text-xs">
              <span className="text-green-400 font-semibold">{player.averageKDA.kills.toFixed(1)}</span>
              <span className="text-gray-500">/</span>
              <span className="text-red-400 font-semibold">{player.averageKDA.deaths.toFixed(1)}</span>
              <span className="text-gray-500">/</span>
              <span className="text-blue-400 font-semibold">{player.averageKDA.assists.toFixed(1)}</span>
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
                  className="w-16 h-16 rounded-full border-3 border-blue-500/60 shadow-lg"
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
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <span>{player.totalMatches} {player.totalMatches === 1 ? 'batalha' : 'batalhas'}</span>
                <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
                <span>Invocador Ativo</span>
              </div>
            </div>
          </div>

          {/* Desktop Stats */}
          <div className="flex items-center space-x-8">
            {/* Average Rating */}
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-1">
                <span className="text-3xl font-bold text-white">
                  {player.averageRating.toFixed(1)}
                </span>
                {performance && (
                  <performance.icon className={`w-5 h-5 ${performance.color}`} />
                )}
              </div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Performance</p>
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