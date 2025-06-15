import React, { useState, useEffect } from 'react';
import { Player, Lane } from '../types';
import { PlayerAvatar } from './PlayerAvatar';
import { X, Trophy, Calendar, Crown, Medal, Star, Shield, Zap, Target, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface MatchHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayerClick?: (player: Player) => void;
  players: Player[];
}

interface MatchData {
  id: string;
  date: string;
  participants: {
    playerId: string;
    playerName: string;
    playerAvatar: string;
    rating: number;
    kills: number;
    deaths: number;
    assists: number;
    lane: Lane;
  }[];
  mvp: {
    playerId: string;
    playerName: string;
    playerAvatar: string;
    rating: number;
    lane: Lane;
  };
}

interface MVPStats {
  playerId: string;
  playerName: string;
  playerAvatar: string;
  mvpCount: number;
  totalMatches: number;
  mvpPercentage: number;
}

export const MatchHistoryModal: React.FC<MatchHistoryModalProps> = ({
  isOpen,
  onClose,
  onPlayerClick,
  players
}) => {
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [topMVPs, setTopMVPs] = useState<MVPStats[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchMatchHistory();
    }
  }, [isOpen]);

  const fetchMatchHistory = async () => {
    try {
      setLoading(true);

      // Buscar as últimas 20 partidas para exibir
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select(`
          id,
          match_date,
          match_participants (
            player_id,
            rating,
            kills,
            deaths,
            assists,
            lane,
            players (
              name,
              avatar
            )
          )
        `)
        .order('match_date', { ascending: false })
        .limit(20);

      if (matchesError) throw matchesError;

      const processedMatches: MatchData[] = [];

      matchesData?.forEach((match) => {
        const participants = match.match_participants.map((p: any) => ({
          playerId: p.player_id,
          playerName: p.players?.name || 'Jogador Desconhecido',
          playerAvatar: p.players?.avatar || '',
          rating: p.rating,
          kills: p.kills,
          deaths: p.deaths,
          assists: p.assists,
          lane: p.lane
        }));

        const mvp = participants.reduce((prev, current) => 
          prev.rating > current.rating ? prev : current
        );

        processedMatches.push({
          id: match.id,
          date: match.match_date,
          participants,
          mvp: {
            playerId: mvp.playerId,
            playerName: mvp.playerName,
            playerAvatar: mvp.playerAvatar,
            rating: mvp.rating,
            lane: mvp.lane
          }
        });
      });

      setMatches(processedMatches);

      // Buscar TODAS as partidas para calcular estatísticas de MVP corretamente
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
        console.error('Erro ao buscar todas as partidas:', allMatchesError);
        return;
      }

      console.log('Total de participantes encontrados:', allMatchesData?.length);

      // Agrupar participantes por match_id
      const matchGroups = new Map<string, any[]>();
      
      allMatchesData?.forEach((participant: any) => {
        const matchId = participant.match_id;
        if (!matchGroups.has(matchId)) {
          matchGroups.set(matchId, []);
        }
        matchGroups.get(matchId)!.push({
          playerId: participant.player_id,
          playerName: participant.players?.name || 'Jogador Desconhecido',
          playerAvatar: participant.players?.avatar || '',
          rating: participant.rating
        });
      });

      console.log('Total de partidas agrupadas:', matchGroups.size);

      const mvpCounts = new Map<string, { count: number; total: number; player: any }>();

      // Para cada partida, encontrar o MVP
      matchGroups.forEach((participants, matchId) => {
        if (participants.length === 0) return;

        const mvp = participants.reduce((prev: any, current: any) => 
          prev.rating > current.rating ? prev : current
        );

        console.log('MVP da partida:', mvp.playerName, 'com nota:', mvp.rating);

        participants.forEach((p: any) => {
          const key = p.playerId;
          const existing = mvpCounts.get(key) || { count: 0, total: 0, player: p };
          existing.total++;
          if (p.playerId === mvp.playerId) {
            existing.count++;
          }
          existing.player = p;
          mvpCounts.set(key, existing);
        });
      });

      console.log('Estatísticas de MVP:', Array.from(mvpCounts.entries()));

      const mvpStats: MVPStats[] = Array.from(mvpCounts.entries())
        .map(([playerId, stats]) => ({
          playerId,
          playerName: stats.player.playerName,
          playerAvatar: stats.player.playerAvatar,
          mvpCount: stats.count,
          totalMatches: stats.total,
          mvpPercentage: (stats.count / stats.total) * 100
        }))
        .filter(stat => stat.totalMatches >= 3)
        .sort((a, b) => {
          if (b.mvpCount === a.mvpCount) {
            return b.mvpPercentage - a.mvpPercentage;
          }
          return b.mvpCount - a.mvpCount;
        })
        .slice(0, 3);

      console.log('Top 3 MVPs:', mvpStats);
      setTopMVPs(mvpStats);

    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
    } finally {
      setLoading(false);
    }
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

  const getMVPRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-6 h-6 text-yellow-400" />;
      case 2: return <Medal className="w-6 h-6 text-gray-400" />;
      case 3: return <Trophy className="w-6 h-6 text-amber-600" />;
      default: return null;
    }
  };

  const getMVPRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'from-yellow-500/20 to-amber-500/20 border-yellow-500/30';
      case 2: return 'from-gray-400/20 to-slate-400/20 border-gray-400/30';
      case 3: return 'from-amber-600/20 to-orange-600/20 border-amber-600/30';
      default: return 'from-slate-800/30 to-slate-900/30 border-slate-700/30';
    }
  };

  if (!isOpen) return null;

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

            <div className="flex items-center space-x-4 mb-6">
              <Calendar className="w-8 h-8 text-blue-400" />
              <h1 className="text-4xl font-bold text-white">Histórico de Partidas</h1>
            </div>

            {topMVPs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {topMVPs.map((mvp, index) => {
                const rank = index + 1;
                
                return (
                  <div
                    key={mvp.playerId}
                    className={`relative bg-gradient-to-br ${getMVPRankColor(rank)} rounded-xl p-6 border-2 hover:scale-105 transition-transform duration-300`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        {getMVPRankIcon(rank)}
                        <span className="text-white font-bold">#{rank} MVP</span>
                      </div>
                      <div className="text-sm text-gray-400">
                        {mvp.mvpPercentage.toFixed(1)}%
                      </div>
                    </div>

                    <div 
                      className="flex flex-col items-center cursor-pointer"
                      onClick={() => {
                        const player = players.find(p => p.id === mvp.playerId);
                        if (player && onPlayerClick) {
                          onPlayerClick(player);
                          onClose();
                        }
                      }}
                    >
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-1 mb-3">
                        <PlayerAvatar
                          playerName={mvp.playerName}
                          playerAvatar={mvp.playerAvatar}
                          size="w-full h-full"
                          className="rounded-full hover:scale-110 transition-transform"
                        />
                      </div>

                      <h3 className="text-lg font-bold text-white text-center mb-2">
                        {mvp.playerName}
                      </h3>

                      <div className="grid grid-cols-2 gap-4 w-full text-center">
                        <div>
                          <div className="text-2xl font-bold text-yellow-400">
                            {mvp.mvpCount}
                          </div>
                          <div className="text-xs text-gray-400">MVPs</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-blue-400">
                            {mvp.totalMatches}
                          </div>
                          <div className="text-xs text-gray-400">Partidas</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg">
                  Carregando estatísticas de MVP...
                </div>
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 rounded-2xl border border-slate-700/50 p-6">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Trophy className="w-6 h-6 mr-3 text-yellow-400" />
              Últimas Batalhas
            </h2>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-400"></div>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {matches.map((match) => (
                  <div
                    key={match.id}
                    className="bg-slate-800/30 rounded-xl border border-slate-600/30 p-4"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Calendar className="w-5 h-5 text-blue-400" />
                        <span className="text-white font-semibold">
                          {new Date(match.date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 bg-yellow-900/30 px-3 py-1 rounded-full border border-yellow-500/30">
                        <Crown className="w-4 h-4 text-yellow-400" />
                        <span className="text-yellow-400 font-semibold text-sm">
                          MVP: {match.mvp.playerName}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                      {match.participants
                        .sort((a, b) => b.rating - a.rating)
                        .map((participant) => {
                          const LaneIcon = getLaneIcon(participant.lane);
                          const laneColor = getLaneColor(participant.lane);
                          const isMVP = participant.playerId === match.mvp.playerId;
                          
                          return (
                            <div
                              key={`${match.id}-${participant.playerId}`}
                              className={`p-3 rounded-xl border-2 transition-all hover:scale-105 cursor-pointer ${
                                isMVP 
                                  ? 'border-yellow-500/50 bg-gradient-to-br from-yellow-900/30 to-amber-900/30' 
                                  : 'border-slate-600/30 bg-slate-800/30 hover:border-blue-500/50'
                              }`}
                              onClick={() => {
                                const player = players.find(p => p.id === participant.playerId);
                                if (player && onPlayerClick) {
                                  onPlayerClick(player);
                                  onClose();
                                }
                              }}
                            >
                              <div className="flex items-center space-x-2 mb-2">
                                <LaneIcon className={`w-4 h-4 ${laneColor}`} />
                                <span className="text-white font-semibold text-sm">
                                  {participant.lane}
                                </span>
                                {isMVP && <Crown className="w-4 h-4 text-yellow-400" />}
                              </div>

                              <div className="flex items-center space-x-2 mb-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-0.5">
                                  <PlayerAvatar
                                    playerName={participant.playerName}
                                    playerAvatar={participant.playerAvatar}
                                    size="w-full h-full"
                                    className="rounded-full"
                                  />
                                </div>
                                <span className="text-white text-sm truncate">
                                  {participant.playerName}
                                </span>
                              </div>

                              <div className="space-y-2">
                                <div className="text-center">
                                  <div className={`text-lg font-bold ${
                                    isMVP ? 'text-yellow-400' : 
                                    participant.rating >= 8 ? 'text-green-400' :
                                    participant.rating <= 4 ? 'text-red-400' : 'text-blue-400'
                                  }`}>
                                    {participant.rating.toFixed(1)}
                                  </div>
                                  <div className="text-xs text-gray-400">Score</div>
                                </div>

                                <div className="grid grid-cols-3 gap-1 text-center text-xs">
                                  <div>
                                    <div className="text-green-400 font-bold">{participant.kills}</div>
                                    <div className="text-gray-400">K</div>
                                  </div>
                                  <div>
                                    <div className="text-red-400 font-bold">{participant.deaths}</div>
                                    <div className="text-gray-400">D</div>
                                  </div>
                                  <div>
                                    <div className="text-blue-400 font-bold">{participant.assists}</div>
                                    <div className="text-gray-400">A</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ))}

                {matches.length === 0 && !loading && (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-lg">
                      Nenhuma partida encontrada no histórico.
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 