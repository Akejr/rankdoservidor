import { useState, useEffect } from 'react';
import { supabase, DatabasePlayer, DatabaseMatch, DatabaseMatchParticipant } from '../lib/supabase';
import { Player, MatchFormData, Match, MatchParticipant, LaneLeader, Lane, ServerBagre, WorstKDA, WeeklyTop3 } from '../types';

export function useSupabase() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [laneLeaders, setLaneLeaders] = useState<LaneLeader[]>([]);
  const [serverBagre, setServerBagre] = useState<ServerBagre | null>(null);
  const [worstKDA, setWorstKDA] = useState<WorstKDA | null>(null);
  const [weeklyTop3History, setWeeklyTop3History] = useState<WeeklyTop3[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);

  // Cache de 30 segundos para evitar requests excessivas
  const CACHE_DURATION = 30000;

  // Função de retry com backoff exponencial
  const retryWithBackoff = async (fn: () => Promise<any>, maxRetries = 3, delay = 1000) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (err) {
        if (i === maxRetries - 1) throw err;
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  };

  // Converter dados do banco para o formato da aplicação
  const convertDatabasePlayerToPlayer = (dbPlayer: DatabasePlayer): Player => {
    return {
      id: dbPlayer.id,
      name: dbPlayer.name,
      avatar: dbPlayer.avatar,
      totalRating: dbPlayer.total_rating,
      totalMatches: dbPlayer.total_matches,
      averageRating: dbPlayer.average_rating,
      totalKills: dbPlayer.total_kills,
      totalDeaths: dbPlayer.total_deaths,
      totalAssists: dbPlayer.total_assists,
      averageKDA: {
        kills: dbPlayer.average_kills,
        deaths: dbPlayer.average_deaths,
        assists: dbPlayer.average_assists
      },
      matches: [] // Carregar separadamente se necessário
      // top1Count, top2Count, top3Count serão adicionados posteriormente se existirem
    };
  };

  // Calcular líderes de cada lane baseado na média (mínimo 3 partidas)
  const fetchLaneLeaders = async () => {
    try {
      const lanes: Lane[] = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUP'];
      const leaders: LaneLeader[] = [];

      for (const lane of lanes) {
        // Query para calcular média por jogador na lane com pelo menos 3 partidas
        const { data, error } = await supabase
          .from('match_participants')
          .select(`
            player_id,
            rating,
            players (
              name,
              avatar
            )
          `)
          .eq('lane', lane);

        if (error) {
          console.warn(`Erro ao buscar dados para lane ${lane}:`, error);
          continue;
        }

        if (!data || data.length === 0) {
          console.warn(`Nenhum dado encontrado para lane ${lane}`);
          continue;
        }

        // Agrupar por jogador e calcular médias
        const playerStats = new Map<string, {
          playerId: string,
          playerName: string,
          playerAvatar: string,
          totalRating: number,
          matchCount: number,
          averageRating: number
        }>();

        data.forEach((participant: any) => {
          const playerId = participant.player_id;
          const rating = participant.rating;
          const playerInfo = participant.players;

          if (!playerStats.has(playerId)) {
            playerStats.set(playerId, {
              playerId,
              playerName: playerInfo?.name || 'Jogador Desconhecido',
              playerAvatar: playerInfo?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${playerId}`,
              totalRating: 0,
              matchCount: 0,
              averageRating: 0
            });
          }

          const stats = playerStats.get(playerId)!;
          stats.totalRating += rating;
          stats.matchCount += 1;
          stats.averageRating = stats.totalRating / stats.matchCount;
        });

        // Filtrar jogadores com pelo menos 3 partidas e encontrar o melhor
        const eligiblePlayers = Array.from(playerStats.values())
          .filter(stats => stats.matchCount >= 3)
          .sort((a, b) => b.averageRating - a.averageRating);

        if (eligiblePlayers.length > 0) {
          const bestPlayer = eligiblePlayers[0];
          leaders.push({
            lane,
            playerId: bestPlayer.playerId,
            playerName: bestPlayer.playerName,
            playerAvatar: bestPlayer.playerAvatar,
            bestRating: bestPlayer.averageRating
          });
        } else {
          console.warn(`Nenhum jogador com 3+ partidas na lane ${lane}`);
        }
      }

      setLaneLeaders(leaders);
    } catch (err) {
      console.error('Erro ao carregar líderes de lane:', err);
    }
  };

  // Buscar o bagre do servidor (menor nota)
  const fetchServerBagre = async () => {
    try {
      // Primeiro, verificar se há partidas registradas
      const { count } = await supabase
        .from('match_participants')
        .select('*', { count: 'exact', head: true });

      if (!count || count === 0) {
        console.log('Nenhuma partida encontrada para calcular bagre');
        return;
      }

      // Buscar o participante com a menor nota
      const { data: participantData, error: participantError } = await supabase
        .from('match_participants')
        .select('rating, player_id, created_at, match_id')
        .order('rating', { ascending: true })
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (participantError || !participantData) {
        console.warn('Nenhum bagre encontrado:', participantError);
        return;
      }

      console.log('Dados do participante bagre:', participantData);

      // Buscar dados do jogador
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .select('name, avatar')
        .eq('id', participantData.player_id)
        .single();

      if (playerError || !playerData) {
        console.error('Erro ao buscar dados do jogador bagre:', playerError);
        return;
      }

      console.log('Dados do jogador bagre:', playerData);

      // Buscar dados da partida
      const { data: matchData } = await supabase
        .from('matches')
        .select('match_date')
        .eq('id', participantData.match_id)
        .single();

      console.log('Dados da partida bagre:', matchData);

      // Garantir que temos todos os dados necessários
      if (playerData && playerData.name) {
        const avatarUrl = playerData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(playerData.name)}`;
        
        const bagreData = {
          playerId: participantData.player_id,
          playerName: playerData.name,
          playerAvatar: avatarUrl,
          worstRating: participantData.rating,
          matchDate: matchData?.match_date || participantData.created_at
        };
        
        console.log('Avatar URL do bagre:', avatarUrl);
        console.log('Definindo bagre com dados completos:', bagreData);
        setServerBagre(bagreData);
      } else {
        console.error('Dados incompletos do jogador para o bagre:', playerData);
      }
    } catch (err) {
      console.error('Erro ao carregar bagre do servidor:', err);
    }
  };

  // Buscar o pior KDA do servidor
  const fetchWorstKDA = async () => {
    try {
      // Primeiro, verificar se há partidas registradas
      const { count } = await supabase
        .from('match_participants')
        .select('*', { count: 'exact', head: true });

      if (!count || count === 0) {
        console.log('Nenhuma partida encontrada para calcular pior KDA');
        return;
      }

      // Buscar todas as partidas e calcular KD ratio
      const { data: allParticipants, error: participantsError } = await supabase
        .from('match_participants')
        .select('kills, deaths, assists, player_id, created_at, match_id');

      if (participantsError || !allParticipants) {
        console.warn('Erro ao buscar participantes para KDA:', participantsError);
        return;
      }

      // Calcular KDA ratio para cada participante e encontrar o pior
      let worstKDAParticipant = null;
      let worstKDARatio = Infinity;

      for (const participant of allParticipants) {
        // Para evitar divisão por zero, consideramos pelo menos 1 death
        const deaths = Math.max(participant.deaths, 1);
        const kdaRatio = (participant.kills + participant.assists) / deaths;
        
        // Se o KDA ratio é pior (menor) que o atual pior, atualizar
        if (kdaRatio < worstKDARatio) {
          worstKDARatio = kdaRatio;
          worstKDAParticipant = participant;
        }
      }

      if (!worstKDAParticipant) {
        console.warn('Nenhum pior KDA encontrado');
        return;
      }

      console.log('Dados do participante com pior KDA:', worstKDAParticipant);

      // Buscar dados do jogador
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .select('name, avatar')
        .eq('id', worstKDAParticipant.player_id)
        .single();

      if (playerError || !playerData) {
        console.error('Erro ao buscar dados do jogador com pior KDA:', playerError);
        return;
      }

      console.log('Dados do jogador com pior KDA:', playerData);

      // Buscar dados da partida
      const { data: matchData } = await supabase
        .from('matches')
        .select('match_date')
        .eq('id', worstKDAParticipant.match_id)
        .single();

      console.log('Dados da partida do pior KDA:', matchData);

      // Garantir que temos todos os dados necessários
      if (playerData && playerData.name) {
        const avatarUrl = playerData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(playerData.name)}`;
        
        const worstKDAData = {
          playerId: worstKDAParticipant.player_id,
          playerName: playerData.name,
          playerAvatar: avatarUrl,
          kills: worstKDAParticipant.kills,
          deaths: worstKDAParticipant.deaths,
          assists: worstKDAParticipant.assists,
          kdRatio: worstKDARatio,
          matchDate: matchData?.match_date || worstKDAParticipant.created_at
        };
        
        console.log('Definindo pior KDA com dados completos:', worstKDAData);
        setWorstKDA(worstKDAData);
      } else {
        console.error('Dados incompletos do jogador para o pior KDA:', playerData);
      }
    } catch (err) {
      console.error('Erro ao carregar pior KDA do servidor:', err);
    }
  };

  // Carregar jogadores do Supabase com retry e cache
  const fetchPlayers = async (forceRefresh = false) => {
    // Verificar cache
    const now = Date.now();
    if (!forceRefresh && now - lastFetch < CACHE_DURATION) {
      console.log('Usando dados em cache');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Usar retry para requests
      const { data, error } = await retryWithBackoff(async () => {
        return await supabase
          .from('players')
          .select('*')
          .order('average_rating', { ascending: false });
      });

      if (error) throw error;

      const convertedPlayers = data.map(convertDatabasePlayerToPlayer);
      setPlayers(convertedPlayers);
      
      // Carregar histórico de tops 
      await retryWithBackoff(() => fetchWeeklyTop3History());
      
      // Carregar líderes de lane, bagre e pior KDA também com retry
      await retryWithBackoff(() => fetchLaneLeaders());
      await retryWithBackoff(() => fetchServerBagre());
      await retryWithBackoff(() => fetchWorstKDA());
      
      setLastFetch(now);
    } catch (err) {
      console.error('Erro ao carregar jogadores:', err);
      setError(err instanceof Error ? err.message : 'Serviço temporariamente indisponível');
    } finally {
      setLoading(false);
    }
  };

  // Adicionar nova partida
  const addMatch = async (matchData: MatchFormData) => {
    try {
      setError(null);

      // 1. Criar a partida
      const { data: matchResult, error: matchError } = await supabase
        .from('matches')
        .insert({
          match_date: new Date().toISOString()
        })
        .select()
        .single();

      if (matchError) throw matchError;

      // 2. Preparar participantes (apenas jogadores válidos)
      const allParticipants = [
        { playerId: matchData.player1, rating: matchData.rating1, kills: matchData.kills1, deaths: matchData.deaths1, assists: matchData.assists1, lane: matchData.lane1 },
        { playerId: matchData.player2, rating: matchData.rating2, kills: matchData.kills2, deaths: matchData.deaths2, assists: matchData.assists2, lane: matchData.lane2 },
        { playerId: matchData.player3, rating: matchData.rating3, kills: matchData.kills3, deaths: matchData.deaths3, assists: matchData.assists3, lane: matchData.lane3 },
        { playerId: matchData.player4, rating: matchData.rating4, kills: matchData.kills4, deaths: matchData.deaths4, assists: matchData.assists4, lane: matchData.lane4 },
        { playerId: matchData.player5, rating: matchData.rating5, kills: matchData.kills5, deaths: matchData.deaths5, assists: matchData.assists5, lane: matchData.lane5 }
      ];

      // Filtrar apenas participantes com playerId válido (não vazio)
      const participants = allParticipants.filter(p => p.playerId && p.playerId.trim() !== '');

      if (participants.length === 0) {
        throw new Error('Nenhum jogador válido encontrado');
      }

      // 3. Inserir participantes
      const participantsData = participants.map(p => ({
        match_id: matchResult.id,
        player_id: p.playerId,
        rating: p.rating,
        kills: p.kills,
        deaths: p.deaths,
        assists: p.assists,
        lane: p.lane
      }));

      const { error: participantsError } = await supabase
        .from('match_participants')
        .insert(participantsData);

      if (participantsError) throw participantsError;

      // 4. Atualizar estatísticas dos jogadores
      for (const participant of participants) {
        const player = players.find(p => p.id === participant.playerId);
        if (!player) continue;

        const newTotalMatches = player.totalMatches + 1;
        const newTotalRating = player.totalRating + participant.rating;
        const newTotalKills = player.totalKills + participant.kills;
        const newTotalDeaths = player.totalDeaths + participant.deaths;
        const newTotalAssists = player.totalAssists + participant.assists;
        
        const newAverageRating = newTotalRating / newTotalMatches;
        const newAverageKills = newTotalKills / newTotalMatches;
        const newAverageDeaths = newTotalDeaths / newTotalMatches;
        const newAverageAssists = newTotalAssists / newTotalMatches;

        const { error: updateError } = await supabase
          .from('players')
          .update({
            total_matches: newTotalMatches,
            total_rating: newTotalRating,
            total_kills: newTotalKills,
            total_deaths: newTotalDeaths,
            total_assists: newTotalAssists,
            average_rating: newAverageRating,
            average_kills: newAverageKills,
            average_deaths: newAverageDeaths,
            average_assists: newAverageAssists,
            updated_at: new Date().toISOString()
          })
          .eq('id', participant.playerId);

        if (updateError) throw updateError;
      }

      // 5. Recarregar dados (forçar refresh para mostrar mudanças)
      await fetchPlayers(true);

    } catch (err) {
      console.error('Erro ao adicionar partida:', err);
      setError(err instanceof Error ? err.message : 'Erro ao adicionar partida');
      throw err;
    }
  };

  // Buscar histórico de tops semanais
  const fetchWeeklyTop3History = async () => {
    try {
      const { data, error } = await supabase
        .from('weekly_top3')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Tabela weekly_top3 não existe ainda:', error);
        return;
      }

      setWeeklyTop3History(data || []);
    } catch (err) {
      console.error('Erro ao carregar histórico semanal:', err);
    }
  };

  // Calcular contadores de tops dos players
  const calculateTopCounts = (playersData: Player[]) => {
    return playersData.map(player => {
      let top1Count = 0;
      let top2Count = 0;
      let top3Count = 0;

      weeklyTop3History.forEach(week => {
        if (week.top1_player_id === player.id) top1Count++;
        if (week.top2_player_id === player.id) top2Count++;
        if (week.top3_player_id === player.id) top3Count++;
      });

      // Só adicionar as propriedades se houver contagem > 0
      const result: Player = { ...player };
      if (top1Count > 0) result.top1Count = top1Count;
      if (top2Count > 0) result.top2Count = top2Count;
      if (top3Count > 0) result.top3Count = top3Count;

      return result;
    });
  };

  // Salvar top 3 da semana atual
  const saveCurrentWeekTop3 = async () => {
    try {
      if (players.length < 3) {
        console.log('Menos de 3 jogadores, não é possível salvar top 3');
        return;
      }

      // Ordenar players por bayesian rating ou average rating
      const sortedPlayers = [...players]
        .filter(p => p.totalMatches > 0)
        .sort((a, b) => {
          const aScore = a.bayesianRating || a.averageRating;
          const bScore = b.bayesianRating || b.averageRating;
          return bScore - aScore;
        });

      if (sortedPlayers.length < 3) {
        console.log('Menos de 3 jogadores com partidas, não é possível salvar top 3');
        return;
      }

      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay()); // Domingo da semana atual
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6); // Sábado da semana atual
      weekEnd.setHours(23, 59, 59, 999);

      const weeklyTop3Data = {
        week_start_date: weekStart.toISOString(),
        week_end_date: weekEnd.toISOString(),
        top1_player_id: sortedPlayers[0].id,
        top1_player_name: sortedPlayers[0].name,
        top1_player_avatar: sortedPlayers[0].avatar,
        top1_score: sortedPlayers[0].bayesianRating || sortedPlayers[0].averageRating,
        top2_player_id: sortedPlayers[1].id,
        top2_player_name: sortedPlayers[1].name,
        top2_player_avatar: sortedPlayers[1].avatar,
        top2_score: sortedPlayers[1].bayesianRating || sortedPlayers[1].averageRating,
        top3_player_id: sortedPlayers[2].id,
        top3_player_name: sortedPlayers[2].name,
        top3_player_avatar: sortedPlayers[2].avatar,
        top3_score: sortedPlayers[2].bayesianRating || sortedPlayers[2].averageRating,
        created_at: now.toISOString()
      };

      // Verificar se já existe um registro para esta semana
      const { data: existingWeek } = await supabase
        .from('weekly_top3')
        .select('id')
        .gte('week_start_date', weekStart.toISOString())
        .lte('week_start_date', weekEnd.toISOString())
        .single();

      if (existingWeek) {
        // Atualizar registro existente
        const { error } = await supabase
          .from('weekly_top3')
          .update(weeklyTop3Data)
          .eq('id', existingWeek.id);

        if (error) {
          console.warn('Erro ao atualizar top 3 semanal, tentando criar tabela:', error);
          await createWeeklyTop3Table();
        }
      } else {
        // Criar novo registro
        const { error } = await supabase
          .from('weekly_top3')
          .insert([weeklyTop3Data]);

        if (error) {
          console.warn('Erro ao inserir top 3 semanal, tentando criar tabela:', error);
          await createWeeklyTop3Table();
        }
      }

      console.log('Top 3 da semana salvo com sucesso');
    } catch (err) {
      console.error('Erro ao salvar top 3 da semana:', err);
    }
  };

  // Criar tabela weekly_top3 se não existir
  const createWeeklyTop3Table = async () => {
    try {
      const { error } = await supabase.rpc('create_weekly_top3_table');
      if (error) {
        console.warn('Não foi possível criar tabela automaticamente:', error);
      }
    } catch (err) {
      console.warn('Tabela weekly_top3 precisa ser criada manualmente:', err);
    }
  };

  // Resetar dados e salvar top 3 atual
  const resetRankWithTop3Save = async () => {
    try {
      setError(null);

      // 1. Salvar o top 3 da semana atual antes de resetar
      await saveCurrentWeekTop3();

      // 2. Deletar todas as partidas
      await supabase.from('match_participants').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('matches').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      // 3. Resetar estatísticas dos jogadores
      const { error } = await supabase
        .from('players')
        .update({
          total_matches: 0,
          total_rating: 0,
          total_kills: 0,
          total_deaths: 0,
          total_assists: 0,
          average_rating: 0,
          average_kills: 0,
          average_deaths: 0,
          average_assists: 0,
          updated_at: new Date().toISOString()
        })
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) throw error;

      // 4. Recarregar dados
      await fetchPlayers(true);
      await fetchWeeklyTop3History();

      console.log('Reset completo realizado com sucesso, top 3 salvo!');
    } catch (err) {
      console.error('Erro ao resetar ranking:', err);
      setError(err instanceof Error ? err.message : 'Erro ao resetar ranking');
      throw err;
    }
  };

  // Resetar dados (para desenvolvimento) - mantém função original
  const resetPlayerStats = async () => {
    try {
      setError(null);

      // Deletar todas as partidas
      await supabase.from('match_participants').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('matches').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      // Resetar estatísticas dos jogadores
      const { error } = await supabase
        .from('players')
        .update({
          total_matches: 0,
          total_rating: 0,
          total_kills: 0,
          total_deaths: 0,
          total_assists: 0,
          average_rating: 0,
          average_kills: 0,
          average_deaths: 0,
          average_assists: 0,
          updated_at: new Date().toISOString()
        })
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) throw error;

      await fetchPlayers(true);
    } catch (err) {
      console.error('Erro ao resetar dados:', err);
      setError(err instanceof Error ? err.message : 'Erro ao resetar dados');
    }
  };

  // Carregar dados na inicialização
  useEffect(() => {
    fetchPlayers();
  }, []);

  // Atualizar contadores de tops quando o histórico for carregado
  useEffect(() => {
    if (weeklyTop3History.length > 0 && players.length > 0) {
      const playersWithTopCounts = calculateTopCounts(players);
      setPlayers(playersWithTopCounts);
    }
  }, [weeklyTop3History]);

  // Remover realtime para evitar problemas de rate limiting
  // O realtime será substituído por refresh manual quando necessário

  return {
    players,
    laneLeaders,
    serverBagre,
    worstKDA,
    weeklyTop3History,
    loading,
    error,
    addMatch,
    resetPlayerStats,
    resetRankWithTop3Save,
    refetch: fetchPlayers
  };
} 