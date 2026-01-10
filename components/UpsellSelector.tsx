
import React from 'react';
import { X, ShoppingBag, Plus } from 'lucide-react';
import { Product } from '../types';

interface UpsellSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (product: Product, variant: string) => void;
  products: Product[];
  variant: '3-Pack' | '6-Pack';
  shippingMarkup: number; // Added to support dynamic pricing
}

const UpsellSelector: React.FC<UpsellSelectorProps> = ({ isOpen, onClose, onSelect, products, variant, shippingMarkup }) => {
  if (!isOpen) return null;

  // Filter only sauces, exclude bundles
  const options = products.filter(p => p.category === 'sauce');
  const size = variant === '3-Pack' ? 3 : 6;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}></div>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative z-10 animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="bg-gray-900 p-6 text-white flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-2">
                <span className="bg-amber-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                    <ShoppingBag className="w-3 h-3" />
                    Add to Cart
                </span>
            </div>
            <h3 className="text-2xl md:text-3xl font-black">Choose Your {variant}</h3>
            <p className="text-gray-400 mt-1">
              Add one more {variant} to unlock your <strong className="text-amber-400">FREE Gift</strong>.
            </p>
          </div>
          <button onClick={onClose} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors">
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {options.map(product => {
              // Dynamic Price Calculation
              const dynamicPrice = (product.price * size) + shippingMarkup;
              
              return (
                <div 
                  key={product.id}
                  className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-gray-400 transition-all cursor-pointer flex flex-col"
                  onClick={() => onSelect(product, variant)}
                >
                  <div className="relative h-40 bg-gray-100 overflow-hidden">
                     <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                     <div className="absolute top-2 right-2 bg-white text-gray-900 text-xs font-bold px-2 py-1 rounded shadow-sm border border-gray-100">
                        R {dynamicPrice.toFixed(2)}
                     </div>
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                     <h4 className="font-bold text-gray-900 leading-tight mb-1">{product.name}</h4>
                     <p className="text-xs text-gray-500 line-clamp-2 mb-4">{product.description}</p>
                     
                     <div className="mt-auto">
                        <button className="w-full bg-white border-2 border-gray-900 text-gray-900 group-hover:bg-gray-900 group-hover:text-white font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm">
                           <Plus className="w-4 h-4" /> Add {variant}
                        </button>
                     </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpsellSelector;
