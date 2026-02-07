import { X, AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isLoading?: boolean;
}

export default function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  isLoading 
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-sm p-6 shadow-xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white">
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            
            <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
            <p className="text-zinc-400 text-sm mb-6 max-w-[260px]">
                {message}
            </p>

            <div className="flex w-full gap-3">
                <button
                    onClick={onClose}
                    disabled={isLoading}
                    className="flex-1 py-2 px-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium transition-colors disabled:opacity-50"
                >
                    Cancel
                </button>
                <button
                    onClick={onConfirm}
                    disabled={isLoading}
                    className="flex-1 py-2 px-4 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium transition-colors disabled:opacity-50"
                >
                    {isLoading ? 'Deleting...' : 'Delete'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}
