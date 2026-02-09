import { useState } from 'react';
import { Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase/client';

interface NewsletterSignupProps {
  source?: string; // Track where the signup came from (e.g., 'footer', 'popup', 'checkout')
  className?: string;
}

export default function NewsletterSignup({ source = 'website', className = '' }: NewsletterSignupProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.toLowerCase());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate email
    if (!email || !validateEmail(email)) {
      setStatus('error');
      setMessage('Please enter a valid email address');
      return;
    }

    setStatus('loading');

    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Insert subscriber into database
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .insert([
          {
            email: email.toLowerCase().trim(),
            source,
            subscribed_at: new Date().toISOString(),
          },
        ])
        .select();

      if (error) {
        // Check if email already exists
        if (error.code === '23505') {
          setStatus('error');
          setMessage('You\'re already subscribed! 🎉');
        } else {
          throw error;
        }
      } else {
        setStatus('success');
        setMessage('Thanks for subscribing! Check your inbox for your free cookbook.');
        setEmail('');

        // Send welcome email
        try {
          await supabase.functions.invoke('send-newsletter-welcome', {
            body: { email: email.toLowerCase().trim() },
          });
        } catch (emailError) {
          console.error('Failed to send welcome email:', emailError);
          // Don't show error to user - they're still subscribed
        }

        // Reset after 5 seconds
        setTimeout(() => {
          setStatus('idle');
          setMessage('');
        }, 5000);
      }
    } catch (error: any) {
      console.error('Newsletter signup error:', error);
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    }
  };

  return (
    <div className={`newsletter-signup ${className}`}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              disabled={status === 'loading' || status === 'success'}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={status === 'loading' || status === 'success'}
            className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-semibold rounded-lg hover:from-amber-700 hover:to-amber-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shadow-md hover:shadow-lg"
          >
            {status === 'loading' ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Subscribing...
              </span>
            ) : status === 'success' ? (
              <span className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Subscribed!
              </span>
            ) : (
              'Get Free Cookbook'
            )}
          </button>
        </div>

        {/* Status Message */}
        {message && (
          <div
            className={`flex items-center gap-2 text-sm p-3 rounded-lg ${
              status === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {status === 'success' ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <span>{message}</span>
          </div>
        )}

        {/* Privacy Note */}
        {status === 'idle' && (
          <p className="text-xs text-gray-500 text-center">
            By subscribing, you agree to receive marketing emails. Unsubscribe anytime.
          </p>
        )}
      </form>
    </div>
  );
}
