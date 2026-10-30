import { useState } from 'react';
import {
  X,
  MagnifyingGlass,
  User,
  Heart,
  ChatCircle,
  Broom,
  Camera,
} from '@phosphor-icons/react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

function MemberAvatar({ member, size = 'md' }) {
  const sizeMap = {
    sm: 'w-8 h-8 text-sm rounded-full',
    md: 'w-10 h-10 text-base rounded-full',
  };

  if (member?.avatarType === 'image' && member?.avatarImage) {
    return (
      <img
        src={member.avatarImage}
        alt={member.name}
        className={`${sizeMap[size]} object-cover border border-[#ECE7DF] shadow-2xs shrink-0`}
      />
    );
  }

  return (
    <div
      className={`${sizeMap[size]} flex items-center justify-center border border-[#ECE7DF] shadow-2xs font-bold shrink-0 bg-[#FAF8F5]`}
    >
      {member?.avatar || '😊'}
    </div>
  );
}

export default function SearchModal({ isOpen, onClose, onSelectMember }) {
  const { members, currentUser } = useAuth();
  const { feedPosts } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const query = searchTerm.trim().toLowerCase();

  // Filter members
  const matchedMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(query) ||
      (m.role && m.role.toLowerCase().includes(query))
  );

  // Filter posts
  const matchedPosts = feedPosts.filter((p) => {
    if (!query) return true;
    const author = members.find((m) => m.id === p.memberId);
    return (
      (p.caption && p.caption.toLowerCase().includes(query)) ||
      (p.choreName && p.choreName.toLowerCase().includes(query)) ||
      (author && author.name.toLowerCase().includes(query))
    );
  });

  const handleSelectMember = (member) => {
    onClose();
    if (onSelectMember) {
      onSelectMember(member);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs select-none"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-3xl border border-[#ECE7DF] shadow-2xl w-full max-w-sm max-h-[85dvh] overflow-hidden animate-enter-rise text-[#2D2825] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="p-3.5 border-b border-[#ECE7DF] flex items-center gap-2 bg-white">
          <div className="flex-1 relative flex items-center">
            <MagnifyingGlass size={16} className="absolute left-3 text-[#9E958D]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาคนในบ้าน หรืองานบ้าน..."
              className="w-full pl-9 pr-8 py-2 bg-[#FAF8F5] rounded-full border border-[#ECE7DF] text-xs text-[#2D2825] placeholder:text-[#9E958D] focus:outline-none focus:border-[#5F8D75] focus:bg-white"
              autoFocus
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 text-xs text-[#9E958D] hover:text-[#2D2825]"
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#FAF8F5] hover:bg-[#ECE7DF] text-[#746C65] flex items-center justify-center text-xs"
          >
            <X size={15} weight="bold" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-4 no-scrollbar [scrollbar-width:none]">
          {/* 1. Family Members Section */}
          <div className="space-y-2">
            <span className="text-[11px] font-black text-[#746C65] uppercase tracking-wider block">
              สมาชิกครอบครัว ({matchedMembers.length})
            </span>

            <div className="space-y-1.5">
              {matchedMembers.map((member) => {
                const memberPostCount = feedPosts.filter((p) => p.memberId === member.id).length;
                const isMe = member.id === currentUser?.id;

                return (
                  <div
                    key={member.id}
                    onClick={() => handleSelectMember(member)}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-[#FAF8F5] hover:bg-[#EEF4F0] border border-[#ECE7DF] hover:border-[#5F8D75]/40 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <MemberAvatar member={member} size="sm" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-[#2D2825] truncate">
                            {member.name}
                          </span>
                          {isMe && (
                            <span className="text-[9px] bg-[#5F8D75] text-white px-1.5 py-0.2 rounded-md font-bold">
                              คุณ
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-[#746C65]">{member.role}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-right shrink-0">
                      <span className="text-[10px] text-[#5F8D75] font-bold">
                        {memberPostCount} โพสต์ →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Matched Posts Section */}
          {query && (
            <div className="space-y-2 pt-2 border-t border-[#ECE7DF]">
              <span className="text-[11px] font-black text-[#746C65] uppercase tracking-wider block">
                โพสต์ที่พบ ({matchedPosts.length})
              </span>

              <div className="space-y-2">
                {matchedPosts.map((post) => {
                  const author = members.find((m) => m.id === post.memberId);
                  const photoUrl = post.photo || post.afterImage || post.imageUrl;

                  return (
                    <div
                      key={post.id}
                      onClick={() => handleSelectMember(author)}
                      className="flex items-center gap-2.5 p-2 rounded-2xl bg-[#FAF8F5] hover:bg-[#EEF4F0] border border-[#ECE7DF] transition-all cursor-pointer"
                    >
                      {photoUrl ? (
                        <img
                          src={photoUrl}
                          alt=""
                          className="w-12 h-12 rounded-xl object-cover shrink-0 border border-[#ECE7DF]"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-white border border-[#ECE7DF] flex items-center justify-center text-xl shrink-0">
                          {post.type === 'chore' ? '🧹' : '📸'}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-[#2D2825] truncate">
                          {author?.name}: {post.caption || post.choreName}
                        </p>
                        <p className="text-[10px] text-[#9E958D]">
                          {post.type === 'chore' ? '🧹 งานบ้าน' : '📸 กิจกรรม'} · ถูกใจ {post.likes || 1} คน
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
