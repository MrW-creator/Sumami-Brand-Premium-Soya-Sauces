
import React from 'react';
import { X, Shield, Truck, FileText, RotateCcw } from 'lucide-react';

export type PolicyType = 'privacy' | 'terms' | 'shipping' | 'returns' | null;

interface LegalModalProps {
  isOpen: boolean;
  type: PolicyType;
  onClose: () => void;
}

const LegalModal: React.FC<LegalModalProps> = ({ isOpen, type, onClose }) => {
  if (!isOpen || !type) return null;

  const getContent = () => {
    switch (type) {
      case 'privacy':
        return {
          title: 'Privacy Policy',
          icon: <Shield className="w-6 h-6 text-amber-600" />,
          content: (
            <div className="space-y-4 text-gray-600 text-sm">
              <p><strong>1. Introduction</strong><br/>Sumami Brand respects your privacy and is committed to protecting your personal data. This privacy notice will inform you as to how we look after your personal data when you visit our landing page and buy our products.</p>
              <p><strong>2. Data We Collect</strong><br/>We may collect, use, store and transfer different kinds of personal data about you including: Identity Data (First name, last name), Contact Data (Email address, telephone number, delivery address), and Transaction Data (Details about payments).</p>
              <p><strong>3. How We Use Your Data</strong><br/>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data to process and deliver your order, and to manage our relationship with you.</p>
              <p><strong>4. Data Security</strong><br/>We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way. We use Yoco for secure payment processing and do not store credit card details on our servers.</p>
            </div>
          )
        };
      case 'terms':
        return {
          title: 'Terms of Service',
          icon: <FileText className="w-6 h-6 text-amber-600" />,
          content: (
            <div className="space-y-4 text-gray-600 text-sm">
              <p><strong>1. General</strong><br/>By accessing and placing an order with Sumami Brand, you confirm that you are in agreement with and bound by the terms of service contained in the Terms & Conditions outlined below.</p>
              <p><strong>2. Products</strong><br/>All products are subject to availability. We reserve the right to discontinue any product at any time. We make every effort to display as accurately as possible the colors and images of our products.</p>
              <p><strong>3. Returns & Refunds</strong><br/>Due to the perishable nature of our products, we do not accept returns on opened bottles. If your order arrives damaged, please contact us within 24 hours with photos, and we will arrange a replacement.</p>
              <p><strong>4. Pricing</strong><br/>Prices for our products are subject to change without notice. We reserve the right at any time to modify or discontinue the Service (or any part or content thereof) without notice at any time.</p>
            </div>
          )
        };
      case 'shipping':
        return {
          title: 'Shipping Policy',
          icon: <Truck className="w-6 h-6 text-amber-600" />,
          content: (
            <div className="space-y-4 text-gray-600 text-sm">
              <p><strong>1. Free Shipping</strong><br/>We are proud to offer FREE shipping on all orders placed through this exclusive offer page. The price you see is the price you pay.</p>
              <p><strong>2. Processing Time</strong><br/>Orders are processed within 1-2 business days. Orders are not shipped or delivered on weekends or holidays.</p>
              <p><strong>3. Delivery Estimates</strong><br/>Standard delivery usually takes 2-4 business days depending on your location in South Africa. Remote areas may take slightly longer.</p>
              <p><strong>4. Couriers</strong><br/>We use reliable local courier partners (The Courier Guy, Dawn Wing, etc.) to ensure your sauces arrive safely.</p>
            </div>
          )
        };
      case 'returns':
        return {
            title: 'Returns & Refunds',
            icon: <RotateCcw className="w-6 h-6 text-amber-600" />,
            content: (
                <div className="space-y-4 text-gray-600 text-sm">
                    <p><strong>1. Our Happiness Guarantee</strong><br/>We want you to love your Sumami experience. If you are not completely satisfied, please contact our support team so we can make it right.</p>
                    <p><strong>2. Damaged or Broken Items</strong><br/>If your order arrives damaged, leaking, or broken, please take a photo and WhatsApp or email us within 24 hours of delivery. We will dispatch a free replacement immediately—no questions asked.</p>
                    <p><strong>3. Returns on Unopened Items</strong><br/>You may return unopened, sealed bottles within 7 days of delivery for a full refund. Please note that return shipping costs will be for your account.</p>
                    <p><strong>4. Perishable Goods</strong><br/>For health and safety reasons, we cannot accept returns on opened bottles unless there is a specific quality defect.</p>
                </div>
            )
        };
      default:
        return { title: '', icon: null, content: null };
    }
  };

  const { title, icon, content } = getContent();

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col relative z-10 animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 p-2 rounded-lg">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500 hover:text-gray-900">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-8 overflow-y-auto">
          {content}
        </div>
        
        <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-gray-900 text-white rounded-lg font-bold hover:bg-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default LegalModal;
