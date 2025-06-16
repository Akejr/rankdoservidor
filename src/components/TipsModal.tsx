import React, { useState, useEffect } from 'react';
import { X, Lightbulb, AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react';
import { Player, Lane } from '../types';
import { supabase } from '../lib/supabase';
import { PlayerAvatar } from './PlayerAvatar';

interface TipsModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
}

interface MatchData {
  id: string;
  playerId: string;
  playerName: string;
  playerAvatar: string;
  rating: number;
  kills: number;
  deaths: number;
  assists: number;
  lane: Lane;
  matchDate: string;
  junglePlayerId?: string;
  junglePlayerName?: string;
}

interface Tip {
  type: 'warning' | 'positive' | 'negative' | 'special';
  message: string;
  playerId: string;
  playerName: string;
  playerAvatar: string;
}

export const TipsModal: React.FC<TipsModalProps> = ({ isOpen, onClose, players }) => {
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      generateTips();
    }
  }, [isOpen, players]);

  const generateTips = async () => {
    setLoading(true);
    try {
      const allTips: Tip[] = [];
      
      for (const player of players) {
        if (player.totalMatches === 0) continue;
        
        // Buscar últimas partidas do jogador
        const { data: matches, error } = await supabase
          .from('match_participants')
          .select(`
            rating,
            kills,
            deaths,
            assists,
            lane,
            created_at,
            match_id,
            player_id,
            matches (
              match_date
            ),
            players (
              name,
              avatar
            )
          `)
          .eq('player_id', player.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) continue;

        const matchData: MatchData[] = matches?.map((match: any) => ({
          id: match.match_id,
          playerId: match.player_id,
          playerName: match.players?.name || player.name,
          playerAvatar: match.players?.avatar || player.avatar,
          rating: match.rating,
          kills: match.kills,
          deaths: match.deaths,
          assists: match.assists,
          lane: match.lane,
          matchDate: match.matches?.match_date || match.created_at
        })) || [];

        // Análise 1: Média abaixo de 5 em posição específica
        const lanePerformance = new Map<Lane, number[]>();
        matchData.forEach(match => {
          if (!lanePerformance.has(match.lane)) {
            lanePerformance.set(match.lane, []);
          }
          lanePerformance.get(match.lane)!.push(match.rating);
        });

        lanePerformance.forEach((ratings, lane) => {
          if (ratings.length >= 2) {
            const average = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
            if (average < 5) {
              allTips.push({
                type: 'warning',
                message: `${player.name}, evite jogar na ${lane} porque você é horrível nessa lane`,
                playerId: player.id,
                playerName: player.name,
                playerAvatar: player.avatar
              });
            }
          }
        });

        // Análise 2: Morreu mais de 7x nas últimas 3 partidas
        const last3Matches = matchData.slice(0, 3);
        const totalDeathsLast3 = last3Matches.reduce((sum, match) => sum + match.deaths, 0);
        if (last3Matches.length === 3 && totalDeathsLast3 > 7) {
          allTips.push({
            type: 'negative',
            message: `Para de morrer aí ${player.name}, você morreu pra caralho nas últimas partidas`,
            playerId: player.id,
            playerName: player.name,
            playerAvatar: player.avatar
          });
        }

        // Análise 4: Nota alta nas duas últimas partidas
        const last2Matches = matchData.slice(0, 2);
        if (last2Matches.length === 2 && last2Matches.every(match => match.rating >= 7)) {
          allTips.push({
            type: 'positive',
            message: `${player.name}, isso aí, continua carregando esses horríveis`,
            playerId: player.id,
            playerName: player.name,
            playerAvatar: player.avatar
          });
        }

        // Análise 7: Média de score acima de 7 nas últimas 3 partidas
        const last3MatchesForAverage = matchData.slice(0, 3);
        if (last3MatchesForAverage.length === 3) {
          const averageLast3 = last3MatchesForAverage.reduce((sum, match) => sum + match.rating, 0) / 3;
          if (averageLast3 >= 7) {
            allTips.push({
              type: 'positive',
              message: `${player.name} está jogando o fino ultimamente`,
              playerId: player.id,
              playerName: player.name,
              playerAvatar: player.avatar
            });
          }
        }

        // Análise 8: Nota acima de 9 duas vezes nas últimas 5 partidas
        const last5MatchesForHighScore = matchData.slice(0, 5);
        const highScoreMatches = last5MatchesForHighScore.filter(match => match.rating > 9);
        if (highScoreMatches.length >= 2) {
          allTips.push({
            type: 'positive',
            message: `O ${player.name} tá carregando vocês ultimamente`,
            playerId: player.id,
            playerName: player.name,
            playerAvatar: player.avatar
          });
        }

        // Análise 5: Morreu mais de 10x em uma das últimas 5 partidas
        const last5Matches = matchData.slice(0, 5);
        const hasHighDeaths = last5Matches.some(match => match.deaths > 10);
        if (hasHighDeaths) {
          allTips.push({
            type: 'warning',
            message: `${player.name}, para de feedar aí, seu time não aguenta mais te carregar`,
            playerId: player.id,
            playerName: player.name,
            playerAvatar: player.avatar
          });
        }

        // Análise 6: Caso especial do Breno
        if (player.name.toLowerCase().includes('breno')) {
          const last2MatchesKD = last2Matches.filter(match => 
            (match.kills + match.assists) > match.deaths
          );
          if (last2MatchesKD.length === 2) {
            allTips.push({
              type: 'special',
              message: `Caralho Brenin, tá jogando o fino em`,
              playerId: player.id,
              playerName: player.name,
              playerAvatar: player.avatar
            });
          }
        }
      }

      // Filtrar dicas contraditórias e ordenar por relevância
      const filteredTips = filterConflictingTips(allTips);
      const sortedTips = sortTipsByRelevance(filteredTips);
      setTips(sortedTips);
    } catch (error) {
      console.error('Erro ao gerar dicas:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterConflictingTips = (tips: Tip[]): Tip[] => {
    // Agrupar dicas por jogador
    const tipsByPlayer = new Map<string, Tip[]>();
    
    tips.forEach(tip => {
      if (!tipsByPlayer.has(tip.playerId)) {
        tipsByPlayer.set(tip.playerId, []);
      }
      tipsByPlayer.get(tip.playerId)!.push(tip);
    });

    const filteredTips: Tip[] = [];

    tipsByPlayer.forEach((playerTips, playerId) => {
      if (playerTips.length === 1) {
        // Se há apenas uma dica, adicionar diretamente
        filteredTips.push(playerTips[0]);
        return;
      }

      // Verificar conflitos e aplicar prioridades
      const hasPositive = playerTips.some(tip => tip.type === 'positive');
      const hasNegative = playerTips.some(tip => tip.type === 'negative');
      const hasWarning = playerTips.some(tip => tip.type === 'warning');
      const hasSpecial = playerTips.some(tip => tip.type === 'special');

      // Prioridade 1: Dicas especiais (Breno)
      if (hasSpecial) {
        const specialTip = playerTips.find(tip => tip.type === 'special');
        filteredTips.push(specialTip!);
        return;
      }

      // Prioridade 2: Se tem positivo E negativo, aplicar lógica de conflito
      if (hasPositive && (hasNegative || hasWarning)) {
        const positiveTip = playerTips.find(tip => tip.type === 'positive');
        const negativeTips = playerTips.filter(tip => tip.type === 'negative');
        const warningTips = playerTips.filter(tip => tip.type === 'warning');
        
                 // Análise de conflito entre dicas positivas e negativas
         const positiveTips = playerTips.filter(tip => tip.type === 'positive');
         const hasDeathCriticism = negativeTips.some(tip => tip.message.includes('morreu pra caralho'));
         
         // Se há múltiplas dicas positivas, escolher a mais específica/recente
         let bestPositiveTip = positiveTips[0];
         if (positiveTips.length > 1) {
           // Prioridade: carregando vocês > jogando o fino > continua carregando
           const carryTip = positiveTips.find(tip => tip.message.includes('tá carregando vocês'));
           const finoTip = positiveTips.find(tip => tip.message.includes('jogando o fino'));
           const continueTip = positiveTips.find(tip => tip.message.includes('continua carregando'));
           
           bestPositiveTip = carryTip || finoTip || continueTip || positiveTips[0];
         }
         
         if (bestPositiveTip && hasDeathCriticism) {
           // Performance recente é mais importante - jogador melhorou
           filteredTips.push(bestPositiveTip);
           
           // Manter apenas dicas que não conflitam com performance positiva
           const compatibleWarnings = warningTips.filter(tip => 
             tip.message.includes('evite jogar na') || // dicas de lane são sempre válidas
             (!tip.message.includes('para de feedar') && !tip.message.includes('morreu pra caralho'))
           );
           filteredTips.push(...compatibleWarnings);
         } else {
           // Se não há conflito direto, manter a melhor positiva e filtrar negativas
           if (bestPositiveTip) {
             filteredTips.push(bestPositiveTip);
           }
           
           // Evitar múltiplas dicas sobre morte/feed
           const deathTip = negativeTips.find(tip => tip.message.includes('morreu pra caralho'));
           const feedTip = warningTips.find(tip => tip.message.includes('para de feedar'));
           
           if (deathTip && !feedTip) {
             filteredTips.push(deathTip);
           } else if (feedTip && !deathTip) {
             filteredTips.push(feedTip);
           } else if (feedTip) {
             // Priorizar feed warning sobre morte (é mais específico)
             filteredTips.push(feedTip);
           }
           
           // Adicionar outras dicas não relacionadas a morte
           const otherTips = [...negativeTips, ...warningTips].filter(tip => 
             !tip.message.includes('morreu pra caralho') && 
             !tip.message.includes('para de feedar')
           );
           filteredTips.push(...otherTips);
         }
        return;
      }

      // Prioridade 3: Se só tem negativos/warnings, manter apenas um de cada tipo
      if ((hasNegative || hasWarning) && !hasPositive) {
        const uniqueTips = new Map<string, Tip>();
        
        playerTips.forEach(tip => {
          if (tip.type === 'negative' && tip.message.includes('morreu pra caralho')) {
            uniqueTips.set('deaths', tip);
          } else if (tip.type === 'warning' && tip.message.includes('evite jogar na')) {
            uniqueTips.set('lane', tip);
          } else if (tip.type === 'warning' && tip.message.includes('para de feedar')) {
            uniqueTips.set('feed', tip);
          }
        });
        
        filteredTips.push(...Array.from(uniqueTips.values()));
        return;
      }

      // Caso padrão: manter todas as dicas não conflitantes
      filteredTips.push(...playerTips);
    });

    return filteredTips;
  };

  const sortTipsByRelevance = (tips: Tip[]): Tip[] => {
    // Ordenar por prioridade: especial > positivo > warning > negativo
    const order = { 'special': 0, 'positive': 1, 'warning': 2, 'negative': 3 };
    
    return tips.sort((a, b) => {
      const orderA = order[a.type];
      const orderB = order[b.type];
      
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      
      // Se mesmo tipo, ordenar alfabeticamente por nome do jogador
      return a.playerName.localeCompare(b.playerName);
    });
  };

  const getTipIcon = (type: Tip['type']) => {
    switch (type) {
      case 'positive': return <TrendingUp className="w-5 h-5 text-green-400" />;
      case 'negative': return <TrendingDown className="w-5 h-5 text-red-400" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'special': return <Lightbulb className="w-5 h-5 text-purple-400" />;
    }
  };

  const getTipColors = (type: Tip['type']) => {
    switch (type) {
      case 'positive': return 'bg-green-900/30 border-green-500/30 text-green-100';
      case 'negative': return 'bg-red-900/30 border-red-500/30 text-red-100';
      case 'warning': return 'bg-yellow-900/30 border-yellow-500/30 text-yellow-100';
      case 'special': return 'bg-purple-900/30 border-purple-500/30 text-purple-100';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-lg z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 rounded-2xl border border-slate-700/50 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
          <div className="flex items-center space-x-3">
            <Lightbulb className="w-8 h-8 text-yellow-400" />
            <h2 className="text-2xl font-bold text-white">Dicas Baseadas em Performance</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-slate-700/50 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-400"></div>
              <span className="ml-4 text-white">Analisando performances...</span>
            </div>
          ) : tips.length === 0 ? (
            <div className="text-center py-12">
              <Lightbulb className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-400 mb-2">Nenhuma Dica Encontrada</h3>
              <p className="text-gray-500">Todos os jogadores estão performando bem!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tips.map((tip, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl border ${getTipColors(tip.type)} transition-all hover:scale-[1.02]`}
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {getTipIcon(tip.type)}
                    </div>
                    <div className="flex items-center space-x-3 flex-1">
                      <PlayerAvatar
                        playerName={tip.playerName}
                        playerAvatar={tip.playerAvatar}
                        size="w-10 h-10"
                        className="rounded-full"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-lg leading-relaxed">
                          {tip.message}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 