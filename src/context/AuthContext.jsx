import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { DEFAULT_FAMILY_MEMBERS } from '../data';
import * as api from '../services/api';

const AuthContext = createContext(null);

const COLOR_PALETTE = ['#5F8D75', '#E88D67', '#7BA7C2', '#C49B6F', '#9381FF', '#F15BB5'];

function getStoredMembers() {
  try {
    const data = localStorage.getItem('homespace-members');
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    return DEFAULT_FAMILY_MEMBERS;
  } catch {
    return DEFAULT_FAMILY_MEMBERS;
  }
}

function saveMembers(members) {
  try {
    localStorage.setItem('homespace-members', JSON.stringify(members));
  } catch (e) {
    console.error('Save members error', e);
  }
}

function getStoredCurrentPhone() {
  const phone = localStorage.getItem('homespace-current-phone');
  return phone || DEFAULT_FAMILY_MEMBERS[0].phone;
}

function saveCurrentPhone(phone) {
  if (phone) {
    localStorage.setItem('homespace-current-phone', phone);
  } else {
    localStorage.removeItem('homespace-current-phone');
  }
}

export function AuthProvider({ children }) {
  const [members, setMembers] = useState(getStoredMembers);
  const [currentPhone, setCurrentPhone] = useState(getStoredCurrentPhone);
  const [isLoading, setIsLoading] = useState(false);

  // Sync with real backend SQLite database on mount
  useEffect(() => {
    let isMounted = true;
    async function loadMembersFromBackend() {
      try {
        const backendMembers = await api.fetchMembers();
        if (isMounted && Array.isArray(backendMembers) && backendMembers.length > 0) {
          setMembers(backendMembers);
          saveMembers(backendMembers);
        }
      } catch (err) {
        console.warn('Backend connection falling back to local storage cache:', err.message);
      }
    }
    loadMembersFromBackend();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    saveMembers(members);
  }, [members]);

  useEffect(() => {
    saveCurrentPhone(currentPhone);
  }, [currentPhone]);

  const currentUser = currentPhone
    ? members.find(m => m.phone === currentPhone) || members[0]
    : members[0];

  const findMemberByPhone = useCallback((phone) => {
    const clean = phone.replace(/\D/g, '');
    return members.find(m => m.phone.replace(/\D/g, '') === clean) || null;
  }, [members]);

  const register = useCallback(async (phone, name, role, avatarData) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const color = COLOR_PALETTE[members.length % COLOR_PALETTE.length];
    
    try {
      const res = await api.registerMember({
        phone: cleanPhone,
        name,
        role: role || 'สมาชิกในบ้าน',
        avatar: avatarData?.avatar || '😊',
        avatarType: avatarData?.avatarType || 'emoji',
        avatarImage: avatarData?.avatarImage || null,
        color,
      });

      if (res?.member) {
        setMembers(prev => {
          const idx = prev.findIndex(m => m.phone.replace(/\D/g, '') === cleanPhone);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = res.member;
            return copy;
          }
          return [...prev, res.member];
        });
        setCurrentPhone(cleanPhone);
        return res.member;
      }
    } catch (err) {
      console.warn('Register via API failed, saving locally:', err);
    }

    // Local fallback
    const existingIndex = members.findIndex(m => m.phone.replace(/\D/g, '') === cleanPhone);
    let updatedMembers = [];
    let savedMember = null;

    if (existingIndex >= 0) {
      savedMember = {
        ...members[existingIndex],
        name,
        role: role || 'สมาชิกในบ้าน',
        avatar: avatarData?.avatar || members[existingIndex].avatar,
        avatarType: avatarData?.avatarType || members[existingIndex].avatarType,
        avatarImage: avatarData?.avatarImage !== undefined ? avatarData.avatarImage : members[existingIndex].avatarImage,
      };
      updatedMembers = [...members];
      updatedMembers[existingIndex] = savedMember;
    } else {
      savedMember = {
        id: `member-${Date.now()}`,
        phone: cleanPhone,
        name,
        role: role || 'สมาชิกในบ้าน',
        avatar: avatarData?.avatar || '😊',
        avatarType: avatarData?.avatarType || 'emoji',
        avatarImage: avatarData?.avatarImage || null,
        color,
        createdAt: Date.now(),
      };
      updatedMembers = [...members, savedMember];
    }

    setMembers(updatedMembers);
    setCurrentPhone(cleanPhone);
    return savedMember;
  }, [members]);

  const login = useCallback(async (phone) => {
    const cleanPhone = phone.replace(/\D/g, '');
    
    try {
      const res = await api.loginWithPhone(cleanPhone);
      if (res?.member) {
        setCurrentPhone(cleanPhone);
        return res.member;
      }
    } catch (err) {
      console.warn('Login via API warning, trying local:', err);
    }

    const member = members.find(m => m.phone.replace(/\D/g, '') === cleanPhone);
    if (member) {
      setCurrentPhone(cleanPhone);
      return member;
    }
    return null;
  }, [members]);

  const logout = useCallback(() => {
    setCurrentPhone(null);
  }, []);

  const updateProfile = useCallback(async (phone, updates) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const member = members.find(m => m.phone.replace(/\D/g, '') === cleanPhone);

    // Optimistic local update
    setMembers(prev =>
      prev.map(m =>
        m.phone.replace(/\D/g, '') === cleanPhone ? { ...m, ...updates } : m
      )
    );

    if (member?.id) {
      try {
        await api.updateMember(member.id, updates);
      } catch (err) {
        console.warn('Failed to update member in backend SQLite:', err);
      }
    }
  }, [members]);

  const value = {
    members,
    currentUser,
    currentPhone,
    isLoggedIn: !!currentUser,
    findMemberByPhone,
    register,
    login,
    logout,
    updateProfile,
    setCurrentPhone,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
