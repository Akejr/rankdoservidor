import React, { useState, useEffect } from 'react';
import { Player, Lane } from '../types';
import { PlayerAvatar } from './PlayerAvatar';
import { X, TrendingUp, TrendingDown, Target, Crown, Swords, Shield, Users, Zap, Star, Award } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PlayerDetailPageProps {
  player: Player;
  allPlayers: Player[];
  onClose: () => void;
}

interface MatchHistory {
  id: string;
  date: string;
  rating: number;
  kills: number;
  deaths: number;
  assists: number;
  lane: Lane;
}

interface LaneRanking {
  lane: Lane;
  position: number;
  totalPlayers: number;
  averageRating: number;
}

interface Partnership {
  partnerName: string;
  partnerAvatar: string;
  lane: Lane;
  matchesPlayed: number;
  averageRating: number;
  goodPerformances: number;
  badPerformances: number;
}

export const PlayerDetailPage: React.FC<PlayerDetailPageProps> = ({ player, allPlayers, onClose }) => {
  const [matchHistory, setMatchHistory] = useState<MatchHistory[]>([]);
  const [laneRankings, setLaneRankings] = useState<LaneRanking[]>([]);
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlayerDetails();
  }, [player.id]);

  const fetchPlayerDetails = async () => {
    try {
      setLoading(true);
      
      // Buscar histórico de partidas
      const { data: matches, error: matchesError } = await supabase
        .from('match_participants')
        .select(`
          rating,
          kills,
          deaths,
          assists,
          lane,
          created_at,
          match_id,
          matches (
            match_date
          )
        `)
        .eq('player_id', player.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (matchesError) throw matchesError;

      const formattedMatches: MatchHistory[] = matches?.map(match => ({
        id: match.match_id,
        date: (match.matches as any)?.match_date || match.created_at,
        rating: match.rating,
        kills: match.kills,
        deaths: match.deaths,
        assists: match.assists,
        lane: match.lane
      })) || [];

      setMatchHistory(formattedMatches);

      // Calcular rankings por lane
      await calculateLaneRankings();
      
      // Calcular parcerias
      await calculatePartnerships();

    } catch (error) {
      console.error('Erro ao buscar detalhes do jogador:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateLaneRankings = async () => {
    const lanes: Lane[] = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUP'];
    const rankings: LaneRanking[] = [];

    for (const lane of lanes) {
      const { data: laneData, error } = await supabase
        .from('match_participants')
        .select('player_id, rating')
        .eq('lane', lane);

      if (error || !laneData) continue;

      const playerAverages = new Map<string, { totalRating: number; matches: number }>();
      
      laneData.forEach(match => {
        const current = playerAverages.get(match.player_id) || { totalRating: 0, matches: 0 };
        playerAverages.set(match.player_id, {
          totalRating: current.totalRating + match.rating,
          matches: current.matches + 1
        });
      });

      const averages = Array.from(playerAverages.entries())
        .map(([playerId, stats]) => ({
          playerId,
          averageRating: stats.totalRating / stats.matches,
          matches: stats.matches
        }))
        .filter(p => p.matches >= 2)
        .sort((a, b) => b.averageRating - a.averageRating);

      const playerIndex = averages.findIndex(p => p.playerId === player.id);
      
      if (playerIndex !== -1) {
        rankings.push({
          lane,
          position: playerIndex + 1,
          totalPlayers: averages.length,
          averageRating: averages[playerIndex].averageRating
        });
      }
    }

    setLaneRankings(rankings);
  };

  const calculatePartnerships = async () => {
    const { data: playerMatches, error } = await supabase
      .from('match_participants')
      .select(`
        match_id,
        lane,
        rating,
        matches (
          match_date
        )
      `)
      .eq('player_id', player.id);

    if (error || !playerMatches) return;

    const partnerStats = new Map<string, Partnership>();

    for (const match of playerMatches) {
      const { data: teammates, error: teammatesError } = await supabase
        .from('match_participants')
        .select(`
          player_id,
          lane,
          players (
            name,
            avatar
          )
        `)
        .eq('match_id', match.match_id)
        .neq('player_id', player.id);

      if (teammatesError || !teammates) continue;

      teammates.forEach(teammate => {
        const key = `${teammate.player_id}-${teammate.lane}`;
        const existing = partnerStats.get(key);
        
        if (existing) {
          existing.matchesPlayed++;
          existing.averageRating = (existing.averageRating * (existing.matchesPlayed - 1) + match.rating) / existing.matchesPlayed;
          if (match.rating >= 8) existing.goodPerformances++;
          if (match.rating <= 4) existing.badPerformances++;
        } else {
          partnerStats.set(key, {
            partnerName: (teammate.players as any)?.name || 'Desconhecido',
            partnerAvatar: (teammate.players as any)?.avatar || '',
            lane: teammate.lane,
            matchesPlayed: 1,
            averageRating: match.rating,
            goodPerformances: match.rating >= 8 ? 1 : 0,
            badPerformances: match.rating <= 4 ? 1 : 0
          });
        }
      });
    }

    setPartnerships(Array.from(partnerStats.values()).filter(p => p.matchesPlayed >= 3));
  };

  const getLaneIcon = (lane: Lane) => {
    const icons = {
      TOP: Shield,
      JUNGLE: Zap,
      MID: Star,
      ADC: Target,
      SUP: Users
    };
    return icons[lane];
  };

  const getLaneColor = (lane: Lane) => {
    const colors = {
      TOP: 'text-green-400',
      JUNGLE: 'text-purple-400',
      MID: 'text-yellow-400',
      ADC: 'text-red-400',
      SUP: 'text-blue-400'
    };
    return colors[lane];
  };

  const getRankingColor = (position: number, total: number) => {
    const percentage = position / total;
    if (percentage <= 0.1) return 'text-yellow-400';
    if (percentage <= 0.3) return 'text-green-400';
    if (percentage <= 0.7) return 'text-blue-400';
    return 'text-gray-400';
  };

  const generateTips = () => {
    const tips: string[] = [];

    partnerships.forEach(partner => {
      if (partner.goodPerformances >= 3) {
        tips.push(`🔥 ${player.name} joga excepcionalmente bem com ${partner.partnerName} na ${partner.lane}! ${partner.goodPerformances} performances excelentes juntos.`);
      }
    });

    partnerships.forEach(partner => {
      if (partner.badPerformances >= 3) {
        tips.push(`⚠️ ${player.name} tem dificuldades quando joga com ${partner.partnerName} na ${partner.lane}. ${partner.badPerformances} performances fracas juntas.`);
      }
    });

    laneRankings.forEach(ranking => {
      if (ranking.position <= 3) {
        tips.push(`👑 ${player.name} está no TOP 3 de ${ranking.lane} no servidor! Posição #${ranking.position} de ${ranking.totalPlayers}.`);
      }
    });

    return tips;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-lg z-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-lg z-50 overflow-y-auto">
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="relative bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 rounded-2xl border border-slate-700/50 p-8 mb-8">
            <button
              onClick={onClose}
              className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-8 h-8" />
            </button>

            <div className="flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-8">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-1">
                  <PlayerAvatar
                    playerName={player.name}
                    playerAvatar={player.avatar}
                    size="w-full h-full"
                    className="rounded-full"
                  />
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-400 rounded-full border-4 border-slate-900 animate-pulse"></div>
              </div>

              <div className="text-center md:text-left">
                <h1 className="text-4xl font-bold text-white mb-2">{player.name}</h1>
                <p className="text-xl text-gray-400 mb-4">Invocador da Fenda</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">
                      {player.bayesianRating ? player.bayesianRating.toFixed(1) : player.averageRating.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-400 uppercase">Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{player.totalMatches}</div>
                    <div className="text-xs text-gray-400 uppercase">Partidas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">
                      {player.averageKDA.deaths > 0 ? (player.averageKDA.kills / player.averageKDA.deaths).toFixed(2) : player.averageKDA.kills.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-400 uppercase">KD Ratio</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">
                      {((player.averageKDA.kills + player.averageKDA.assists) / Math.max(player.averageKDA.deaths, 1)).toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-400 uppercase">KDA Ratio</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 rounded-2xl border border-slate-700/50 p-6">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <Swords className="w-6 h-6 mr-3 text-blue-400" />
                Últimas Batalhas
              </h2>
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {matchHistory.map((match, index) => {
                  const LaneIcon = getLaneIcon(match.lane);
                  const laneColor = getLaneColor(match.lane);
                  const performance = match.rating >= 8 ? 'excellent' : match.rating <= 4 ? 'poor' : 'good';
                  
                  return (
                    <div key={`${match.id}-${index}`} className={`p-4 rounded-xl border-2 ${
                      performance === 'excellent' ? 'border-green-500/30 bg-green-900/20' :
                      performance === 'poor' ? 'border-red-500/30 bg-red-900/20' :
                      'border-slate-600/30 bg-slate-800/30'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <LaneIcon className={`w-5 h-5 ${laneColor}`} />
                          <span className="text-white font-semibold">{match.lane}</span>
                        </div>
                        <div className="text-sm text-gray-400">
                          {new Date(match.date).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-4 text-center">
                        <div>
                          <div className={`text-xl font-bold ${
                            performance === 'excellent' ? 'text-green-400' :
                            performance === 'poor' ? 'text-red-400' : 'text-blue-400'
                          }`}>
                            {match.rating.toFixed(1)}
                          </div>
                          <div className="text-xs text-gray-400">Score</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-green-400">{match.kills}</div>
                          <div className="text-xs text-gray-400">K</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-red-400">{match.deaths}</div>
                          <div className="text-xs text-gray-400">D</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-blue-400">{match.assists}</div>
                          <div className="text-xs text-gray-400">A</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 rounded-2xl border border-slate-700/50 p-6">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <Crown className="w-6 h-6 mr-3 text-yellow-400" />
                Rankings por Posição
              </h2>
              
              <div className="space-y-4">
                {laneRankings.map(ranking => {
                  const LaneIcon = getLaneIcon(ranking.lane);
                  const laneColor = getLaneColor(ranking.lane);
                  const rankColor = getRankingColor(ranking.position, ranking.totalPlayers);
                  
                  return (
                    <div key={ranking.lane} className="p-4 rounded-xl bg-slate-800/30 border border-slate-600/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <LaneIcon className={`w-6 h-6 ${laneColor}`} />
                          <span className="text-white font-semibold">{ranking.lane}</span>
                        </div>
                        <div className="text-right">
                          <div className={`text-xl font-bold ${rankColor}`}>
                            #{ranking.position}
                          </div>
                          <div className="text-xs text-gray-400">
                            de {ranking.totalPlayers}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="text-sm text-gray-300">
                          Média: <span className="text-blue-400 font-semibold">{ranking.averageRating.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-8 bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 rounded-2xl border border-slate-700/50 p-6">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Award className="w-6 h-6 mr-3 text-purple-400" />
              Insights & Dicas
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {generateTips().map((tip, index) => (
                <div key={index} className="p-4 rounded-xl bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30">
                  <p className="text-gray-300">{tip}</p>
                </div>
              ))}
              
              {generateTips().length === 0 && (
                <div className="col-span-2 text-center py-8">
                  <div className="text-gray-400 text-lg">
                    Jogue mais partidas para desbloquear dicas personalizadas!
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 