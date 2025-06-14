import React, { useState, useEffect } from 'react';
import { Player, MatchFormData, Lane } from '../types';
import { PasswordPrompt } from './PasswordPrompt';
import { 
  Plus, Save, X, Swords, Trophy, Zap, Target, 
  Users, Star, ArrowRight, CheckCircle, AlertCircle,
  UserPlus, Calculator, TrendingUp
} from 'lucide-react';

interface AdminPanelProps {
  players: Player[];
  onAddMatch: (matchData: MatchFormData) => void;
}

interface PlayerSlot {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  kills: number;
  deaths: number;
  assists: number;
  lane: Lane;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ players, onAddMatch }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPlayers, setSelectedPlayers] = useState<PlayerSlot[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);

  const [formData, setFormData] = useState<MatchFormData>({
    player1: '', player2: '', player3: '', player4: '', player5: '',
    rating1: 5, rating2: 5, rating3: 5, rating4: 5, rating5: 5,
    kills1: 0, kills2: 0, kills3: 0, kills4: 0, kills5: 0,
    deaths1: 0, deaths2: 0, deaths3: 0, deaths4: 0, deaths5: 0,
    assists1: 0, assists2: 0, assists3: 0, assists4: 0, assists5: 0,
    lane1: 'TOP', lane2: 'JUNGLE', lane3: 'MID', lane4: 'ADC', lane5: 'SUP',
  });

  const resetForm = () => {
    setSelectedPlayers([]);
    setCurrentStep(1);
    setSearchTerm('');
    setFormErrors([]);
    setFormData({
      player1: '', player2: '', player3: '', player4: '', player5: '',
      rating1: 5, rating2: 5, rating3: 5, rating4: 5, rating5: 5,
      kills1: 0, kills2: 0, kills3: 0, kills4: 0, kills5: 0,
      deaths1: 0, deaths2: 0, deaths3: 0, deaths4: 0, deaths5: 0,
      assists1: 0, assists2: 0, assists3: 0, assists4: 0, assists5: 0,
      lane1: 'TOP', lane2: 'JUNGLE', lane3: 'MID', lane4: 'ADC', lane5: 'SUP',
    });
  };

  const lanes: Lane[] = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUP'];

  const handlePlayerSelect = (player: Player) => {
    if (selectedPlayers.length >= 5) return;
    
    const newPlayer: PlayerSlot = {
      id: player.id,
      name: player.name,
      avatar: player.avatar,
      rating: 5,
      kills: 0,
      deaths: 0,
      assists: 0,
      lane: lanes[selectedPlayers.length]
    };

    setSelectedPlayers(prev => [...prev, newPlayer]);
    setSearchTerm('');
  };

  const removePlayer = (playerId: string) => {
    setSelectedPlayers(prev => prev.filter(p => p.id !== playerId));
  };

  const updatePlayerStats = (playerId: string, field: keyof PlayerSlot, value: number) => {
    setSelectedPlayers(prev => prev.map(p => 
      p.id === playerId ? { ...p, [field]: value } : p
    ));
  };

  const validateAndProceed = () => {
    const errors: string[] = [];
    
    if (selectedPlayers.length < 1) {
      errors.push('Selecione pelo menos 1 jogador');
    }

    if (selectedPlayers.length > 5) {
      errors.push('Máximo de 5 jogadores por partida');
    }

    selectedPlayers.forEach((player, index) => {
      if (player.rating < 1 || player.rating > 10) {
        errors.push(`Rating do ${player.name} deve estar entre 1 e 10`);
      }
      if (player.kills < 0) {
        errors.push(`Kills do ${player.name} não pode ser negativo`);
      }
      if (player.deaths < 0) {
        errors.push(`Deaths do ${player.name} não pode ser negativo`);
      }
      if (player.assists < 0) {
        errors.push(`Assists do ${player.name} não pode ser negativo`);
      }
    });

    setFormErrors(errors);
    
    if (errors.length === 0) {
      if (currentStep === 1) {
        setCurrentStep(2);
      } else {
        setShowPasswordPrompt(true);
      }
    }
  };

  const handleSubmit = async () => {
    try {
      // Convert selectedPlayers to MatchFormData format
      const matchData: MatchFormData = {
        player1: selectedPlayers[0]?.id || '',
        player2: selectedPlayers[1]?.id || '',
        player3: selectedPlayers[2]?.id || '',
        player4: selectedPlayers[3]?.id || '',
        player5: selectedPlayers[4]?.id || '',
        rating1: selectedPlayers[0]?.rating || 5,
        rating2: selectedPlayers[1]?.rating || 5,
        rating3: selectedPlayers[2]?.rating || 5,
        rating4: selectedPlayers[3]?.rating || 5,
        rating5: selectedPlayers[4]?.rating || 5,
        kills1: selectedPlayers[0]?.kills || 0,
        kills2: selectedPlayers[1]?.kills || 0,
        kills3: selectedPlayers[2]?.kills || 0,
        kills4: selectedPlayers[3]?.kills || 0,
        kills5: selectedPlayers[4]?.kills || 0,
        deaths1: selectedPlayers[0]?.deaths || 0,
        deaths2: selectedPlayers[1]?.deaths || 0,
        deaths3: selectedPlayers[2]?.deaths || 0,
        deaths4: selectedPlayers[3]?.deaths || 0,
        deaths5: selectedPlayers[4]?.deaths || 0,
        assists1: selectedPlayers[0]?.assists || 0,
        assists2: selectedPlayers[1]?.assists || 0,
        assists3: selectedPlayers[2]?.assists || 0,
        assists4: selectedPlayers[3]?.assists || 0,
        assists5: selectedPlayers[4]?.assists || 0,
        lane1: selectedPlayers[0]?.lane || 'TOP',
        lane2: selectedPlayers[1]?.lane || 'JUNGLE',
        lane3: selectedPlayers[2]?.lane || 'MID',
        lane4: selectedPlayers[3]?.lane || 'ADC',
        lane5: selectedPlayers[4]?.lane || 'SUP',
      };

      console.log('Enviando partida com dados:', matchData);
      console.log('Jogadores selecionados:', selectedPlayers);

      await onAddMatch(matchData);
      setIsOpen(false);
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar partida:', error);
      setFormErrors([`Erro ao salvar partida: ${error instanceof Error ? error.message : 'Erro desconhecido'}`]);
    }
  };

  const availablePlayers = players.filter(player => 
    !selectedPlayers.find(sp => sp.id === player.id) &&
    player.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateKDA = (kills: number, deaths: number, assists: number) => {
    if (deaths === 0) return kills + assists;
    return ((kills + assists) / deaths).toFixed(2);
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 sm:bottom-8 right-4 sm:right-8 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="relative group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white p-4 sm:p-6 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 animate-pulse"
        >
          <Plus className="w-6 h-6 sm:w-8 sm:h-8" />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
        </button>
        <div className="absolute -top-12 sm:-top-16 right-0 bg-gray-900 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Adicionar Nova Partida
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-lg z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-7xl max-h-[98vh] sm:max-h-[95vh] overflow-y-auto border border-slate-700/50 backdrop-blur-xl">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 md:p-8 border-b border-slate-700/50 space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="relative">
              <Swords className="w-8 h-8 sm:w-10 sm:h-10 text-blue-400 animate-pulse" />
              <div className="absolute inset-0 w-8 h-8 sm:w-10 sm:h-10 bg-blue-400/20 rounded-full blur-lg"></div>
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">NOVA BATALHA</h2>
              <p className="text-gray-400 text-sm sm:text-base md:text-lg">
                {currentStep === 1 ? 'Selecione os invocadores (1-5 jogadores)' : 'Configure as estatísticas'}
              </p>
            </div>
          </div>
          
          {/* Step Indicator */}
          <div className="flex items-center justify-between sm:justify-end space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm sm:text-base ${
                currentStep >= 1 ? 'bg-blue-500 text-white' : 'bg-gray-600 text-gray-400'
              }`}>
                1
              </div>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm sm:text-base ${
                currentStep >= 2 ? 'bg-blue-500 text-white' : 'bg-gray-600 text-gray-400'
              }`}>
                2
            </div>
          </div>
          <button
              onClick={() => { setIsOpen(false); resetForm(); }}
              className="text-gray-400 hover:text-white transition-colors p-2 sm:p-3 hover:bg-slate-700/50 rounded-lg"
          >
              <X className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>
          </div>
        </div>

        {/* Step 1: Player Selection */}
        {currentStep === 1 && (
          <div className="p-4 sm:p-6 md:p-8">
            {/* Search Bar */}
            <div className="mb-6 md:mb-8">
              <div className="relative">
                <UserPlus className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar invocador..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg sm:rounded-xl pl-10 sm:pl-14 pr-3 sm:pr-4 py-3 sm:py-4 text-white text-base sm:text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Selected Players */}
            <div className="mb-6 md:mb-8">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 md:mb-4 flex items-center">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-blue-400" />
                Invocadores Selecionados ({selectedPlayers.length}/5)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
                {[...Array(5)].map((_, index) => {
                  const player = selectedPlayers[index];
                  return (
                    <div
                      key={index}
                      className={`h-24 sm:h-28 md:h-32 rounded-lg md:rounded-xl border-2 border-dashed flex items-center justify-center transition-all ${
                        player 
                          ? 'border-blue-500 bg-gradient-to-br from-blue-900/30 to-purple-900/30' 
                          : 'border-gray-600 bg-slate-800/30 hover:border-gray-500'
                      }`}
                    >
                      {player ? (
                        <div className="text-center">
                          <div className="text-xs font-bold text-yellow-400 mb-1">{player.lane}</div>
                          <img
                            src={player.avatar}
                            alt={player.name}
                            className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full mx-auto mb-1 md:mb-2 border-2 border-blue-400"
                          />
                          <p className="text-white font-semibold text-xs sm:text-sm truncate px-1">{player.name}</p>
                          <button
                            onClick={() => removePlayer(player.id)}
                            className="mt-1 text-red-400 hover:text-red-300 text-xs"
                          >
                            Remover
                          </button>
                        </div>
                      ) : (
                        <div className="text-center text-gray-500">
                          <div className="text-xs font-bold text-gray-400 mb-1">{lanes[index]}</div>
                          <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-gray-700/50 rounded-full mx-auto mb-1 md:mb-2 flex items-center justify-center">
                            <UserPlus className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
                          </div>
                          <p className="text-xs sm:text-sm">
                            {index < selectedPlayers.length ? 'Vazio' : 'Opcional'}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
                  </div>
              
              {selectedPlayers.length > 0 && selectedPlayers.length < 5 && (
                <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                  <p className="text-blue-400 text-sm">
                    💡 Você pode adicionar até {5 - selectedPlayers.length} jogador{5 - selectedPlayers.length > 1 ? 'es' : ''} a mais, ou continuar com {selectedPlayers.length} jogador{selectedPlayers.length > 1 ? 'es' : ''}.
                  </p>
                </div>
              )}
                </div>
                
            {/* Available Players */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-white mb-4">Invocadores Disponíveis</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-80 overflow-y-auto">
                {availablePlayers.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => handlePlayerSelect(player)}
                    disabled={selectedPlayers.length >= 5}
                    className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-xl p-4 border border-slate-700/30 hover:border-blue-500/50 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <img
                      src={player.avatar}
                      alt={player.name}
                      className="w-16 h-16 rounded-full mx-auto mb-3 border-2 border-gray-600"
                    />
                    <p className="text-white font-semibold">{player.name}</p>
                    <div className="text-xs text-gray-400 mt-1">
                      <p>Média: {player.averageRating.toFixed(1)}</p>
                      <p>Partidas: {player.totalMatches}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Statistics Input */}
        {currentStep === 2 && (
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {selectedPlayers.map((player, index) => (
                <div key={player.id} className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-xl p-6 border border-slate-700/30">
                  <div className="flex items-center space-x-3 mb-6">
                    <img
                      src={player.avatar}
                      alt={player.name}
                      className="w-12 h-12 rounded-full border-2 border-blue-400"
                    />
                    <div>
                      <h3 className="text-xl font-bold text-white">{player.name}</h3>
                      <p className="text-sm text-gray-400">Invocador #{index + 1}</p>
                    </div>
                </div>

                  {/* Performance Rating */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-yellow-400 mb-3 uppercase tracking-wide flex items-center">
                      <Star className="w-4 h-4 mr-2" />
                      Performance (1-10)
                    </label>
                    <div className="relative">
                  <input
                        type="range"
                    min="1"
                    max="10"
                    step="0.1"
                        value={player.rating}
                        onChange={(e) => updatePlayerStats(player.id, 'rating', parseFloat(e.target.value))}
                        className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>1</span>
                        <span className="text-yellow-400 font-bold text-lg">{player.rating}</span>
                        <span>10</span>
                      </div>
                    </div>
                </div>

                  {/* KDA Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                      <label className="block text-sm font-semibold text-green-400 mb-2 uppercase tracking-wide flex items-center">
                        <Target className="w-4 h-4 mr-1" />
                        Kills
                      </label>
                    <input
                      type="number"
                      min="0"
                        max="99"
                        value={player.kills}
                        onChange={(e) => updatePlayerStats(player.id, 'kills', parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-700/50 border border-green-500/30 rounded-lg px-4 py-3 text-white text-center text-xl font-bold focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                      <label className="block text-sm font-semibold text-red-400 mb-2 uppercase tracking-wide flex items-center">
                        <X className="w-4 h-4 mr-1" />
                        Deaths
                      </label>
                    <input
                      type="number"
                      min="0"
                        max="99"
                        value={player.deaths}
                        onChange={(e) => updatePlayerStats(player.id, 'deaths', parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-700/50 border border-red-500/30 rounded-lg px-4 py-3 text-white text-center text-xl font-bold focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                      <label className="block text-sm font-semibold text-blue-400 mb-2 uppercase tracking-wide flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        Assists
                      </label>
                    <input
                      type="number"
                      min="0"
                        max="99"
                        value={player.assists}
                        onChange={(e) => updatePlayerStats(player.id, 'assists', parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-700/50 border border-blue-500/30 rounded-lg px-4 py-3 text-white text-center text-xl font-bold focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  {/* KDA Ratio */}
                  <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">KDA RATIO</p>
                    <p className="text-2xl font-bold text-purple-400">
                      {calculateKDA(player.kills, player.deaths, player.assists)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Errors */}
        {formErrors.length > 0 && (
          <div className="mx-8 mb-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
            <div className="flex items-center space-x-2 text-red-400">
              <AlertCircle className="w-5 h-5" />
              <h4 className="font-semibold">Erros encontrados:</h4>
              </div>
            <ul className="mt-2 text-red-300 text-sm space-y-1">
              {formErrors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between items-center p-8 border-t border-slate-700/50">
          <div className="flex items-center space-x-4">
            {currentStep === 2 && (
              <button
                onClick={() => setCurrentStep(1)}
                className="px-6 py-3 text-gray-300 hover:text-white transition-colors font-semibold flex items-center space-x-2"
              >
                <ArrowRight className="w-5 h-5 rotate-180" />
                <span>Voltar</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => { setIsOpen(false); resetForm(); }}
              className="px-8 py-3 text-gray-300 hover:text-white transition-colors font-semibold"
            >
              Cancelar
            </button>
            <button
              onClick={validateAndProceed}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-8 py-3 rounded-lg transition-all duration-300 flex items-center space-x-3 font-semibold shadow-lg hover:shadow-xl"
            >
              {currentStep === 1 ? (
                <>
                  <ArrowRight className="w-5 h-5" />
                  <span>Continuar</span>
                </>
              ) : (
                <>
              <Save className="w-5 h-5" />
                  <span>Salvar Batalha</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Password Prompt para Confirmar Partida */}
      <PasswordPrompt
        isOpen={showPasswordPrompt}
        onClose={() => setShowPasswordPrompt(false)}
        onConfirm={handleSubmit}
        title="Confirmar Partida"
        description="Digite a senha para registrar esta partida"
      />
    </div>
  );
};