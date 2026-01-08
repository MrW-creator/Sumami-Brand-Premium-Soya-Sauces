import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase/client';
import { StoreSettings } from '../types';

interface AdminDashboardProps {
    onSettingsUpdated?: () => void;
    initialSettings?: StoreSettings;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onSettingsUpdated }) => {
  const [savingSettings, setSavingSettings] = useState(false);
  const [settings, setSettings] = useState<StoreSettings>({
      yoco_test_key: '',
      yoco_live_key: '',
      is_live_mode: false,
      facebook_url: '',
      instagram_url: '',
      pinterest_url: '',
      youtube_url: '',
      tiktok_url: ''
  });

  useEffect(() => {
      // Fetch initial settings when dashboard mounts
      const fetchSettings = async () => {
          if (!supabase) return;
          const { data } = await supabase.from('store_settings').select('*').single();
          if (data) setSettings(data);
      };
      fetchSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value, type, checked } = e.target;
      setSettings(prev => ({
          ...prev,
          [name]: type === 'checkbox' ? checked : value
      }));
  };

  const saveSettings = async () => {
    if (!supabase) return;
    setSavingSettings(true);
    try {
        // Upsert logic for ID 1
        // CRITICAL FIX: Trim whitespace from keys to prevent " pk_test" errors
        const { error } = await supabase.from('store_settings').upsert({
            id: 1, // Always update row 1
            yoco_test_key: settings.yoco_test_key.trim(),
            yoco_live_key: settings.yoco_live_key.trim(),
            is_live_mode: settings.is_live_mode,
            facebook_url: settings.facebook_url?.trim(),
            instagram_url: settings.instagram_url?.trim(),
            pinterest_url: settings.pinterest_url?.trim(),
            youtube_url: settings.youtube_url?.trim(),
            tiktok_url: settings.tiktok_url?.trim()
        });

        if (error) throw error;

        // TRIGGER APP REFRESH
        if (onSettingsUpdated) {
            onSettingsUpdated();
        }

        alert("Settings Saved! The app will now use the new configuration.");
    } catch (err: any) {
        alert("Failed to save settings: " + err.message);
    } finally {
        setSavingSettings(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg max-w-2xl mx-auto my-8">
      <h2 className="text-2xl font-bold mb-6">Store Configuration</h2>
      
      <div className="space-y-4">
          <div>
              <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    name="is_live_mode" 
                    checked={settings.is_live_mode} 
                    onChange={handleChange}
                    className="w-5 h-5"
                  />
                  <span className="font-bold">Enable Live Mode (Real Payments)</span>
              </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Yoco Live Key</label>
                <input 
                    type="text" 
                    name="yoco_live_key" 
                    value={settings.yoco_live_key} 
                    onChange={handleChange} 
                    className="w-full mt-1 border rounded p-2"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Yoco Test Key</label>
                <input 
                    type="text" 
                    name="yoco_test_key" 
                    value={settings.yoco_test_key} 
                    onChange={handleChange} 
                    className="w-full mt-1 border rounded p-2"
                />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Facebook URL</label>
                <input type="text" name="facebook_url" value={settings.facebook_url} onChange={handleChange} className="w-full mt-1 border rounded p-2" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Instagram URL</label>
                <input type="text" name="instagram_url" value={settings.instagram_url} onChange={handleChange} className="w-full mt-1 border rounded p-2" />
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700">Pinterest URL</label>
                <input type="text" name="pinterest_url" value={settings.pinterest_url} onChange={handleChange} className="w-full mt-1 border rounded p-2" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">YouTube URL</label>
                <input type="text" name="youtube_url" value={settings.youtube_url} onChange={handleChange} className="w-full mt-1 border rounded p-2" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">TikTok URL</label>
                <input type="text" name="tiktok_url" value={settings.tiktok_url} onChange={handleChange} className="w-full mt-1 border rounded p-2" />
            </div>
          </div>

          <button 
            onClick={saveSettings} 
            disabled={savingSettings}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {savingSettings ? 'Saving...' : 'Save Settings'}
          </button>
      </div>
    </div>
  );
};

export default AdminDashboard;