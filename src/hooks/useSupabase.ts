import { useState, useEffect } from 'react';
import { supabase, DatabasePlayer, DatabaseMatch, DatabaseMatchParticipant } from '../lib/supabase';
import { Player, MatchFormData, Match, MatchParticipant } from '../types';

export function useSupabase() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Carregar jogadores do Supabase
  const fetchPlayers = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('average_rating', { ascending: false });

      if (error) throw error;

      const convertedPlayers = data.map(convertDatabasePlayerToPlayer);
      setPlayers(convertedPlayers);
    } catch (err) {
      console.error('Erro ao carregar jogadores:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
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
        { playerId: matchData.player1, rating: matchData.rating1, kills: matchData.kills1, deaths: matchData.deaths1, assists: matchData.assists1 },
        { playerId: matchData.player2, rating: matchData.rating2, kills: matchData.kills2, deaths: matchData.deaths2, assists: matchData.assists2 },
        { playerId: matchData.player3, rating: matchData.rating3, kills: matchData.kills3, deaths: matchData.deaths3, assists: matchData.assists3 },
        { playerId: matchData.player4, rating: matchData.rating4, kills: matchData.kills4, deaths: matchData.deaths4, assists: matchData.assists4 },
        { playerId: matchData.player5, rating: matchData.rating5, kills: matchData.kills5, deaths: matchData.deaths5, assists: matchData.assists5 }
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
        assists: p.assists
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

      // 5. Recarregar dados
      await fetchPlayers();

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

      await fetchPlayers();
    } catch (err) {
      console.error('Erro ao resetar dados:', err);
      setError(err instanceof Error ? err.message : 'Erro ao resetar dados');
    }
  };

  // Carregar dados na inicialização
  useEffect(() => {
    fetchPlayers();
  }, []);

  // Configurar realtime (dados em tempo real)
  useEffect(() => {
    const channel = supabase
      .channel('players-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'players' }, 
        () => {
          fetchPlayers(); // Recarregar quando houver mudanças
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    players,
    loading,
    error,
    addMatch,
    resetPlayerStats,
    refetch: fetchPlayers
  };
} 