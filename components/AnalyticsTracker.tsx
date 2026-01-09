
import React, { useEffect } from 'react';
import { StoreSettings } from '../types';

interface AnalyticsTrackerProps {
  settings: StoreSettings | null;
}

const AnalyticsTracker: React.FC<AnalyticsTrackerProps> = ({ settings }) => {
  
  useEffect(() => {
    if (!settings) return;

    // --- META PIXEL INJECTION ---
    if (settings.meta_pixel_id) {
        // Prevent duplicate injection
        if (!(window as any).fbq) {
            console.log(`Initializing Meta Pixel: ${settings.meta_pixel_id}`);
            
            // Standard Meta Pixel Snippet
            (function(f:any,b:any,e:any,v:any,n?:any,t?:any,s?:any)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)})(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            
            (window as any).fbq('init', settings.meta_pixel_id);
            (window as any).fbq('track', 'PageView');
        }
    }

    // --- GOOGLE ANALYTICS INJECTION ---
    if (settings.google_analytics_id) {
        if (!(window as any).gtag) {
             console.log(`Initializing Google Analytics: ${settings.google_analytics_id}`);
             
             // Create script tag
             const script = document.createElement('script');
             script.async = true;
             script.src = `https://www.googletagmanager.com/gtag/js?id=${settings.google_analytics_id}`;
             document.head.appendChild(script);

             // Initialize GTAG
             (window as any).dataLayer = (window as any).dataLayer || [];
             function gtag(...args: any[]) { (window as any).dataLayer.push(args); }
             (window as any).gtag = gtag;
             gtag('js', new Date());
             gtag('config', settings.google_analytics_id);
        }
    }

  }, [settings]);

  return null; // This component renders nothing visually
};

export default AnalyticsTracker;