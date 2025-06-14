import React, { useState, useEffect } from 'react';

interface PlayerAvatarProps {
  playerName: string;
  playerAvatar?: string;
  size?: string;
  className?: string;
}

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({ 
  playerName, 
  playerAvatar, 
  size = "w-16 h-16",
  className = ""
}) => {
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Lista de fallbacks em ordem de prioridade
  const fallbackSources = [
    playerAvatar,
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(playerName)}&backgroundColor=b6e3f4,c0aede,d1d4f9&clothesColor=9287ff,6bcf7f,fd9843`,
    `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(playerName)}&backgroundColor=b6e3f4,c0aede,d1d4f9`,
    `https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(playerName)}&backgroundColor=b6e3f4,c0aede,d1d4f9`,
    `https://ui-avatars.com/api/?name=${encodeURIComponent(playerName)}&background=1e293b&color=fff&size=128&bold=true`
  ].filter(Boolean);

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    console.log(`[PlayerAvatar] Iniciando carregamento para ${playerName}`);
    console.log(`[PlayerAvatar] Avatar original: ${playerAvatar}`);
    console.log(`[PlayerAvatar] Fallbacks disponíveis: ${fallbackSources.length}`);
    
    if (fallbackSources.length > 0) {
      setCurrentSrc(fallbackSources[0] || '');
      setCurrentIndex(0);
      setHasError(false);
      setIsLoading(true);
    }
  }, [playerName, playerAvatar]);

  const handleError = () => {
    console.log(`[PlayerAvatar] Erro ao carregar: ${currentSrc}`);
    console.log(`[PlayerAvatar] Tentativa ${currentIndex + 1} de ${fallbackSources.length}`);
    
    if (currentIndex < fallbackSources.length - 1) {
      const nextIndex = currentIndex + 1;
      const nextSrc = fallbackSources[nextIndex];
      console.log(`[PlayerAvatar] Tentando próximo fallback: ${nextSrc}`);
      
      setCurrentIndex(nextIndex);
      setCurrentSrc(nextSrc || '');
      setIsLoading(true);
    } else {
      console.log(`[PlayerAvatar] Todos os fallbacks falharam, usando div`);
      setHasError(true);
      setIsLoading(false);
    }
  };

  const handleLoad = () => {
    console.log(`[PlayerAvatar] Imagem carregada com sucesso: ${currentSrc}`);
    setIsLoading(false);
    setHasError(false);
  };

  if (hasError || !currentSrc) {
    // Fallback final - div com inicial
    return (
      <div className={`${size} ${className} bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-white font-bold shadow-lg`}>
        <span className="text-xl">
          {playerName ? playerName.charAt(0).toUpperCase() : '?'}
        </span>
      </div>
    );
  }

  return (
    <div className={`${size} relative`}>
      {isLoading && (
        <div className={`${size} ${className} bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-white animate-pulse`}>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <img
        src={currentSrc}
        alt={playerName}
        className={`${size} ${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={handleLoad}
        onError={handleError}
        style={{ display: isLoading ? 'none' : 'block' }}
      />
    </div>
  );
}; 