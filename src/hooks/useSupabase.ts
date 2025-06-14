import { useState, useEffect } from 'react';
import { supabase, DatabasePlayer, DatabaseMatch, DatabaseMatchParticipant } from '../lib/supabase';
import { Player, MatchFormData, Match, MatchParticipant, LaneLeader, Lane, ServerBagre } from '../types';

export function useSupabase() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [laneLeaders, setLaneLeaders] = useState<LaneLeader[]>([]);
  const [serverBagre, setServerBagre] = useState<ServerBagre | null>(null);
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
    };
  };

  // Calcular líderes de cada lane
  const fetchLaneLeaders = async () => {
    try {
      const lanes: Lane[] = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUP'];
      const leaders: LaneLeader[] = [];

      for (const lane of lanes) {
        const { data, error } = await supabase
          .from('match_participants')
          .select(`
            rating,
            lane,
            player_id,
            created_at,
            players (
              name,
              avatar
            )
          `)
          .eq('lane', lane)
          .order('rating', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error) {
          console.warn(`Nenhum líder encontrado para lane ${lane}:`, error);
          continue;
        }

        if (data && data.players) {
          leaders.push({
            lane,
            playerId: data.player_id,
            playerName: (data.players as any).name,
            playerAvatar: (data.players as any).avatar,
            bestRating: data.rating
          });
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
      
      // Carregar líderes de lane e bagre também com retry
      await retryWithBackoff(() => fetchLaneLeaders());
      await retryWithBackoff(() => fetchServerBagre());
      
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

  // Resetar dados (para desenvolvimento)
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

  // Remover realtime para evitar problemas de rate limiting
  // O realtime será substituído por refresh manual quando necessário

  return {
    players,
    laneLeaders,
    serverBagre,
    loading,
    error,
    addMatch,
    resetPlayerStats,
    refetch: fetchPlayers
  };
} 