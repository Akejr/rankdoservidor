import React from 'react';
import { Player } from '../types';
import { Users, Target, Trophy, TrendingUp, Swords, Shield, Zap, Award } from 'lucide-react';

interface StatsSummaryProps {
  players: Player[];
}

export const StatsSummary: React.FC<StatsSummaryProps> = ({ players }) => {
  const totalMatches = players.reduce((sum, player) => sum + player.totalMatches, 0) / 5;
  const averageRating = players.length > 0 
    ? players.reduce((sum, player) => sum + player.averageRating, 0) / players.length 
    : 0;
  const topPlayer = players.find(p => p.totalMatches > 0) || null;
  const activePlayers = players.filter(p => p.totalMatches > 0).length;

  const stats = [
    {
      icon: Swords,
      label: 'Batalhas Épicas',
      value: Math.floor(totalMatches),
      color: 'from-red-600/20 to-red-700/20',
      border: 'border-red-500/30',
      iconColor: 'text-red-400',
      bgColor: 'bg-red-500/10'
    },
    {
      icon: TrendingUp,
      label: 'Performance Média',
      value: averageRating.toFixed(1),
      color: 'from-green-600/20 to-green-700/20',
      border: 'border-green-500/30',
      iconColor: 'text-green-400',
      bgColor: 'bg-green-500/10'
    },
    {
      icon: Shield,
      label: 'Invocadores Ativos',
      value: activePlayers,
      color: 'from-blue-600/20 to-blue-700/20',
      border: 'border-blue-500/30',
      iconColor: 'text-blue-400',
      bgColor: 'bg-blue-500/10'
    },
    {
      icon: Award,
      label: 'Campeão Atual',
      value: topPlayer ? topPlayer.name : 'N/A',
      color: 'from-yellow-600/20 to-yellow-700/20',
      border: 'border-yellow-500/30',
      iconColor: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
      {stats.map((stat, index) => (
        <div 
          key={index}
          className={`bg-gradient-to-br ${stat.color} border ${stat.border} rounded-2xl p-6 backdrop-blur-sm hover:scale-105 transition-all duration-300 relative overflow-hidden group`}
        >
          {/* Background Glow */}
          <div className={`absolute inset-0 ${stat.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl`}></div>
          
          {/* Content */}
          <div className="relative z-10 flex items-center space-x-4">
            <div className={`p-3 ${stat.bgColor} rounded-xl relative`}>
              <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
              <div className={`absolute inset-0 ${stat.bgColor} rounded-xl blur-lg opacity-50`}></div>
            </div>
            <div>
              <p className="text-sm text-gray-400 uppercase tracking-wide font-semibold">{stat.label}</p>
              <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-white/5 to-transparent rounded-full -translate-y-10 translate-x-10"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-white/5 to-transparent rounded-full translate-y-8 -translate-x-8"></div>
        </div>
      ))}
    </div>
  );
};