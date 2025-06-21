import React, { useState } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface RankResetPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const RankResetPrompt: React.FC<RankResetPromptProps> = ({ isOpen, onClose, onConfirm }) => {
  const [password, setPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== 'aeiou123') {
      setError('Senha incorreta!');
      return;
    }

    try {
      setIsResetting(true);
      await onConfirm();
      setPassword('');
      onClose();
    } catch (err) {
      setError('Erro ao resetar ranking');
    } finally {
      setIsResetting(false);
    }
  };

  const handleClose = () => {
    if (!isResetting) {
      setPassword('');
      setError('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-red-900/95 via-red-800/95 to-red-900/95 backdrop-blur-md rounded-2xl border-2 border-red-500/60 shadow-2xl shadow-red-500/30 max-w-md w-full overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-red-800/80 to-red-700/80 p-6 border-b-2 border-red-500/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-red-100">Resetar Ranking</h3>
                <p className="text-red-300/80 text-sm">Ação irreversível</p>
              </div>
            </div>
            {!isResetting && (
              <button
                onClick={handleClose}
                className="text-red-300 hover:text-red-100 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <div className="bg-red-800/40 border border-red-500/30 rounded-lg p-4 mb-4">
              <div className="flex items-start space-x-3">
                <Trash2 className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-200 font-semibold mb-1">Esta ação irá:</p>
                  <ul className="text-red-300/90 text-sm space-y-1">
                    <li>• Salvar o Top 3 da semana atual</li>
                    <li>• Apagar todos os dados do ranking</li>
                    <li>• Resetar todas as estatísticas</li>
                    <li>• Manter o histórico de tops semanais</li>
                  </ul>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-red-200 text-sm font-semibold mb-2">
                  Digite a senha para confirmar:
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-red-900/40 border border-red-500/40 rounded-lg text-white placeholder-red-400/60 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/30"
                  placeholder="Digite a senha..."
                  disabled={isResetting}
                  autoFocus
                />
              </div>

              {error && (
                <div className="bg-red-800/60 border border-red-500/50 rounded-lg p-3">
                  <p className="text-red-200 text-sm font-semibold">{error}</p>
                </div>
              )}

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isResetting}
                  className="flex-1 px-4 py-3 text-red-300 bg-red-900/30 border border-red-700/50 rounded-lg hover:bg-red-800/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isResetting || !password.trim()}
                  className="flex-1 px-4 py-3 text-white bg-red-600 border border-red-500 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isResetting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Resetando...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Resetar</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}; 