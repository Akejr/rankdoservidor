import React, { useState } from 'react';
import { Lock, X, Check } from 'lucide-react';

interface PasswordPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
}

export const PasswordPrompt: React.FC<PasswordPromptProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const correctPassword = 'aeiou123';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === correctPassword) {
      onConfirm();
      onClose();
      setPassword('');
      setError('');
    } else {
      setError('Senha incorreta!');
      setPassword('');
    }
  };

  const handleClose = () => {
    onClose();
    setPassword('');
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl sm:rounded-2xl shadow-2xl max-w-md w-full border border-slate-700/50">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-700/50">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
              <div className="absolute inset-0 w-5 h-5 sm:w-6 sm:h-6 bg-yellow-400/20 rounded-full blur-lg"></div>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">{title}</h2>
              <p className="text-gray-400 text-xs sm:text-sm">{description}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-slate-700/50 rounded-lg"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6">
          <div className="mb-4 sm:mb-6">
            <label className="block text-xs sm:text-sm font-semibold text-gray-300 mb-2 sm:mb-3 uppercase tracking-wide">
              Senha de Segurança
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite a senha..."
              className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-white text-center text-base sm:text-lg font-mono focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
              autoFocus
              required
            />
            
            {error && (
              <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-xs sm:text-sm font-semibold">{error}</p>
              </div>
            )}
          </div>

          <div className="flex space-x-2 sm:space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-3 sm:px-4 py-2 sm:py-3 text-gray-300 hover:text-white transition-colors font-semibold text-sm sm:text-base"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-all duration-300 flex items-center justify-center space-x-1 sm:space-x-2 font-semibold shadow-lg hover:shadow-xl text-sm sm:text-base"
            >
              <Check className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Confirmar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 