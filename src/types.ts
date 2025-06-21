export interface Player {
  id: string;
  name: string;
  avatar: string;
  totalRating: number;
  totalMatches: number;
  averageRating: number;
  bayesianRating?: number;
  totalKills: number;
  totalDeaths: number;
  totalAssists: number;
  averageKDA: {
    kills: number;
    deaths: number;
    assists: number;
  };
  matches: Match[];
  top1Count?: number;
  top2Count?: number;
  top3Count?: number;
}

export interface Match {
  id: string;
  date: Date;
  participants: MatchParticipant[];
}

export interface MatchParticipant {
  playerId: string;
  rating: number;
  kills: number;
  deaths: number;
  assists: number;
  lane: Lane;
}

export type Lane = 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUP';

export interface MatchFormData {
  player1: string;
  player2: string;
  player3: string;
  player4: string;
  player5: string;
  rating1: number;
  rating2: number;
  rating3: number;
  rating4: number;
  rating5: number;
  kills1: number;
  kills2: number;
  kills3: number;
  kills4: number;
  kills5: number;
  deaths1: number;
  deaths2: number;
  deaths3: number;
  deaths4: number;
  deaths5: number;
  assists1: number;
  assists2: number;
  assists3: number;
  assists4: number;
  assists5: number;
  lane1: Lane;
  lane2: Lane;
  lane3: Lane;
  lane4: Lane;
  lane5: Lane;
}

export interface LaneLeader {
  lane: Lane;
  playerId: string;
  playerName: string;
  playerAvatar: string;
  bestRating: number;
}

export interface ServerBagre {
  playerId: string;
  playerName: string;
  playerAvatar: string;
  worstRating: number;
  matchDate: string;
}

export interface WorstKDA {
  playerId: string;
  playerName: string;
  playerAvatar: string;
  kills: number;
  deaths: number;
  assists: number;
  kdRatio: number;
  matchDate: string;
}

export interface WeeklyTop3 {
  id: string;
  week_start_date: string;
  week_end_date: string;
  top1_player_id: string;
  top1_player_name: string;
  top1_player_avatar: string;
  top1_score: number;
  top2_player_id: string;
  top2_player_name: string;
  top2_player_avatar: string;
  top2_score: number;
  top3_player_id: string;
  top3_player_name: string;
  top3_player_avatar: string;
  top3_score: number;
  created_at: string;
}