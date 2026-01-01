import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { Product } from '../types';

interface BundleBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (selectedIds: string[]) => void;
  products: Product[];
}

const BundleBuilder: React.FC<BundleBuilderProps> = ({ isOpen, onClose, onComplete, products }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const MAX_SELECTION = 3;

  const toggleProduct = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(item => item !== id));
    } else {
      if (selectedIds.length < MAX_SELECTION) {
        setSelectedIds(prev => [...prev, id]);
      }
    }
  };

  const handleComplete = () => {
    if (selectedIds.length === MAX_SELECTION) {
      onComplete(selectedIds);
      setSelectedIds([]);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative z-10 animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h3 className="text-2xl font-black text-gray-900">Build Your Trio</h3>
            <p className="text-gray-500">Select exactly {MAX_SELECTION} flavours to complete your box.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.filter(p => p.category === 'sauce').map(product => {
              const isSelected = selectedIds.includes(product.id);
              const isDisabled = !isSelected && selectedIds.length >= MAX_SELECTION;

              return (
                <div 
                  key={product.id}
                  onClick={() => !isDisabled && toggleProduct(product.id)}
                  className={`
                    relative cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-200 flex items-center p-2 gap-4
                    ${isSelected ? 'border-amber-600 bg-amber-50 shadow-md' : 'border-white bg-white hover:border-gray-300'}
                    ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-bold text-sm ${isSelected ? 'text-amber-900' : 'text-gray-900'}`}>{product.name}</h4>
                    <p className="text-xs text-gray-500 line-clamp-1">{product.subName}</p>
                  </div>
                  <div className={`
                    w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                    ${isSelected ? 'bg-amber-600 border-amber-600' : 'border-gray-300'}
                  `}>
                    {isSelected && <Check className="w-4 h-4 text-white" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-white flex justify-between items-center">
          <div className="text-sm font-medium">
            Selected: <span className="font-bold text-amber-600 text-lg">{selectedIds.length} / {MAX_SELECTION}</span>
          </div>
          <button
            onClick={handleComplete}
            disabled={selectedIds.length !== MAX_SELECTION}
            className={`
              px-8 py-3 rounded-xl font-bold transition-all shadow-lg
              ${selectedIds.length === MAX_SELECTION 
                ? 'bg-amber-600 hover:bg-amber-700 text-white hover:scale-105 active:scale-95' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
            `}
          >
            Add to Cart - R315
          </button>
        </div>
      </div>
    </div>
  );
};

export default BundleBuilder;