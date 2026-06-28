import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export function useCurrentUser() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const me = await base44.auth.me();
        if (cancelled) return;
        setUser(me);
        
        const profiles = await base44.entities.UserProfile.filter({ user_id: me.id });
        if (cancelled) return;
        
        if (profiles.length > 0) {
          setProfile(profiles[0]);
          // Update online status
          await base44.entities.UserProfile.update(profiles[0].id, { 
            is_online: true, 
            last_active: new Date().toISOString() 
          });
        } else {
          const newProfile = await base44.entities.UserProfile.create({
            user_id: me.id,
            display_name: me.full_name || me.email?.split('@')[0] || 'Người dùng',
            avatar_url: '',
            is_online: true,
            last_active: new Date().toISOString()
          });
          setProfile(newProfile);
        }
      } catch (e) {
        // not logged in
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();

    // Heartbeat: update last_active every 30s
    let heartbeat;
    let profileId = null;
    const startHeartbeat = (pid) => {
      profileId = pid;
      heartbeat = setInterval(() => {
        if (profileId) {
          base44.entities.UserProfile.update(profileId, {
            is_online: true,
            last_active: new Date().toISOString()
          }).catch(() => {});
        }
      }, 30000);
    };
    // poll profile state to start heartbeat once loaded
    const checkInterval = setInterval(() => {
      if (profile) {
        startHeartbeat(profile.id);
        clearInterval(checkInterval);
      }
    }, 1000);

    // Set offline on unload
    const handleUnload = () => {
      if (profileId) {
        base44.entities.UserProfile.update(profileId, {
          is_online: false,
          last_active: new Date().toISOString()
        }).catch(() => {});
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      cancelled = true;
      clearInterval(heartbeat);
      clearInterval(checkInterval);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);

  return { user, profile, setProfile, loading };
}
