// src/components/ModelSelectorModal.tsx
import { X } from 'lucide-react';

interface ModelSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentModel: string;
  onSelectModel: (model: string) => void;
}

const models = [
  // Auto
  { value: 'auto', label: 'Auto (Best Model)', group: 'Auto' },

  // Grok 4 Family
  { value: 'grok-4', label: 'Grok 4 (Latest)', group: 'Grok 4' },
  { value: 'grok-4-fast-reasoning', label: 'Grok 4 Fast (Reasoning)', group: 'Grok 4' },
  { value: 'grok-4-fast-non-reasoning', label: 'Grok 4 Fast (Non-Reasoning)', group: 'Grok 4' },

  // Specialized
  { value: 'grok-code-fast-1', label: 'Grok Code Fast 1', group: 'Specialized' },

  // Grok 3 Family
  { value: 'grok-3', label: 'Grok 3', group: 'Grok 3' },
  { value: 'grok-3-fast', label: 'Grok 3 Fast', group: 'Grok 3' },
  { value: 'grok-3-mini', label: 'Grok 3 Mini', group: 'Grok 3' },
  { value: 'grok-3-mini-fast', label: 'Grok 3 Mini Fast', group: 'Grok 3' },

  // Grok 2 Family
  { value: 'grok-2-latest', label: 'Grok 2 (Latest)', group: 'Grok 2' },
  { value: 'grok-2-1212', label: 'Grok 2 (December 2024)', group: 'Grok 2' },

  // Legacy
  { value: 'grok-beta', label: 'Grok Beta', group: 'Legacy' },
];

const groupedModels = models.reduce((acc, model) => {
  if (!acc[model.group]) acc[model.group] = [];
  acc[model.group].push(model);
  return acc;
}, {} as Record<string, typeof models>);

export function ModelSelectorModal({ isOpen, onClose, currentModel, onSelectModel }: ModelSelectorModalProps) {
  if (!isOpen) return null;

  const handleSelect = (model: string) => {
    onSelectModel(model);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Select Model</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
            <X size={24} />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-6">
          {Object.entries(groupedModels).map(([group, groupModels]) => (
            <div key={group}>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">{group}</h3>
              <div className="space-y-1">
                {groupModels.map((model) => (
                  <button
                    key={model.value}
                    onClick={() => handleSelect(model.value)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                      currentModel === model.value
                        ? 'bg-blue-100 text-blue-900 font-medium'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{model.label}</span>
                      {currentModel === model.value && <span className="text-blue-600 text-sm">Selected</span>}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}