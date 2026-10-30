import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { DEFAULT_FAMILY_MEMBERS } from '../data';
import * as api from '../services/api';

const AuthContext = createContext(null);

const COLOR_PALETTE = ['#5F8D75', '#E88D67', '#7BA7C2', '#C49B6F', '#9381FF', '#F15BB5'];

const DEFAULT_FAMILY = {
  id: 'family-main',
  name: 'บ้านสุขใจ (Family Home)',
  code: 'HOME-2026',
  adminMemberId: 'member-fluke',
};

function getStoredMembers() {
  try {
    const data = localStorage.getItem('homespace-members');
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Strip out old mock members (member-dad, member-mom, member-sister, member-little)
        const filtered = parsed.filter(
          m => m.id === 'member-fluke' || m.phone === '0615678160' || (m.id !== 'member-dad' && m.id !== 'member-mom' && m.id !== 'member-sister' && m.id !== 'member-little')
        );
        if (filtered.length > 0) {
          return filtered;
        }
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
  try {
    // If URL has invite or join parameter, do NOT auto-login as anyone!
    if (typeof window !== 'undefined' && window.location.search) {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('invite') || urlParams.has('join') || urlParams.has('code')) {
        return null;
      }
    }

    const phone = localStorage.getItem('homespace-current-phone');
    if (!phone) return null;

    // Filter out old mock phones (dad, mom, sister, little)
    if (phone === '0811111111' || phone === '0822222222' || phone === '0833333333' || phone === '0844444444') {
      localStorage.removeItem('homespace-current-phone');
      return null;
    }

    return phone;
  } catch {
    return null;
  }
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
  const [families, setFamilies] = useState([DEFAULT_FAMILY]);
  const [currentFamily, setCurrentFamily] = useState(DEFAULT_FAMILY);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Sync data with backend SQLite database
  const refreshMembers = useCallback(async () => {
    try {
      const backendMembers = await api.fetchMembers();
      if (Array.isArray(backendMembers) && backendMembers.length > 0) {
        setMembers(backendMembers);
        saveMembers(backendMembers);
      }
    } catch (err) {
      console.warn('Backend fetch members warning:', err.message);
    }
  }, []);

  const refreshFamilies = useCallback(async () => {
    try {
      const fList = await api.fetchFamilies();
      if (Array.isArray(fList) && fList.length > 0) {
        setFamilies(fList);
        setCurrentFamily(fList[0]);
      }
    } catch (err) {
      console.warn('Backend fetch families warning:', err.message);
    }
  }, []);

  const refreshPendingRequests = useCallback(async (famId) => {
    const targetId = famId || currentFamily?.id || 'family-main';
    try {
      const reqs = await api.fetchFamilyRequests(targetId);
      if (Array.isArray(reqs)) {
        setPendingRequests(reqs);
      }
    } catch (err) {
      console.warn('Backend fetch requests warning:', err.message);
    }
  }, [currentFamily]);

  // Initial load
  useEffect(() => {
    let isMounted = true;
    async function init() {
      await refreshMembers();
      await refreshFamilies();
    }
    init();
    return () => { isMounted = false; };
  }, [refreshMembers, refreshFamilies]);

  useEffect(() => {
    saveMembers(members);
  }, [members]);

  useEffect(() => {
    saveCurrentPhone(currentPhone);
  }, [currentPhone]);

  // Current active user
  const currentUser = currentPhone
    ? members.find(m => m.phone === currentPhone) || null
    : null;

  // Poll or refresh pending requests if user is Admin
  useEffect(() => {
    if (currentUser?.isAdmin || currentUser?.role?.includes('พ่อ') || currentUser?.role?.includes('แม่')) {
      refreshPendingRequests(currentFamily?.id);
      const timer = setInterval(() => {
        refreshPendingRequests(currentFamily?.id);
      }, 15000);
      return () => clearInterval(timer);
    }
  }, [currentUser, currentFamily, refreshPendingRequests]);

  const findMemberByPhone = useCallback((phone) => {
    const clean = phone.replace(/\D/g, '');
    return members.find(m => m.phone.replace(/\D/g, '') === clean) || null;
  }, [members]);

  // OTP Functions
  const sendOtp = useCallback(async (phone) => {
    const cleanPhone = phone.replace(/\D/g, '');
    try {
      const res = await api.sendOtp(cleanPhone);
      return res;
    } catch (err) {
      // Local demo fallback
      const demoOtp = '123456';
      return {
        success: true,
        phone: cleanPhone,
        otp: demoOtp,
        message: 'รหัส OTP (จำลอง): ' + demoOtp,
      };
    }
  }, []);

  const verifyOtp = useCallback(async (phone, code) => {
    const cleanPhone = phone.replace(/\D/g, '');
    try {
      const res = await api.verifyOtp(cleanPhone, code);
      return res;
    } catch (err) {
      if (code === '123456') {
        const existing = members.find(m => m.phone.replace(/\D/g, '') === cleanPhone);
        return {
          success: true,
          verified: true,
          isExisting: !!existing,
          member: existing || null,
          status: existing ? (existing.status || 'active') : 'new',
        };
      }
      throw err;
    }
  }, [members]);

  // Register with pending approval request
  const registerWithRequest = useCallback(async (data) => {
    const cleanPhone = data.phone.replace(/\D/g, '');
    try {
      const res = await api.registerWithRequest({
        ...data,
        phone: cleanPhone,
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
        return res;
      }
    } catch (err) {
      console.warn('Register request via API failed, saving locally:', err);
    }

    // Local fallback
    const newMember = {
      id: `member-${Date.now()}`,
      phone: cleanPhone,
      name: data.name,
      role: data.role || 'สมาชิกในบ้าน',
      avatar: data.avatar || '😊',
      avatarType: data.avatarType || 'emoji',
      avatarImage: data.avatarImage || null,
      familyId: data.familyId || currentFamily?.id || 'family-main',
      status: 'pending',
      isAdmin: 0,
      createdAt: Date.now(),
    };

    setMembers(prev => [...prev, newMember]);
    setPendingRequests(prev => [...prev, newMember]);
    setCurrentPhone(cleanPhone);
    return { success: true, member: newMember, status: 'pending' };
  }, [currentFamily]);

  // Admin Approval
  const approveRequest = useCallback(async (memberId) => {
    try {
      await api.approveMemberRequest(currentFamily?.id || 'family-main', memberId, currentUser?.phone);
    } catch (err) {
      console.warn('Approve member API warning:', err);
    }

    setMembers(prev =>
      prev.map(m => (m.id === memberId ? { ...m, status: 'active' } : m))
    );
    setPendingRequests(prev => prev.filter(r => r.id !== memberId));
    await refreshMembers();
  }, [currentFamily, currentUser, refreshMembers]);

  // Admin Reject
  const rejectRequest = useCallback(async (memberId) => {
    try {
      await api.rejectMemberRequest(currentFamily?.id || 'family-main', memberId, currentUser?.phone);
    } catch (err) {
      console.warn('Reject member API warning:', err);
    }

    setMembers(prev =>
      prev.map(m => (m.id === memberId ? { ...m, status: 'rejected' } : m))
    );
    setPendingRequests(prev => prev.filter(r => r.id !== memberId));
    await refreshMembers();
  }, [currentFamily, currentUser, refreshMembers]);


  // Remove member from family
  const removeMember = useCallback(async (memberId) => {
    try {
      await api.deleteMember(memberId);
    } catch (err) {
      console.warn('Delete member API warning:', err);
    }

    setMembers(prev => {
      const updated = prev.filter(m => m.id !== memberId);
      saveMembers(updated);
      return updated;
    });

    if (currentUser?.id === memberId) {
      setCurrentPhone(null);
    }

    try {
      await refreshMembers();
    } catch {
      // ignore
    }
  }, [currentUser, refreshMembers]);

  const loginWithPin = useCallback(async (phone, pin) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const cleanPin = String(pin).replace(/\D/g, '').slice(0, 4);

    try {
      const res = await api.loginWithPin(cleanPhone, cleanPin);
      if (res?.member) {
        if (res.member.status === 'active') {
          setCurrentPhone(cleanPhone);
        }
        return res;
      }
    } catch (err) {
      if (err.status === 403 || err.data?.status === 'pending') {
        setCurrentPhone(cleanPhone);
        return { status: 'pending', member: err.data?.member };
      }
      console.warn('Login via API warning, trying local:', err.message);
      const member = members.find(m => (m.phone || '').replace(/\D/g, '') === cleanPhone);
      if (member) {
        if (member.status === 'pending') {
          setCurrentPhone(cleanPhone);
          return { status: 'pending', member };
        }
        if (member.pin && member.pin !== cleanPin) {
          throw new Error('รหัส PIN 4 หลักไม่ถูกต้อง กรุณาลองใหม่');
        }
        setCurrentPhone(cleanPhone);
        return { success: true, member };
      }
      throw err;
    }
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
    isPending: currentUser?.status === 'pending',
    isApproved: currentUser?.status === 'active',
    isAdmin: Boolean(
      currentUser && (
        currentUser?.isAdmin === 1 ||
        currentUser?.isAdmin === true ||
        currentFamily?.adminMemberId === currentUser?.id ||
        currentUser?.role?.includes('เจ้าบ้าน') ||
        currentUser?.role?.includes('หัวหน้า') ||
        currentUser?.role?.includes('พ่อ') ||
        currentUser?.role?.includes('แม่') ||
        currentUser?.role?.toLowerCase().includes('admin') ||
        members.filter(m => m.status !== 'pending').length <= 1
      )
    ),
    families,
    currentFamily,
    pendingRequests,
    sendOtp,
    verifyOtp,
    registerWithRequest,
    approveRequest,
    rejectRequest,
    removeMember,
    refreshMembers,
    refreshPendingRequests,
    findMemberByPhone,
    login,
    loginWithPin,
    logout,
    updateProfile,
    setCurrentPhone,
    setCurrentFamily,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
