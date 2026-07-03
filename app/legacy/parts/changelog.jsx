'use client'
/**
 * parts/changelog.jsx — domain: หน้า Changelog + ระบบคอมเมนต์
 * ย้ายจาก tb-monolith.jsx (เฟส 2) — โค้ดเดิม ไม่แก้ logic
 * window globals (TB_CHANGELOG, TB_TAGS, _sb, _hasUnsentChangelogDraft, _mentionUsersCache,
 * APP_VERSION) ยังอ่านผ่าน window.* เหมือนเดิม
 */
import * as React from 'react'
import { createPortal } from 'react-dom'
const { useState, useEffect, useRef } = React
import { useModalAnim, ConfirmModal, ToastModal, Field, FilterSelect, Badge, StatusBadge,
         AvatarCircle, nameInitials, normName, colorFromName, relTime, ScrollNav } from './shared'

function ChangelogPage({ highlightCommentTarget, onClearHighlight } = {}) {
  // เป็น tab page (ไม่ใช่ modal) — render ภายใต้ main content area เหมือน AdminUsersTab/ActivityLog
  const [view, setView] = useState('timeline'); // 'timeline' | 'grouped'
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState(new Set());
  // v0.7.17.0 — lazy timeline: render แค่ N แรก กดดูเพิ่มเอง → ลด jank ตอน sidebar collapse
  const [visibleTimelineCount, setVisibleTimelineCount] = useState(15);
  // v0.7.17.3 — Filter sidebar (ซ้าย, พับได้) แทน filter bars 2 แถบเดิม
  const [filterSidebarOpen, setFilterSidebarOpen] = useState(() => {
    try { const s = localStorage.getItem('tb_cl_filter_open'); return s === null ? true : s === '1'; }
    catch { return true; }
  });
  // v0.7.17.3 — แต่ละ section เริ่มพับ (เห็นแค่หัวข้อ 2 แถว) — กดเปิดเอง
  const [filterVerOpen, setFilterVerOpen] = useState(false);
  const [filterCmtOpen, setFilterCmtOpen] = useState(false);
  // v0.7.17.3 — Back-to-top button สำหรับฝั่งขวา (version cards)
  const rightColRef = React.useRef(null);
  React.useEffect(() => {
    try { localStorage.setItem('tb_cl_filter_open', filterSidebarOpen ? '1' : '0'); } catch {}
  }, [filterSidebarOpen]);
  const [expandedMajors, setExpandedMajors] = useState(new Set([window.TB_CHANGELOG[0]?.major]));
  const [expandedMinors, setExpandedMinors] = useState(new Set());
  const [expandedVersions, setExpandedVersions] = useState(new Set());
  const [copiedHash, setCopiedHash] = useState(null);
  const [copiedFull, setCopiedFull] = useState(null); // version string ที่เพิ่ง copy ฉบับเต็ม
  const [commitDetailEntry, setCommitDetailEntry] = useState(null); // {entry, color}
  const [localToast, setLocalToast] = useState(null); // {text, type}
  const [expandedComments, setExpandedComments] = useState(new Set()); // version ที่เปิด comments ใน Timeline view
  // v0.7.15.4 — track version ที่เคยเปิด (keep mounted) → เปิด/ปิดครั้งถัดไป instant
  const [everOpenedVersions, setEverOpenedVersions] = useState(new Set());
  const [commentCounts, setCommentCounts] = useState({}); // {version: active count รวม reply}
  const [commentDeletedCounts, setCommentDeletedCounts] = useState({}); // {version: deleted count รวม reply}
  const [onlyWithComments, setOnlyWithComments] = useState(false); // filter: เฉพาะมี comment
  // ── Bulk comments store — fetch รวด 1 ครั้งแทน fetch ต่อ version ──
  const [allCommentsByVersion, setAllCommentsByVersion] = useState({}); // {version: [comments]}
  const [commentsMeta, setCommentsMeta] = useState({ currentUserId: null, isAdmin: false });

  // ── แถบที่ 2: Comment-specific filters (v0.7.14.7) ──
  const [commentSearch, setCommentSearch] = useState('');
  const [debouncedCommentSearch, setDebouncedCommentSearch] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState(new Set());
  const [selectedMentionUserIds, setSelectedMentionUserIds] = useState(new Set());
  const [resolvedFilter, setResolvedFilter] = useState('all'); // 'all'|'open'|'resolved'
  const [onlyMyComments, setOnlyMyComments] = useState(false);
  // extra filters: liked / my_replies / unread (multi-select)
  const [extraFilters, setExtraFilters] = useState(new Set());
  const [unreadCommentIds, setUnreadCommentIds] = useState(new Set());
  // Mention dropdown
  const [mentionPickerOpen, setMentionPickerOpen] = useState(false);
  // v0.7.17.3 — fixed position สำหรับ mention dropdown (กัน overflow ของ sidebar ที่มี internal scroll)
  const [mentionPos, setMentionPos] = useState({top:0,left:0,width:260});
  const [mentionUsers, setMentionUsers] = useState(null);
  const [mentionLoading, setMentionLoading] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [hoveredMentionId, setHoveredMentionId] = useState(null);
  const mentionPickerRef = React.useRef(null);

  // โหลด comment ทั้งหมดรวด 1 ครั้ง + auto-expand version ที่มี comment
  const refreshAllComments = React.useCallback(async () => {
    try {
      const r = await fetch('/api/changelog/comments-all');
      const j = await r.json();
      if (!r.ok) return;
      const byVersion = j.byVersion || {};
      setAllCommentsByVersion(byVersion);
      setCommentsMeta({ currentUserId: j.current_user_id, isAdmin: !!j.is_admin });
      // คำนวณ counts จากข้อมูลที่ได้ — รวม reply, แยก active vs deleted
      const counts = {};
      const dcounts = {};
      Object.entries(byVersion).forEach(([v, list]) => {
        let a = 0, d = 0;
        for (const c of list) {
          if (c.deleted_at) d += 1; else a += 1;
          if (Array.isArray(c.replies)) for (const r of c.replies) { if (r.deleted_at) d += 1; else a += 1; }
        }
        counts[v] = a;
        dcounts[v] = d;
      });
      setCommentCounts(counts);
      setCommentDeletedCounts(dcounts);
      // auto-expand version ที่มี comment
      const withComments = Object.keys(byVersion);
      if (withComments.length > 0) {
        setExpandedComments(prev => {
          const next = new Set(prev);
          withComments.forEach(v => next.add(v));
          return next;
        });
        // v0.7.15.4 — auto-expand version → mark เป็น ever-opened ด้วย
        setEverOpenedVersions(prev => {
          const next = new Set(prev);
          withComments.forEach(v => next.add(v));
          return next;
        });
      }
    } catch {/* network fail */}
  }, []);
  useEffect(() => { refreshAllComments(); }, [refreshAllComments]);

  // ── Realtime subscription — comments + likes (v0.7.14.5) ──
  React.useEffect(() => {
    if (!window._sb) return;
    let pending = null;
    // v0.7.15.1 — debounce 500ms (เดิม 300ms) → ลด API call ตอน batch updates ครึ่งหนึ่ง
    // (เริ่มที่ 500ms ก่อน — Plan agent แนะนำ ถ้าไม่บ่นค่อยขยับ 600ms)
    const debounced = () => { clearTimeout(pending); pending = setTimeout(refreshAllComments, 500); };
    const chC = window._sb.channel('changelog-comments-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tb_changelog_comments' }, debounced)
      .subscribe();
    const chL = window._sb.channel('changelog-comment-likes-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tb_changelog_comment_likes' }, debounced)
      .subscribe();
    return () => { clearTimeout(pending); try { window._sb.removeChannel(chC); } catch {} try { window._sb.removeChannel(chL); } catch {} };
  }, [refreshAllComments]);

  // ── Highlight comment เมื่อกดจากกระดิ่ง ──
  // CommentSection อาจ mount ช้า (รอ Realtime/render) → retry หา element ทุก 100ms นาน 4 วินาที
  React.useEffect(() => {
    if (!highlightCommentTarget) return;
    const { version, commentId } = highlightCommentTarget;
    if (!version || !commentId) return;
    setView('timeline');
    setExpandedComments(prev => { const n = new Set(prev); n.add(version); return n; });
    setEverOpenedVersions(prev => { const n = new Set(prev); n.add(version); return n; });
    // v0.7.17.2 fix — ขยาย visibleTimelineCount ถ้า version ที่กระดิ่งชี้ไปอยู่นอก slice (15)
    //   ไม่งั้น version ไม่ถูก render → ChangelogCommentSection ไม่ mount → DOM ไม่มี comment
    const targetIdx = allVersions.findIndex(v => v.version === version);
    if (targetIdx >= 0) {
      setVisibleTimelineCount(c => Math.max(c, targetIdx + 1));
    }
    let tries = 0;
    const scrollTimers = [];
    const interval = setInterval(() => {
      tries += 1;
      const el = document.getElementById('cmt-' + commentId);
      if (el) {
        clearInterval(interval);
        // v0.7.17.2 fix — scroll ซ้ำหลายรอบเผื่อ layout shift (lazy mount + comments loading
        //   ทำให้ page height โต → scroll smooth ไปตำแหน่งเก่า → หยุดก่อนถึงเป้า)
        //   scroll 4 รอบ: ทันที + 300ms + 700ms + 1200ms ครอบคลุม fetch + mount + reflow
        const scrollIt = () => {
          try { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch {}
        };
        scrollIt();
        scrollTimers.push(setTimeout(scrollIt, 300));
        scrollTimers.push(setTimeout(scrollIt, 700));
        scrollTimers.push(setTimeout(scrollIt, 1200));
        // flash หลัง scroll รอบสุดท้าย — มั่นใจว่าอยู่ในจอแล้ว
        scrollTimers.push(setTimeout(() => {
          el.classList.remove('comment-flash');
          void el.offsetWidth;  // force reflow
          el.classList.add('comment-flash');
        }, 1300));
        scrollTimers.push(setTimeout(() => {
          if (onClearHighlight) onClearHighlight();
        }, 1800));
      } else if (tries > 40) {  // 4 วินาที
        clearInterval(interval);
        console.warn('[ChangelogPage] comment not found:', commentId);
        if (onClearHighlight) onClearHighlight();
      }
    }, 100);
    return () => { clearInterval(interval); scrollTimers.forEach(clearTimeout); };
  }, [highlightCommentTarget, onClearHighlight]);

  const toggleComments = (version) => {
    setExpandedComments(prev => {
      const next = new Set(prev);
      if (next.has(version)) next.delete(version); else next.add(version);
      return next;
    });
    // v0.7.15.4 — mark ว่า version นี้เคยเปิด → keep CommentSection mounted ตลอด
    setEverOpenedVersions(prev => {
      if (prev.has(version)) return prev;
      const n = new Set(prev); n.add(version); return n;
    });
  };
  const setCommentCount = React.useCallback((version, n) => {
    setCommentCounts(prev => {
      const cur = prev[version] ?? 0;
      if (cur === n) return prev;             // กัน update ซ้ำ → กัน loop
      return { ...prev, [version]: n };
    });
  }, []);

  // ── Copy commit hash → clipboard + flash "copied" badge ────────────────
  const copyHash = (hash) => {
    if (!hash || hash==='pending') return;
    if (navigator.clipboard) navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(()=>setCopiedHash(prev => prev===hash ? null : prev), 1500);
  };

  // ── Copy commit ฉบับเต็ม (title + body + meta) → clipboard + toast ────
  const copyFullCommit = (entry) => {
    if (!entry) return;
    const lines = [
      `v${entry.version} · ${entry.date}` + (entry.commit && entry.commit!=='pending' ? ` · ${entry.commit}` : ''),
      entry.title || '',
      '',
      entry.body || '(ไม่มี commit body)',
    ];
    const text = lines.join('\n');
    if (navigator.clipboard) navigator.clipboard.writeText(text);
    setCopiedFull(entry.version);
    setTimeout(()=>setCopiedFull(prev => prev===entry.version ? null : prev), 1800);
    setLocalToast({ text: 'คัดลอกฉบับเต็มแล้ว', type: 'success' });
    setTimeout(()=>setLocalToast(null), 2000);
  };

  // ── Copy commit ฉบับย่อ (title + version + date + hash + bullets) ────
  const copyShortCommit = (entry) => {
    if (!entry) return;
    const lines = [
      `v${entry.version} · ${entry.date}` + (entry.commit && entry.commit!=='pending' ? ` · ${entry.commit}` : ''),
      entry.title || '',
    ];
    if (entry.changes && entry.changes.length > 0) {
      lines.push('');
      entry.changes.forEach(c => {
        const tag = TAGS[c.tag];
        lines.push(`${tag?tag.emoji:'•'} ${c.text}`);
      });
    }
    const text = lines.join('\n');
    if (navigator.clipboard) navigator.clipboard.writeText(text);
    setCopiedFull(entry.version);
    setTimeout(()=>setCopiedFull(prev => prev===entry.version ? null : prev), 1800);
    setLocalToast({ text: 'คัดลอกฉบับย่อแล้ว', type: 'success' });
    setTimeout(()=>setLocalToast(null), 2000);
  };

  // ── Highlight ส่วนที่ค้นหาเจอ (พื้นเหลือง) ──────────────────────────────
  const highlightMatch = (text) => {
    const q = debouncedSearch;
    if (!q || !text) return text;
    const t = String(text);
    const idx = t.toLowerCase().indexOf(q);
    if (idx < 0) return t;
    return (
      <>{t.slice(0, idx)}
        <mark style={{background:'#fef08a',padding:'0 2px',borderRadius:'3px',color:'inherit'}}>{t.slice(idx, idx+q.length)}</mark>
        {t.slice(idx+q.length)}</>
    );
  };

  // debounce search 300ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [search]);

  // v0.7.14.7 — debounce comment search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedCommentSearch(commentSearch.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [commentSearch]);

  // v0.7.14.7 — pre-fetch mentionable users ตอน ChangelogPage mount → popup เปิดทันที (ใช้ global cache)
  React.useEffect(() => {
    if (window._mentionUsersCache?.users) {
      setMentionUsers(window._mentionUsersCache.users);
      return;
    }
    setMentionLoading(true);
    (async () => {
      try {
        const r = await fetch('/api/changelog/mentionable-users');
        const j = await r.json();
        const users = r.ok ? (j.users || []) : [];
        window._mentionUsersCache = { users, fetchedAt: Date.now() };
        setMentionUsers(users);
      } catch { setMentionUsers([]); }
      finally { setMentionLoading(false); }
    })();
  }, []);
  // backward compat — ใช้ใน onClick ของปุ่มเปิด dropdown (no-op ตอนนี้)
  const ensureMentionUsersLoaded = React.useCallback(() => {}, []);

  // v0.7.14.7 — outside-click ปิด mention picker
  useEffect(() => {
    if (!mentionPickerOpen) return;
    const handler = (e) => {
      if (mentionPickerRef.current && !mentionPickerRef.current.contains(e.target)) {
        setMentionPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [mentionPickerOpen]);

  // v0.7.14.7 — toggle helpers
  const toggleStatus = (s) => {
    const n = new Set(selectedStatuses);
    if (n.has(s)) n.delete(s); else n.add(s);
    setSelectedStatuses(n);
  };
  const toggleMentionUser = (id) => {
    const n = new Set(selectedMentionUserIds);
    if (n.has(id)) n.delete(id); else n.add(id);
    setSelectedMentionUserIds(n);
  };
  const toggleExtra = (k) => {
    const n = new Set(extraFilters);
    if (n.has(k)) n.delete(k); else n.add(k);
    setExtraFilters(n);
  };

  // v0.7.14.7 — ดึง notification ของ user → derive set ของ comment_id ที่ "ยังไม่อ่าน"
  // unread = comment ที่ user ได้รับ notif (reply/mention/resolved/new) แต่ยังไม่กดอ่าน
  useEffect(() => {
    if (!window.loadUserNotifications) return;
    let cancel = false;
    (async () => {
      try {
        const notifs = await window.loadUserNotifications();
        if (cancel) return;
        const set = new Set();
        for (const n of notifs) {
          if (!n.is_read && n.comment_id && (n.type === 'comment_reply' || n.type === 'comment_mention' || n.type === 'comment_resolved' || n.type === 'comment_new')) {
            set.add(n.comment_id);
          }
        }
        setUnreadCommentIds(set);
      } catch {}
    })();
    return () => { cancel = true; };
  }, [allCommentsByVersion]);  // refetch เมื่อ comment data อัป (realtime หรือ refresh)

  const TAGS = window.TB_TAGS || {};
  const CHANGELOG = window.TB_CHANGELOG || [];

  // นับ stats รวม
  const stats = React.useMemo(() => {
    let totalVersions = 0;
    const byTag = {};
    CHANGELOG.forEach(major => {
      major.versions.forEach(v => {
        totalVersions++;
        v.changes.forEach(c => { byTag[c.tag] = (byTag[c.tag] || 0) + 1; });
      });
    });
    return { totalVersions, byTag };
  }, [CHANGELOG]);

  // v0.7.14.7 — สถิติของแถบ 2 (นับ #versions ต่อ axis)
  const commentFilterStats = React.useMemo(() => {
    const byStatus = { feedback:0, bug_report:0, request:0, note:0 };
    const byMentionedId = {};
    let openCount = 0, resolvedCount = 0, mineCount = 0;
    let likedCount = 0, myRepliesCount = 0, unreadCount = 0;
    const me = commentsMeta.currentUserId;
    Object.values(allCommentsByVersion).forEach(list => {
      const seenStatus = new Set();
      const seenMention = new Set();
      let hasOpen=false, hasResolved=false, hasMine=false;
      let hasLiked=false, hasMyReply=false, hasUnread=false;
      const walk = (c) => {
        if (c.deleted_at) return;
        seenStatus.add(c.status);
        if (Array.isArray(c.mentioned_user_ids)) c.mentioned_user_ids.forEach(uid => seenMention.add(uid));
        if (c.resolved_at) hasResolved = true; else hasOpen = true;
        if (me && c.user_id === me) hasMine = true;
        if (c.liked_by_me) hasLiked = true;
        if (c.parent_comment_id && me && c.user_id === me) hasMyReply = true;
        if (unreadCommentIds.has(c.id)) hasUnread = true;
      };
      list.forEach(c => { walk(c); (c.replies||[]).forEach(walk); });
      seenStatus.forEach(s => { if (s in byStatus) byStatus[s]++; });
      seenMention.forEach(uid => { byMentionedId[uid] = (byMentionedId[uid]||0)+1; });
      if (hasOpen) openCount++;
      if (hasResolved) resolvedCount++;
      if (hasMine) mineCount++;
      if (hasLiked) likedCount++;
      if (hasMyReply) myRepliesCount++;
      if (hasUnread) unreadCount++;
    });
    return { byStatus, byMentionedId, openCount, resolvedCount, mineCount, likedCount, myRepliesCount, unreadCount };
  }, [allCommentsByVersion, commentsMeta.currentUserId, unreadCommentIds]);

  // v0.7.14.7 — comment-level filter logic
  const hasCommentFilter = (
    debouncedCommentSearch ||
    selectedStatuses.size > 0 ||
    selectedMentionUserIds.size > 0 ||
    resolvedFilter !== 'all' ||
    onlyMyComments ||
    extraFilters.size > 0
  );

  const commentMatchesAxes = React.useCallback((c) => {
    if (c.deleted_at) return false;
    if (selectedStatuses.size > 0 && !selectedStatuses.has(c.status)) return false;
    if (selectedMentionUserIds.size > 0) {
      const ids = Array.isArray(c.mentioned_user_ids) ? c.mentioned_user_ids : [];
      if (!ids.some(uid => selectedMentionUserIds.has(uid))) return false;
    }
    if (resolvedFilter === 'open' && c.resolved_at) return false;
    if (resolvedFilter === 'resolved' && !c.resolved_at) return false;
    if (onlyMyComments && commentsMeta.currentUserId && c.user_id !== commentsMeta.currentUserId) return false;
    if (debouncedCommentSearch && !(c.comment_text || '').toLowerCase().includes(debouncedCommentSearch)) return false;
    // extra
    if (extraFilters.has('liked') && !c.liked_by_me) return false;
    if (extraFilters.has('my_replies') && !(c.parent_comment_id && commentsMeta.currentUserId && c.user_id === commentsMeta.currentUserId)) return false;
    if (extraFilters.has('unread') && !unreadCommentIds.has(c.id)) return false;
    return true;
  }, [selectedStatuses, selectedMentionUserIds, resolvedFilter, onlyMyComments, debouncedCommentSearch, extraFilters, unreadCommentIds, commentsMeta.currentUserId]);

  const versionHasMatchingComment = (version) => {
    const list = allCommentsByVersion[version];
    if (!list?.length) return false;
    for (const c of list) {
      if (commentMatchesAxes(c)) return true;
      if (Array.isArray(c.replies)) {
        for (const r of c.replies) if (commentMatchesAxes(r)) return true;
      }
    }
    return false;
  };

  // ฟิลเตอร์ version ตาม search + tag + comment filters (แถบ 2)
  const matchesFilters = (v) => {
    if (onlyWithComments && !(commentCounts[v.version] > 0)) return false;
    if (selectedTags.size > 0) {
      const hasTag = v.changes.some(c => selectedTags.has(c.tag));
      if (!hasTag) return false;
    }
    if (debouncedSearch) {
      const hay = (v.version + ' ' + v.title + ' ' + v.changes.map(c=>c.text).join(' ')).toLowerCase();
      if (!hay.includes(debouncedSearch)) return false;
    }
    // v0.7.14.7 — comment-level filter (AND กับด้านบน)
    if (hasCommentFilter && !versionHasMatchingComment(v.version)) return false;
    return true;
  };

  // ฟิลเตอร์ change list ภายใน version (ถ้ามี tag filter)
  const filterChanges = (changes) => {
    if (selectedTags.size === 0) return changes;
    return changes.filter(c => selectedTags.has(c.tag));
  };

  const toggleTag = (tag) => {
    const next = new Set(selectedTags);
    if (next.has(tag)) next.delete(tag); else next.add(tag);
    setSelectedTags(next);
  };
  const clearFilters = () => {
    setSearch(''); setSelectedTags(new Set()); setOnlyWithComments(false);
    // v0.7.14.7 — reset แถบ 2 ด้วย
    setCommentSearch(''); setSelectedStatuses(new Set()); setSelectedMentionUserIds(new Set());
    setResolvedFilter('all'); setOnlyMyComments(false); setExtraFilters(new Set());
    setMentionPickerOpen(false); setMentionQuery('');
  };
  // v0.7.14.7 — แยกปุ่มล้างค่าตาม "แถว/ระบบ"
  const clearTagFilters = () => {
    setSearch(''); setSelectedTags(new Set()); setOnlyWithComments(false);
  };
  const clearCommentFilters = () => {
    setCommentSearch(''); setSelectedStatuses(new Set()); setSelectedMentionUserIds(new Set());
    setResolvedFilter('all'); setOnlyMyComments(false); setExtraFilters(new Set());
    setMentionPickerOpen(false); setMentionQuery('');
  };
  const hasTagRowFilter = debouncedSearch || selectedTags.size > 0 || onlyWithComments;
  const hasCommentRowFilter = debouncedCommentSearch || selectedStatuses.size > 0 || selectedMentionUserIds.size > 0
    || resolvedFilter !== 'all' || onlyMyComments || extraFilters.size > 0;

  const toggleMajor = (major) => {
    const next = new Set(expandedMajors);
    if (next.has(major)) next.delete(major); else next.add(major);
    setExpandedMajors(next);
  };
  const toggleMinor = (key) => {
    const next = new Set(expandedMinors);
    if (next.has(key)) next.delete(key); else next.add(key);
    setExpandedMinors(next);
  };
  const toggleVersion = (v) => {
    const next = new Set(expandedVersions);
    if (next.has(v)) next.delete(v); else next.add(v);
    setExpandedVersions(next);
  };

  // ── Group versions by minor (e.g. "0.7.13.5" → group "0.7.13") ──────────
  const compareVersionDesc = (a, b) => {
    const pa = a.split('.').map(Number);
    const pb = b.split('.').map(Number);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      const x = pa[i] || 0, y = pb[i] || 0;
      if (x !== y) return y - x;
    }
    return 0;
  };
  const groupByMinor = (versions) => {
    const groups = {};
    versions.forEach(v => {
      const parts = v.version.split('.');
      const minorKey = parts.slice(0, 3).join('.');
      if (!groups[minorKey]) groups[minorKey] = [];
      groups[minorKey].push(v);
    });
    return Object.entries(groups)
      .map(([minorKey, vs]) => ({
        minorKey,
        versions: vs.sort((a,b) => compareVersionDesc(a.version, b.version)),
      }))
      .sort((a,b) => compareVersionDesc(a.minorKey, b.minorKey));
  };

  // ── Tag chip ─────────────────────────────────────────────────────────────
  const TagChip = ({ tagKey, small }) => {
    const t = TAGS[tagKey];
    if (!t) return null;
    return (
      <span style={{display:'inline-flex',alignItems:'center',gap:'3px',padding: small?'1px 6px':'2px 8px',borderRadius:'999px',background:t.bg,color:t.fg,border:`1px solid ${t.border}`,fontSize: small?'10px':'11px',fontWeight:600,whiteSpace:'nowrap'}}>
        <span>{t.emoji}</span>
        <span>{t.label}</span>
      </span>
    );
  };

  // ── ChangeRow ────────────────────────────────────────────────────────────
  const ChangeRow = ({ change }) => (
    <div style={{display:'flex',gap:'8px',padding:'6px 0',alignItems:'flex-start'}}>
      <TagChip tagKey={change.tag} small />
      <span style={{fontSize:'13px',color:'#374151',lineHeight:1.6,flex:1}}>{highlightMatch(change.text)}</span>
    </div>
  );

  // ── Tag breakdown ของ version (mini chips กดได้ = filter) ────────────
  const TagBreakdown = ({ changes, small }) => {
    const counts = {};
    (changes || []).forEach(c => { counts[c.tag] = (counts[c.tag] || 0) + 1; });
    const entries = Object.entries(counts).filter(([k])=>TAGS[k]);
    if (entries.length === 0) return null;
    const noFocus = (e) => e.preventDefault();
    return (
      <span style={{display:'inline-flex',gap:'3px',flexWrap:'wrap'}} onClick={e=>e.stopPropagation()}>
        {entries.map(([k,n])=>{
          const t = TAGS[k];
          const active = selectedTags.has(k);
          return (
            <button key={k} type="button" tabIndex={-1} onMouseDown={noFocus} onClick={e=>{e.stopPropagation();toggleTag(k);}} title={`กรอง ${t.label}`}
              style={{cursor:'pointer',border:active?`1px solid ${t.fg}`:'1px solid '+t.border,background: active ? t.bg : '#fff',color:t.fg,padding: small?'1px 5px':'2px 6px',borderRadius:'999px',fontSize: small?'9px':'10px',fontWeight:700,lineHeight:1.2,transition:'all 0.15s'}}>
              {t.emoji}{n}
            </button>
          );
        })}
      </span>
    );
  };

  // ── CommitChip — กดได้, แสดง copied state, กับปุ่ม "บันทึกฉบับเต็ม" ──────
  const CommitChip = ({ v, color, small }) => {
    if (!v.commit) return null;
    const justCopied = copiedHash === v.commit;
    // กัน event bubbling + กัน focus (browser auto-scroll button เข้าหา viewport ตอนได้ focus)
    const noFocus = (e) => e.preventDefault();
    const stop = (fn) => (e) => { e.stopPropagation(); fn(); };
    return (
      <span style={{display:'inline-flex',gap:'4px',alignItems:'center'}} onClick={e=>e.stopPropagation()}>
        <button type="button" tabIndex={-1} onMouseDown={noFocus} onClick={stop(()=>copyHash(v.commit))} title="คลิกเพื่อ copy commit hash"
          style={{cursor:'pointer',border:'none',fontSize: small?'9px':'10px',fontFamily:'monospace',background:justCopied?'#d1fae5':'#f3f4f6',color:justCopied?'#065f46':'#9ca3af',padding:'2px 7px',borderRadius:'4px',fontWeight:600,transition:'all 0.15s'}}>
          {justCopied ? '✓ copied' : v.commit}
        </button>
        {v.body && (
          <>
            <button type="button" tabIndex={-1} onMouseDown={noFocus} onClick={stop(()=>setCommitDetailEntry({entry:v, color}))} title="ดูบันทึก commit ฉบับเต็ม"
              style={{cursor:'pointer',border:'none',fontSize: small?'9px':'10px',background:'#eff6ff',color:'#1d4ed8',padding:'2px 7px',borderRadius:'4px',fontWeight:700,transition:'all 0.15s'}}
              onMouseEnter={e=>e.currentTarget.style.background='#dbeafe'}
              onMouseLeave={e=>e.currentTarget.style.background='#eff6ff'}>
              <i className="fa-solid fa-file-lines" style={{marginRight:'3px'}}></i>บันทึกฉบับเต็ม
            </button>
            <button type="button" tabIndex={-1} onMouseDown={noFocus} onClick={stop(()=>copyShortCommit(v))} title="คัดลอก commit ฉบับย่อ (หัวเรื่อง + รายการแก้ไข)"
              style={{cursor:'pointer',border:'none',fontSize: small?'9px':'10px',background: copiedFull===v.version ? '#d1fae5' : '#fef3c7',color: copiedFull===v.version ? '#065f46' : '#92400e',padding:'2px 7px',borderRadius:'4px',fontWeight:700,transition:'all 0.15s'}}
              onMouseEnter={e=>{if(copiedFull!==v.version)e.currentTarget.style.background='#fde68a';}}
              onMouseLeave={e=>{if(copiedFull!==v.version)e.currentTarget.style.background='#fef3c7';}}>
              <i className={copiedFull===v.version ? 'fa-solid fa-check' : 'fa-regular fa-copy'}></i>
            </button>
          </>
        )}
      </span>
    );
  };

  // ── VersionCard ถูก inline ใน Timeline map แทนเป็น component (ลดการ recreate function) ─

  // ── Flat list สำหรับ Timeline view ───────────────────────────────────────
  const allVersions = React.useMemo(() => {
    const list = [];
    CHANGELOG.forEach(major => {
      major.versions.forEach(v => {
        list.push({ ...v, _major: major.major, _color: major.color });
      });
    });
    return list;
  }, [CHANGELOG]);

  const filteredTimeline = React.useMemo(
    () => allVersions.filter(matchesFilters),
    [allVersions, debouncedSearch, selectedTags, onlyWithComments, commentCounts,
     allCommentsByVersion, debouncedCommentSearch, selectedStatuses, selectedMentionUserIds, resolvedFilter, onlyMyComments, commentsMeta.currentUserId, extraFilters, unreadCommentIds]
  );
  // v0.7.17.0 — reset visible count ตอน filter เปลี่ยน (กัน scroll ลึกแล้ว filter ติด)
  React.useEffect(() => { setVisibleTimelineCount(15); },
    [debouncedSearch, selectedTags, onlyWithComments, debouncedCommentSearch,
     selectedStatuses, selectedMentionUserIds, resolvedFilter, onlyMyComments, extraFilters]
  );
  // คำนวณ list ที่จะ render จริง (slice แค่ N แรก)
  const timelineToRender = React.useMemo(
    () => filteredTimeline.slice(0, visibleTimelineCount),
    [filteredTimeline, visibleTimelineCount]
  );
  const latestVersion = allVersions[0]?.version;

  const hasActiveFilters = debouncedSearch || selectedTags.size > 0 || onlyWithComments
    || debouncedCommentSearch || selectedStatuses.size > 0 || selectedMentionUserIds.size > 0
    || resolvedFilter !== 'all' || onlyMyComments || extraFilters.size > 0;

  return (
    <div className="tb-fade">
      {/* ── Sticky header กลุ่ม: Banner + Filter ติดกันเป็นชั้นเดียว ── */}
      <div style={{position:'sticky',top:'-24px',zIndex:20,paddingTop:'0',marginBottom:'16px'}}>
      <div className="bg-gradient-to-r from-teal-700 to-teal-600 rounded-2xl p-5 text-white shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            {/* v0.7.17.3 — ทุกอย่างบรรทัดเดียว: รวม 83 เวอร์ชัน + range + chips */}
            <div style={{display:'flex',alignItems:'center',gap:'10px',flexWrap:'wrap',color:'#fff',fontSize:'13px'}}>
              <span style={{display:'inline-flex',alignItems:'baseline',gap:'6px'}}>
                <span>รวม</span>
                <span style={{fontSize:'28px',fontWeight:800,lineHeight:1,fontFamily:"'Manrope', sans-serif",letterSpacing:'-0.5px'}}>{stats.totalVersions}</span>
                <span>เวอร์ชัน · ตั้งแต่ v0.5.0 ถึง v{typeof window !== 'undefined' ? window.APP_VERSION : ''}</span>
              </span>
              {Object.entries(stats.byTag).filter(([k,n])=>n>0 && TAGS[k]).map(([k,n])=>{
                const active = selectedTags.has(k);
                return (
                  <button key={k} type="button" onClick={()=>toggleTag(k)} title={`กรอง ${TAGS[k].label}`}
                    style={{cursor:'pointer',border:active?'1px solid #fff':'1px solid rgba(255,255,255,0.3)',background: active ? '#fff' : 'rgba(255,255,255,0.15)',color: active ? TAGS[k].fg : '#fff',padding:'2px 8px',borderRadius:'999px',fontSize:'11px',fontWeight:700,transition:'all 0.15s',lineHeight:1.3}}>
                    {TAGS[k].emoji}{n}
                  </button>
                );
              })}
              {(() => {
                const totalComments = Object.values(commentCounts).reduce((a,b)=>a+b,0);
                if (totalComments === 0) return null;
                return (
                  <button type="button" onClick={()=>setOnlyWithComments(v=>!v)} title="กรองเฉพาะที่มีความคิดเห็น"
                    style={{cursor:'pointer',border:onlyWithComments?'1px solid #fff':'1px solid rgba(255,255,255,0.3)',background: onlyWithComments ? '#fff' : 'rgba(255,255,255,0.15)',color: onlyWithComments ? '#92400e' : '#fff',padding:'2px 8px',borderRadius:'999px',fontSize:'11px',fontWeight:700,transition:'all 0.15s',lineHeight:1.3,display:'inline-flex',alignItems:'center',gap:'3px'}}>
                    <i className="fa-regular fa-comment"></i>{totalComments}
                  </button>
                );
              })()}
            </div>
          </div>
          {/* View toggle — อยู่ในแบนเนอร์ */}
          <div style={{display:'flex',background:'rgba(255,255,255,0.15)',borderRadius:'10px',padding:'3px',gap:'2px',flexShrink:0}}>
            <button type="button" onClick={()=>setView('timeline')}
              style={{padding:'6px 12px',borderRadius:'8px',border:'none',background:view==='timeline'?'#fff':'transparent',color:view==='timeline'?'#0f766e':'#fff',fontSize:'12px',fontWeight:700,cursor:'pointer',transition:'all 0.15s'}}>
              <i className="fa-solid fa-stream" style={{marginRight:'5px'}}></i>Timeline
            </button>
            <button type="button" onClick={()=>setView('grouped')}
              style={{padding:'6px 12px',borderRadius:'8px',border:'none',background:view==='grouped'?'#fff':'transparent',color:view==='grouped'?'#0f766e':'#fff',fontSize:'12px',fontWeight:700,cursor:'pointer',transition:'all 0.15s'}}>
              <i className="fa-solid fa-layer-group" style={{marginRight:'5px'}}></i>แยกตามเวอร์ชั่น
            </button>
          </div>
        </div>
      </div>
      </div>{/* /sticky header group (เหลือเฉพาะ banner) */}

      {/* ── v0.7.17.3 — Layout 2 ช่อง แยก scroll อิสระ — Gmail-style ── */}
      {/* outer height: calc(100vh - 200px) คือพื้นที่หลังจาก banner + margins */}
      <div style={{display:'flex',gap:'16px',alignItems:'stretch',height:'calc(100vh - 200px)',minHeight:'400px',position:'relative'}}>

      {/* ── Left aside: filter sidebar (พับได้, scroll อิสระ) ── */}
      <aside style={{width:filterSidebarOpen?'260px':'40px',flexShrink:0,transition:'width 0.2s ease',position:'relative',height:'100%'}}>
        {/* Chevron toggle button — ลอยขอบบน */}
        <button type="button" onClick={()=>setFilterSidebarOpen(o=>!o)}
          title={filterSidebarOpen?'ย่อแถบตัวกรอง':'ขยายแถบตัวกรอง'}
          style={{position:'absolute',right:filterSidebarOpen?'-12px':'8px',top:'12px',width:'24px',height:'24px',borderRadius:'50%',border:'1.5px solid #0d9488',background:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',zIndex:5,boxShadow:'0 1px 3px rgba(0,0,0,0.08)',transition:'all 0.15s'}}
          onMouseEnter={e=>{ e.currentTarget.style.background='#0d9488'; const icon=e.currentTarget.querySelector('i'); if (icon) icon.style.color='#fff'; }}
          onMouseLeave={e=>{ e.currentTarget.style.background='#fff'; const icon=e.currentTarget.querySelector('i'); if (icon) icon.style.color='#0d9488'; }}>
          <i className={`fa-solid ${filterSidebarOpen?'fa-chevron-left':'fa-chevron-right'}`} style={{fontSize:'9px',color:'#0d9488',transition:'color 0.15s'}}></i>
        </button>
        {filterSidebarOpen ? (<div style={{display:'flex',flexDirection:'column',gap:'10px',height:'100%',overflowY:'auto',overscrollBehavior:'contain',scrollbarGutter:'stable',paddingBottom:'12px'}}>

      {/* ── v0.7.17.3 — Filter bar (แถบ 1: ตัวกรองระบบ) — collapsible ── */}
      <div style={{background:'#fff',borderRadius:'14px',border:'1px solid #e5e7eb',boxShadow:'0 4px 12px rgba(0,0,0,0.06)',flexShrink:0}}>
        {/* Header — กดเปิด/พับ */}
        <button type="button" className="tb-cl-header-ver" onClick={()=>setFilterVerOpen(o=>!o)}
          style={{width:'100%',display:'flex',alignItems:'center',gap:'8px',padding:'10px 14px',background:filterVerOpen?'#f0fdfa':'#fff',border:'none',cursor:'pointer',transition:'background 0.15s',borderBottom:filterVerOpen?'1px solid #d1faf3':'none',borderRadius:filterVerOpen?'14px 14px 0 0':'14px'}}>
          <i className="fa-solid fa-sliders" style={{color:'#0d9488',fontSize:'13px'}}></i>
          <span style={{fontSize:'13px',fontWeight:700,color:'#0f766e',flex:1,textAlign:'left'}}>ตัวกรองเวอร์ชั่น</span>
          {hasTagRowFilter && <span style={{fontSize:'9px',fontWeight:700,color:'#fff',background:'#0d9488',padding:'2px 6px',borderRadius:'999px'}}>มีกรอง</span>}
          <i className={`fa-solid ${filterVerOpen?'fa-chevron-up':'fa-chevron-down'}`} style={{color:'#9ca3af',fontSize:'10px'}}></i>
        </button>
        {filterVerOpen && (
        <div className="tb-cl-chips-ver" style={{padding:'10px 12px',display:'flex',flexDirection:'column',gap:'6px'}}>
          {/* ค้นหา full-width */}
          <div style={{position:'relative'}}>
            <i className="fa-solid fa-magnifying-glass" style={{position:'absolute',left:'10px',top:'50%',transform:'translateY(-50%)',color:'#9ca3af',fontSize:'11px'}}></i>
            <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="ค้นหาเวอร์ชัน/หัวเรื่อง"
              style={{width:'100%',boxSizing:'border-box',padding:'7px 10px 7px 28px',borderRadius:'8px',border:'1px solid #e5e7eb',background:'#f9fafb',fontSize:'12px',outline:'none',color:'#1f2937',caretColor:'#0d9488'}}
              onFocus={e=>{e.currentTarget.style.borderColor='#14b8a6';e.currentTarget.style.background='#fff';}}
              onBlur={e=>{e.currentTarget.style.borderColor='#e5e7eb';e.currentTarget.style.background='#f9fafb';}}
            />
          </div>
          {/* Chips — แถวละอัน text-left + icon-right + count */}
          {Object.entries(TAGS).map(([key,t])=>{
            const active = selectedTags.has(key);
            const count = stats.byTag[key] || 0;
            return (
              <button key={key} type="button" onClick={()=>toggleTag(key)}
                style={{display:'flex',width:'100%',boxSizing:'border-box',alignItems:'center',justifyContent:'space-between',padding:'7px 10px',borderRadius:'8px',border:active?`1.5px solid ${t.fg}`:'1px solid #e5e7eb',background:active?t.bg:'#fff',color:active?t.fg:'#4b5563',fontSize:'12px',fontWeight:600,cursor:'pointer',transition:'all 0.15s'}}>
                <span>{t.label}</span>
                <span style={{display:'inline-flex',alignItems:'center',gap:'5px',fontSize:'11px',color:active?t.fg:'#9ca3af'}}>
                  <span>{t.emoji}</span>
                  <span>({count})</span>
                </span>
              </button>
            );
          })}
          {/* "เฉพาะมีความคิดเห็น" — สีเทาเหมือน chips อื่นๆ */}
          <button type="button" onClick={()=>setOnlyWithComments(v=>!v)}
            title="แสดงเฉพาะเวอร์ชั่นที่มีความคิดเห็น"
            style={{display:'flex',width:'100%',boxSizing:'border-box',alignItems:'center',justifyContent:'space-between',padding:'7px 10px',borderRadius:'8px',border: onlyWithComments?'1.5px solid #6b7280':'1px solid #e5e7eb',background: onlyWithComments?'#f3f4f6':'#fff',color: onlyWithComments?'#374151':'#4b5563',fontSize:'12px',fontWeight:600,cursor:'pointer',transition:'all 0.15s'}}>
            <span>เฉพาะมีความคิดเห็น</span>
            <span style={{display:'inline-flex',alignItems:'center',gap:'5px',fontSize:'11px',color: onlyWithComments?'#374151':'#9ca3af'}}>
              <i className="fa-regular fa-comment"></i>
              <span>({Object.values(commentCounts).filter(n=>n>0).length})</span>
            </span>
          </button>
          {hasTagRowFilter && (
            <button type="button" onClick={clearTagFilters}
              style={{padding:'6px 10px',borderRadius:'8px',border:'1.5px solid #ef4444',background:'#fef2f2',color:'#b91c1c',fontSize:'11px',fontWeight:700,cursor:'pointer',marginTop:'2px'}}>
              <i className="fa-solid fa-xmark" style={{marginRight:'4px'}}></i>ล้างตัวกรอง
            </button>
          )}
        </div>
        )}
      </div>

      {/* ── v0.7.17.3 — Filter bar (แถบ 2: ตัวกรองความคิดเห็น) — collapsible — สีอำพันเดิม ── */}
      <div style={{background:'#fffbeb',borderRadius:'14px',border:'1px solid #fde68a',boxShadow:'0 4px 12px rgba(245,158,11,0.08)',flexShrink:0}}>
        {/* Header — กดเปิด/พับ (สีอำพัน) */}
        <button type="button" className="tb-cl-header-cmt" onClick={()=>setFilterCmtOpen(o=>!o)}
          style={{width:'100%',display:'flex',alignItems:'center',gap:'8px',padding:'10px 14px',background:filterCmtOpen?'#fef3c7':'#fffbeb',border:'none',cursor:'pointer',transition:'background 0.15s',borderBottom:filterCmtOpen?'1px solid #fde68a':'none',borderRadius:filterCmtOpen?'14px 14px 0 0':'14px'}}>
          <i className="fa-solid fa-comments" style={{color:'#d97706',fontSize:'13px'}}></i>
          <span style={{fontSize:'13px',fontWeight:700,color:'#92400e',flex:1,textAlign:'left'}}>ตัวกรองความคิดเห็น</span>
          {hasCommentRowFilter && <span style={{fontSize:'9px',fontWeight:700,color:'#fff',background:'#d97706',padding:'2px 6px',borderRadius:'999px'}}>มีกรอง</span>}
          <i className={`fa-solid ${filterCmtOpen?'fa-chevron-up':'fa-chevron-down'}`} style={{color:'#9ca3af',fontSize:'10px'}}></i>
        </button>
        {filterCmtOpen && (
        <div className="tb-cl-chips-cmt" style={{padding:'10px 12px',display:'flex',flexDirection:'column',gap:'6px'}}>
          {/* ค้นหา full-width */}
          <div style={{position:'relative'}}>
            <i className="fa-solid fa-magnifying-glass" style={{position:'absolute',left:'10px',top:'50%',transform:'translateY(-50%)',color:'#9ca3af',fontSize:'11px'}}></i>
            <input type="text" value={commentSearch} onChange={e=>setCommentSearch(e.target.value)} placeholder="ค้นหาข้อความในความคิดเห็น"
              style={{width:'100%',boxSizing:'border-box',padding:'7px 10px 7px 28px',borderRadius:'8px',border:'1px solid #fbbf24',background:'#fff',fontSize:'12px',outline:'none',color:'#1f2937',caretColor:'#d97706'}}
              onFocus={e=>{e.currentTarget.style.borderColor='#d97706';}}
              onBlur={e=>{e.currentTarget.style.borderColor='#fbbf24';}}
            />
          </div>

          {/* Status chips — แถวละอัน text-left + emoji-right + count */}
          {Object.entries(CHANGELOG_STATUS_META).map(([key,meta])=>{
            const active = selectedStatuses.has(key);
            const count = commentFilterStats.byStatus[key] || 0;
            return (
              <button key={key} type="button" onClick={()=>toggleStatus(key)}
                style={{display:'flex',width:'100%',boxSizing:'border-box',alignItems:'center',justifyContent:'space-between',padding:'7px 10px',borderRadius:'8px',border:active?`1.5px solid ${meta.fg}`:'1px solid #e5e7eb',background:active?meta.bg:'#fff',color:active?meta.fg:'#4b5563',fontSize:'12px',fontWeight:600,cursor:'pointer',transition:'all 0.15s'}}>
                <span>{meta.label}</span>
                <span style={{display:'inline-flex',alignItems:'center',gap:'5px',fontSize:'11px',color:active?meta.fg:'#9ca3af'}}>
                  <span>{meta.emoji}</span>
                  <span>({count})</span>
                </span>
              </button>
            );
          })}

          {/* @ Mention picker — full-width, dropdown ออกจาก button ตรงๆ */}
          <div ref={mentionPickerRef} style={{position:'relative'}}>
          <button type="button" onClick={()=>{ const next = !mentionPickerOpen; setMentionPickerOpen(next); if (next) ensureMentionUsersLoaded(); }}
            style={{display:'flex',width:'100%',boxSizing:'border-box',alignItems:'center',justifyContent:'space-between',padding:'7px 10px',borderRadius:'8px',border:selectedMentionUserIds.size>0?'1.5px solid #0d9488':'1px solid #5eead4',background:selectedMentionUserIds.size>0?'#ccfbf1':'#f0fdfa',color:'#0f766e',fontSize:'12px',fontWeight:700,cursor:'pointer',transition:'all 0.15s'}}>
            <span>แท็กผู้ใช้</span>
            <span style={{display:'inline-flex',alignItems:'center',gap:'5px',fontSize:'11px'}}>
              {selectedMentionUserIds.size>0 && <span style={{fontSize:'10px',background:'#0d9488',color:'#fff',padding:'1px 6px',borderRadius:'999px'}}>{selectedMentionUserIds.size}</span>}
              <i className="fa-solid fa-at"></i>
              <i className={`fa-solid ${mentionPickerOpen?'fa-chevron-up':'fa-chevron-down'}`} style={{fontSize:'9px'}}></i>
            </span>
          </button>

          {mentionPickerOpen && (
            <div style={{position:'absolute',top:'calc(100% + 4px)',left:0,right:0,zIndex:60,background:'#fff',border:'2px solid #0d9488',borderRadius:'10px',maxHeight:'240px',overflowY:'auto',boxShadow:'0 8px 24px rgba(0,0,0,0.18)'}}>
              {/* Search ภายใน */}
              <div style={{position:'sticky',top:0,background:'#fff',padding:'8px',borderBottom:'1px solid #f1f5f9'}}>
                <input type="text" value={mentionQuery} onChange={e=>setMentionQuery(e.target.value)} placeholder="ค้นหาชื่อ"
                  style={{width:'100%',padding:'5px 8px',fontSize:'12px',border:'1px solid #e5e7eb',borderRadius:'6px',outline:'none',color:'#1f2937',caretColor:'#0d9488'}}/>
              </div>
              {mentionLoading && (
                <div style={{padding:'12px',fontSize:'11px',color:'#9ca3af',textAlign:'center'}}>
                  <i className="fa-solid fa-spinner fa-spin"></i> กำลังโหลด...
                </div>
              )}
              {!mentionLoading && mentionUsers !== null && (() => {
                const q = mentionQuery.trim().toLowerCase();
                const filtered = q
                  ? mentionUsers.filter(u => (u.username||'').toLowerCase().includes(q) || (u.display_name||'').toLowerCase().includes(q))
                  : mentionUsers;
                if (filtered.length === 0) {
                  return <div style={{padding:'12px',fontSize:'11px',color:'#9ca3af',textAlign:'center',fontStyle:'italic'}}>ไม่พบผู้ใช้</div>;
                }
                return filtered.map(u => {
                  const checked = selectedMentionUserIds.has(u.id);
                  const isAdminUser = u.role === 'admin';
                  // v0.7.17.3 — 2-line layout: username บรรทัดบน, full name บรรทัดล่าง + title tooltip
                  return (
                    <label key={u.id} className={'tb-mention-filter-row' + (isAdminUser ? ' is-admin' : '')}
                      title={`@${u.username} · ${u.display_name}${u.profession_label?' · '+u.profession_label:''}`}
                      style={{display:'flex',flexDirection:'column',gap:'2px',padding:'7px 10px',cursor:'pointer',fontSize:'12px',color:'#1f2937',background:isAdminUser?'#fef3c7':(checked?'#ecfdf5':'transparent'),borderLeft:isAdminUser?'3px solid #d97706':'3px solid transparent',borderBottom:'1px solid #f1f5f9'}}>
                      {/* บรรทัดบน: checkbox + @username + ADMIN + count */}
                      <div style={{display:'flex',alignItems:'center',gap:'6px',width:'100%'}}>
                        <input type="checkbox" checked={checked} onChange={()=>toggleMentionUser(u.id)} style={{cursor:'pointer',flexShrink:0}}/>
                        <AvatarCircle urlKey={u.avatar_url} updatedAt={u.avatar_updated_at} name={u.display_name} colorKey={u.id} fallback={nameInitials(u.display_name)} size={20} fontSize={8} />
                        <b style={{color:isAdminUser?'#92400e':'#0f766e',flexShrink:0}}>@{u.username}</b>
                        {isAdminUser && <span style={{fontSize:'9px',fontWeight:800,color:'#fff',background:'#d97706',padding:'1px 5px',borderRadius:'999px',flexShrink:0}}>ADMIN</span>}
                        <span style={{marginLeft:'auto',fontSize:'10px',color:'#9ca3af',flexShrink:0}}>({commentFilterStats.byMentionedId[u.id]||0})</span>
                      </div>
                      {/* บรรทัดล่าง: display_name + profession (เยื้องตาม checkbox) */}
                      <div style={{display:'flex',alignItems:'center',gap:'4px',paddingLeft:'24px',fontSize:'11px'}}>
                        <span style={{color:'#374151',fontWeight:600,overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis',flex:'1 1 auto',minWidth:0}}>{u.display_name}</span>
                        {u.profession_label && <span style={{color:'#6b7280',fontSize:'10px',flexShrink:0}}>· {u.profession_label}</span>}
                      </div>
                    </label>
                  );
                });
              })()}
              <div style={{padding:'6px 10px',borderTop:'1px solid #f1f5f9',textAlign:'right'}}>
                <button type="button" onClick={()=>setMentionPickerOpen(false)}
                  style={{padding:'4px 12px',borderRadius:'6px',border:'1px solid #0d9488',background:'#fff',color:'#0f766e',fontSize:'11px',fontWeight:700,cursor:'pointer'}}>
                  เสร็จสิ้น
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Pills user ที่เลือก */}
        {selectedMentionUserIds.size > 0 && (
          <div style={{display:'flex',gap:'4px',flexWrap:'wrap'}}>
            {[...selectedMentionUserIds].map(id => {
              const u = (mentionUsers||[]).find(x=>x.id===id);
              if (!u) return null;
              return (
                <span key={id} style={{display:'inline-flex',alignItems:'center',gap:'4px',padding:'3px 8px',borderRadius:'999px',background:'#ccfbf1',color:'#0f766e',fontSize:'10px',fontWeight:700,border:'1px solid #5eead4'}}>
                  @{u.username}
                  <button type="button" onClick={(e)=>{e.stopPropagation();toggleMentionUser(id);}}
                    style={{cursor:'pointer',border:'none',background:'transparent',color:'#0f766e',fontSize:'12px',padding:0,lineHeight:1,marginLeft:'2px'}}>×</button>
                </span>
              );
            })}
          </div>
        )}

          {/* Resolved tri-state — full-width 3-button group */}
          <div style={{display:'flex',width:'100%',border:'1px solid #fbbf24',borderRadius:'8px',overflow:'hidden'}}>
            {[
              { v:'all', label:'ทั้งหมด', count: null },
              { v:'open', label:'ยังไม่จัดการ', count: commentFilterStats.openCount },
              { v:'resolved', label:'จัดการแล้ว', count: commentFilterStats.resolvedCount },
            ].map(({v,label,count}, i) => {
              const active = resolvedFilter === v;
              return (
                <button key={v} type="button"
                  onClick={()=>setResolvedFilter(active && v !== 'all' ? 'all' : v)}
                  style={{flex:1,padding:'7px 4px',border:'none',borderLeft:i>0?'1px solid #fbbf24':'none',background:active?'#d97706':'#fff',color:active?'#fff':'#92400e',fontSize:'11px',fontWeight:700,cursor:'pointer',transition:'all 0.15s'}}>
                  {label}{count !== null && <span style={{fontSize:'10px',opacity:0.8,marginLeft:'3px'}}>({count})</span>}
                </button>
              );
            })}
          </div>

          {/* v0.7.17.3 — ความคิดเห็นของฉัน + extras: สีเทาเหมือน status chips */}
          <button type="button" onClick={()=>setOnlyMyComments(v=>!v)}
            disabled={!commentsMeta.currentUserId}
            title={!commentsMeta.currentUserId ? 'ต้องเข้าสู่ระบบก่อน' : 'แสดงเฉพาะความคิดเห็นของคุณ'}
            style={{display:'flex',width:'100%',boxSizing:'border-box',alignItems:'center',justifyContent:'space-between',padding:'7px 10px',borderRadius:'8px',border:onlyMyComments?'1.5px solid #6b7280':'1px solid #e5e7eb',background:onlyMyComments?'#f3f4f6':'#fff',color:onlyMyComments?'#374151':'#4b5563',fontSize:'12px',fontWeight:600,cursor:commentsMeta.currentUserId?'pointer':'not-allowed',opacity:commentsMeta.currentUserId?1:0.5,transition:'all 0.15s'}}>
            <span>ความคิดเห็นของฉัน</span>
            <span style={{display:'inline-flex',alignItems:'center',gap:'5px',fontSize:'11px',color:onlyMyComments?'#374151':'#9ca3af'}}>
              <i className="fa-solid fa-user"></i>
              <span>({commentFilterStats.mineCount})</span>
            </span>
          </button>

          {[
            { k:'liked',      icon:'fa-solid fa-thumbs-up',     label:'ที่ฉันถูกใจ',    count: commentFilterStats.likedCount },
            { k:'my_replies', icon:'fa-solid fa-reply',         label:'ที่ฉันตอบ',      count: commentFilterStats.myRepliesCount },
            { k:'unread',     icon:'fa-regular fa-envelope',    label:'ยังไม่อ่าน',     count: commentFilterStats.unreadCount },
          ].map(({k,icon,label,count})=>{
            const active = extraFilters.has(k);
            const disabled = !commentsMeta.currentUserId;
            return (
              <button key={k} type="button" onClick={()=>{ if(!disabled) toggleExtra(k); }}
                disabled={disabled}
                title={disabled ? 'ต้องเข้าสู่ระบบก่อน' : label}
                style={{display:'flex',width:'100%',boxSizing:'border-box',alignItems:'center',justifyContent:'space-between',padding:'7px 10px',borderRadius:'8px',border:active?'1.5px solid #6b7280':'1px solid #e5e7eb',background:active?'#f3f4f6':'#fff',color:active?'#374151':'#4b5563',fontSize:'12px',fontWeight:600,cursor:disabled?'not-allowed':'pointer',opacity:disabled?0.5:1,transition:'all 0.15s'}}>
                <span>{label}</span>
                <span style={{display:'inline-flex',alignItems:'center',gap:'5px',fontSize:'11px',color:active?'#374151':'#9ca3af'}}>
                  <i className={icon}></i>
                  <span>({count})</span>
                </span>
              </button>
            );
          })}

          {/* ปุ่มล้างค่า */}
          {hasCommentRowFilter && (
            <button type="button" onClick={clearCommentFilters}
              style={{padding:'6px 10px',borderRadius:'8px',border:'1.5px solid #ef4444',background:'#fef2f2',color:'#b91c1c',fontSize:'11px',fontWeight:700,cursor:'pointer',marginTop:'2px'}}>
              <i className="fa-solid fa-xmark" style={{marginRight:'4px'}}></i>ล้างตัวกรอง
            </button>
          )}
        </div>
        )}
      </div>

      </div>) : (
        /* ตอนพับ — เห็นแค่ไอคอน 🎚 (กดปุ่ม chevron เพื่อขยาย) */
        <div style={{padding:'40px 8px 12px',textAlign:'center'}}>
          <i className="fa-solid fa-sliders" style={{color:'#0d9488',fontSize:'18px'}}></i>
        </div>
      )}
      </aside>

      {/* ── Right column: body (timeline / grouped) — scroll อิสระ ── */}
      <div ref={rightColRef}
        style={{flex:1,minWidth:0,height:'100%',overflowY:'auto',overscrollBehavior:'contain',paddingRight:'8px',position:'relative'}}>
        {view === 'timeline' ? (
          // ─── Timeline view — ขยาย 780→936px (+20%) ───
          <div style={{maxWidth:'936px',margin:'0 auto'}}>
            {filteredTimeline.length === 0 ? (
              <div style={{textAlign:'center',padding:'60px 20px',color:'#9ca3af'}}>
                <i className="fa-solid fa-magnifying-glass-minus" style={{fontSize:'32px',marginBottom:'12px',display:'block'}}></i>
                <p style={{fontSize:'14px',fontWeight:600,margin:0}}>ไม่พบเวอร์ชันที่ตรงกับตัวกรอง</p>
                <button type="button" onClick={clearFilters} style={{marginTop:'12px',padding:'8px 16px',borderRadius:'8px',border:'1px solid #14b8a6',background:'#fff',color:'#0d9488',fontSize:'12px',fontWeight:700,cursor:'pointer'}}>ล้างตัวกรอง</button>
              </div>
            ) : (
              timelineToRender.map((v) => {
                const color = v._color;
                const isLatest = v.version === latestVersion;
                const visibleChanges = filterChanges(v.changes);
                if (visibleChanges.length === 0 && selectedTags.size > 0) return null;
                const isOpen = expandedComments.has(v.version);
                return (
                  <div key={v.version} className="cl-version-row" style={{display:'flex',gap:'14px',marginBottom:'14px'}}>
                    <div style={{display:'flex',flexDirection:'column',alignItems:'center',flexShrink:0,paddingTop:'6px'}}>
                      <div style={{width:'12px',height:'12px',borderRadius:'50%',background:color,boxShadow:`0 0 0 3px ${color}22`}}></div>
                      <div style={{width:'2px',flex:1,background:'#e5e7eb',marginTop:'4px'}}></div>
                    </div>
                    <div style={{flex:1,background:isLatest?'#fffbeb':'#fff',border:isLatest?'2px solid #fbbf24':'1px solid #e5e7eb',borderRadius:'14px',padding:'14px 16px',boxShadow:isLatest?'0 2px 14px rgba(251,191,36,0.28)':'0 1px 3px rgba(0,0,0,0.04)'}}>
                      <div style={{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap',marginBottom:'6px'}}>
                        <span style={{fontWeight:800,fontSize:'15px',color}}>v{highlightMatch(v.version)}</span>
                        <span style={{fontSize:'11px',color:'#9ca3af'}}>{v.date}</span>
                        <CommitChip v={v} color={color}/>
                        {isLatest && <span style={{fontSize:'10px',fontWeight:700,color:'#92400e',background:'#fef3c7',padding:'2px 8px',borderRadius:'999px'}}>ล่าสุด</span>}
                        {commentCounts[v.version] > 0 && (
                          <button type="button" tabIndex={-1} onMouseDown={e=>e.preventDefault()}
                            onClick={e=>{e.stopPropagation();setOnlyWithComments(v=>!v);}}
                            title={`มี ${commentCounts[v.version]} ความคิดเห็น — กดเพื่อกรองเฉพาะที่มีความคิดเห็น`}
                            style={{cursor:'pointer',display:'inline-flex',alignItems:'center',gap:'3px',fontSize:'10px',fontWeight:700,color:onlyWithComments?'#fff':'#92400e',background:onlyWithComments?'#d97706':'#fef3c7',border:onlyWithComments?'1px solid #b45309':'1px solid #fbbf24',padding:'2px 7px',borderRadius:'999px',transition:'all 0.15s'}}>
                            <i className="fa-regular fa-comment"></i>{commentCounts[v.version]}
                          </button>
                        )}
                        <TagBreakdown changes={v.changes}/>
                      </div>
                      <p style={{fontSize:'14px',fontWeight:700,color:'#1f2937',margin:'0 0 8px'}}>{highlightMatch(v.title)}</p>
                      {visibleChanges.map((c,i)=><ChangeRow key={`${i}-${c.tag}`} change={c}/>)}
                      {(() => {
                        const hasComments = commentCounts[v.version] > 0;
                        // มี comment → สีอำพัน / ไม่มี → สี teal
                        const border = hasComments
                          ? (isOpen ? '#d97706' : '#fbbf24')
                          : (isOpen ? '#0d9488' : '#5eead4');
                        const bg = hasComments
                          ? (isOpen ? '#fef3c7' : '#fffbeb')
                          : (isOpen ? '#ccfbf1' : '#f0fdfa');
                        const fg = hasComments ? '#92400e' : '#0f766e';
                        const badgeBg = hasComments ? '#d97706' : '#0d9488';
                        return (
                          <button type="button" tabIndex={-1} onMouseDown={e=>e.preventDefault()}
                            onClick={e=>{e.stopPropagation();toggleComments(v.version);}}
                            style={{cursor:'pointer',width:'100%',marginTop:'10px',padding:'10px 14px',border:'1.5px solid '+border,background:bg,color:fg,fontSize:'13px',borderRadius:'10px',fontWeight:700,display:'flex',alignItems:'center',justifyContent:'space-between',transition:'all 0.15s'}}>
                            <span>
                              <i className="fa-regular fa-comment" style={{marginRight:'8px'}}></i>ความคิดเห็น
                              {hasComments && <span style={{background:badgeBg,color:'#fff',fontSize:'10px',padding:'1px 7px',borderRadius:'999px',marginLeft:'4px'}}>{commentCounts[v.version]}</span>}
                              {commentsMeta.isAdmin && commentDeletedCounts[v.version] > 0 && (
                                <span style={{marginLeft:'6px',fontSize:'11px',color:'#991b1b',fontWeight:600}}>
                                  · <i className="fa-solid fa-trash" style={{fontSize:'9px'}}></i> ลบไป {commentDeletedCounts[v.version]}
                                </span>
                              )}
                            </span>
                            <span style={{fontSize:'12px',fontWeight:600,opacity:0.85}}>
                              {isOpen ? 'ซ่อน' : (hasComments ? 'ดูความคิดเห็น' : 'เขียนความคิดเห็น')} <i className={'fa-solid '+(isOpen?'fa-chevron-up':'fa-chevron-down')} style={{marginLeft:'4px',fontSize:'10px'}}></i>
                            </span>
                          </button>
                        );
                      })()}
                      {/* v0.7.15.4 — keep mounted ตลอดหลังเปิดครั้งแรก → ปิด/เปิดครั้งถัดไป instant */}
                      {everOpenedVersions.has(v.version) && (
                        <div style={{display: isOpen ? 'block' : 'none'}}>
                          <ChangelogCommentSection key={'cmt-'+v.version} version={v.version}
                            theme={commentCounts[v.version] > 0 ? 'amber' : 'teal'}
                            initialComments={allCommentsByVersion[v.version] || []}
                            currentUserId={commentsMeta.currentUserId}
                            isAdmin={commentsMeta.isAdmin}
                            onRefresh={refreshAllComments}
                            onCountChange={n=>setCommentCount(v.version, n)}
                            highlightCommentId={highlightCommentTarget?.version === v.version ? highlightCommentTarget.commentId : null}
                            pageFilter={{ hasFilter: hasCommentFilter, matches: commentMatchesAxes }}/>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            {/* v0.7.17.0 — ปุ่มดูเพิ่ม (lazy load timeline) */}
            {filteredTimeline.length > visibleTimelineCount && (
              <div style={{textAlign:'center',padding:'16px 0 24px'}}>
                <button type="button"
                  onClick={()=>setVisibleTimelineCount(c => c + 20)}
                  style={{cursor:'pointer',padding:'10px 24px',border:'1.5px solid #14b8a6',background:'#fff',color:'#0d9488',fontSize:'13px',fontWeight:700,borderRadius:'999px',boxShadow:'0 1px 3px rgba(13,148,136,0.12)',transition:'all 0.15s'}}
                  onMouseEnter={e=>{e.currentTarget.style.background='#f0fdfa';e.currentTarget.style.borderColor='#0d9488';}}
                  onMouseLeave={e=>{e.currentTarget.style.background='#fff';e.currentTarget.style.borderColor='#14b8a6';}}>
                  <i className="fa-solid fa-chevron-down" style={{marginRight:'6px',fontSize:'11px'}}></i>
                  ดูเวอร์ชั่นเก่าอีก {Math.min(20, filteredTimeline.length - visibleTimelineCount)} เวอร์ชั่น
                  <span style={{marginLeft:'8px',fontSize:'11px',color:'#9ca3af',fontWeight:500}}>
                    ({visibleTimelineCount} / {filteredTimeline.length})
                  </span>
                </button>
              </div>
            )}
          </div>
        ) : (
          // ─── Grouped view ───
          <div style={{maxWidth:'1056px',margin:'0 auto'}}>
            {CHANGELOG.map(major => {
              const expanded = expandedMajors.has(major.major);
              const filteredVersions = major.versions.filter(matchesFilters);
              if (filteredVersions.length === 0 && hasActiveFilters) return null;
              return (
                <div key={major.major} style={{marginBottom:'14px',background:'#fff',border:'1px solid #e5e7eb',borderRadius:'16px',overflow:'hidden',boxShadow:'0 1px 3px rgba(0,0,0,0.04)'}}>
                  {/* Major header */}
                  <div onClick={()=>toggleMajor(major.major)}
                    style={{padding:'16px 20px',background:`linear-gradient(135deg,${major.color}11,${major.color}05)`,borderLeft:`5px solid ${major.color}`,cursor:'pointer',display:'flex',alignItems:'center',gap:'14px',transition:'background 0.15s'}}
                    onMouseEnter={e=>e.currentTarget.style.background=`linear-gradient(135deg,${major.color}1f,${major.color}0a)`}
                    onMouseLeave={e=>e.currentTarget.style.background=`linear-gradient(135deg,${major.color}11,${major.color}05)`}>
                    <div style={{fontSize:'28px'}}>{major.icon}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <p style={{fontWeight:800,fontSize:'16px',color:major.color,margin:0}}>รุ่น v{major.major}.x — {major.era}</p>
                      <p style={{fontSize:'12px',color:'#6b7280',margin:'2px 0 0',lineHeight:1.5}}>{major.description}</p>
                      <p style={{fontSize:'11px',color:'#9ca3af',margin:'3px 0 0'}}>
                        <i className="fa-solid fa-calendar" style={{marginRight:'5px'}}></i>{major.period} · {filteredVersions.length} เวอร์ชัน
                      </p>
                    </div>
                    <i className={`fa-solid fa-chevron-${expanded?'up':'down'}`} style={{color:major.color,fontSize:'14px'}}></i>
                  </div>
                  {/* Minor groups list (e.g. 0.7.1, 0.7.2, ..., 0.7.13) */}
                  {expanded && (
                    <div style={{padding:'4px 20px 16px'}}>
                      {groupByMinor(filteredVersions).map(({minorKey, versions}) => {
                        const minorOpen = expandedMinors.has(minorKey);
                        const hasMultiple = versions.length > 1;
                        const latestInMinor = versions[0]; // ใหม่สุดในกลุ่ม
                        return (
                          <div key={minorKey} style={{borderTop:'1px solid #f1f5f9',padding:'8px 0'}}>
                            {/* Minor header */}
                            <div onClick={()=>toggleMinor(minorKey)}
                              style={{cursor:'pointer',display:'flex',alignItems:'center',gap:'10px',padding:'8px 10px',borderRadius:'10px',transition:'background 0.15s',background:minorOpen?`${major.color}0d`:'transparent'}}
                              onMouseEnter={e=>{if(!minorOpen)e.currentTarget.style.background='#f9fafb'}}
                              onMouseLeave={e=>{if(!minorOpen)e.currentTarget.style.background='transparent'}}>
                              <i className={`fa-solid fa-chevron-${minorOpen?'down':'right'}`} style={{color:major.color,fontSize:'11px',width:'11px'}}></i>
                              <span style={{fontWeight:800,fontSize:'14px',color:major.color,minWidth:'90px'}}>v{highlightMatch(minorKey)}</span>
                              <span style={{fontSize:'12px',color:'#6b7280',flex:1}}>{highlightMatch(latestInMinor.title)}</span>
                              {hasMultiple && <span style={{fontSize:'11px',fontWeight:700,color:major.color,background:`${major.color}1a`,padding:'2px 8px',borderRadius:'999px'}}>{versions.length} เวอร์ชันย่อย</span>}
                              {!hasMultiple && <span style={{fontSize:'11px',color:'#9ca3af'}}>{latestInMinor.date}</span>}
                            </div>
                            {/* Patch-level versions inside this minor */}
                            {minorOpen && (
                              <div style={{padding:'4px 4px 4px 24px',borderLeft:`2px dashed ${major.color}33`,marginLeft:'9px',marginTop:'4px'}}>
                                {versions.map(v => {
                                  const isOpen = expandedVersions.has(v.version);
                                  const visibleChanges = filterChanges(v.changes);
                                  const isLatest = v.version === latestVersion;
                                  return (
                                    <div key={v.version} style={{padding:'4px 0'}}>
                                      <div onClick={()=>toggleVersion(v.version)}
                                        style={{cursor:'pointer',display:'flex',alignItems:'center',gap:'10px',padding:'6px 8px',borderRadius:'8px',transition:'background 0.15s'}}
                                        onMouseEnter={e=>e.currentTarget.style.background='#f9fafb'}
                                        onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                                        <i className={`fa-solid fa-chevron-${isOpen?'down':'right'}`} style={{color:'#9ca3af',fontSize:'10px',width:'10px'}}></i>
                                        <span style={{fontWeight:700,fontSize:'12px',color:major.color,minWidth:'78px'}}>v{highlightMatch(v.version)}</span>
                                        <span style={{fontSize:'11px',color:'#9ca3af',minWidth:'90px'}}>{v.date}</span>
                                        <span style={{fontSize:'12px',color:'#374151',flex:1}}>{highlightMatch(v.title)}</span>
                                        {isLatest && <span style={{fontSize:'9px',fontWeight:700,color:'#92400e',background:'#fef3c7',padding:'2px 7px',borderRadius:'999px'}}>ล่าสุด</span>}
                                        <TagBreakdown changes={v.changes} small/>
                                      </div>
                                      {isOpen && (
                                        <div style={{padding:'4px 4px 4px 24px',borderLeft:`2px solid ${major.color}22`,marginLeft:'5px',marginTop:'2px'}}>
                                          {visibleChanges.map((c,i)=><ChangeRow key={`${i}-${c.tag}`} change={c}/>)}
                                          {v.commit && <div style={{margin:'8px 0 0'}}><CommitChip v={v} color={major.color} small/></div>}
                                          {(() => {
                                            const has = commentCounts[v.version] > 0;
                                            const bg = has ? '#fffbeb' : '#f0fdfa';
                                            const bd = has ? '#fbbf24' : '#5eead4';
                                            const fg = has ? '#92400e' : '#0f766e';
                                            const bdgBg = has ? '#d97706' : '#0d9488';
                                            return (
                                              <div style={{marginTop:'10px',padding:'8px 12px',background:bg,border:'1px solid '+bd,borderRadius:'8px',fontSize:'12px',fontWeight:700,color:fg,display:'flex',alignItems:'center',gap:'6px'}}>
                                                <i className="fa-regular fa-comment"></i>
                                                <span>ความคิดเห็น {has && <span style={{background:bdgBg,color:'#fff',padding:'1px 7px',borderRadius:'999px',marginLeft:'4px',fontSize:'10px'}}>{commentCounts[v.version]}</span>} — เขียน หรือดูความคิดเห็นด้านล่าง</span>
                                              </div>
                                            );
                                          })()}
                                          <ChangelogCommentSection version={v.version}
                                            theme={commentCounts[v.version] > 0 ? 'amber' : 'teal'}
                                            initialComments={allCommentsByVersion[v.version] || []}
                                            currentUserId={commentsMeta.currentUserId}
                                            isAdmin={commentsMeta.isAdmin}
                                            onRefresh={refreshAllComments}
                                            onCountChange={n=>setCommentCount(v.version, n)}
                                            highlightCommentId={highlightCommentTarget?.version === v.version ? highlightCommentTarget.commentId : null}/>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>{/* /right column */}

      {/* v0.7.17.3 — ScrollNav ของคอลัมน์ขวา (ขึ้น/ลง auto-detect) */}
      <ScrollNav getContainer={()=>rightColRef.current} />
      </div>{/* /2-column layout */}

      {/* Commit detail popup */}
      {commitDetailEntry && (
        <CommitDetailModal
          entry={commitDetailEntry.entry}
          color={commitDetailEntry.color}
          copiedHash={copiedHash}
          copiedFull={copiedFull}
          onCopy={copyHash}
          onCopyFull={()=>copyFullCommit(commitDetailEntry.entry)}
          onClose={()=>setCommitDetailEntry(null)}
        />
      )}

      {/* Local toast (มุมขวาล่าง — เด้งแล้วหายเอง 2 วินาที) */}
      {localToast && (
        <div style={{position:'fixed',bottom:'24px',right:'24px',zIndex:80,background:'#065f46',color:'#fff',padding:'12px 20px',borderRadius:'10px',fontSize:'13px',fontWeight:600,boxShadow:'0 8px 24px rgba(0,0,0,0.25)',display:'flex',alignItems:'center',gap:'8px'}}
          className="modal-toast">
          <i className="fa-solid fa-circle-check" style={{fontSize:'16px'}}></i>
          {localToast.text}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CommitDetailModal — popup กลางจอ แสดง commit body ฉบับเต็ม
// ═══════════════════════════════════════════════════════════════════════════
function CommitDetailModal({ entry, color, copiedHash, copiedFull, onCopy, onCopyFull, onClose }) {
  const {closing, close, modalCls, overlayCls} = useModalAnim(onClose);
  const fullHash = entry.commitFull || entry.commit;
  const justCopiedHash = copiedHash === fullHash;
  const justCopiedFull = copiedFull === entry.version;
  const ghUrl = (entry.commitFull || entry.commit) && entry.commit !== 'pending'
    ? `https://github.com/sirawitphaopha/tb-dashboard-bysirawit/commit/${entry.commitFull || entry.commit}`
    : null;
  return (
    <div className={"fixed inset-0 z-[70] flex items-center justify-center p-4 "+overlayCls}
      style={{background:'rgba(15,23,42,0.55)',backdropFilter:'blur(3px)'}}
      onClick={close}>
      <div className={modalCls} onClick={e=>e.stopPropagation()}
        style={{background:'#fff',borderRadius:'18px',width:'100%',maxWidth:'760px',maxHeight:'85vh',display:'flex',flexDirection:'column',overflow:'hidden',boxShadow:'0 24px 60px rgba(0,0,0,0.3)'}}>
        {/* Header */}
        <div style={{padding:'18px 22px',background:`linear-gradient(135deg,${color||'#0f766e'},${color||'#0f766e'}dd)`,color:'#fff',flexShrink:0}}>
          <div style={{display:'flex',alignItems:'flex-start',gap:'12px'}}>
            <div style={{width:'40px',height:'40px',borderRadius:'10px',background:'rgba(255,255,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <i className="fa-solid fa-file-lines" style={{fontSize:'18px'}}></i>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <p style={{fontWeight:800,fontSize:'15px',margin:0,lineHeight:1.4}}>{entry.title}</p>
              <p style={{fontSize:'12px',margin:'4px 0 0',opacity:0.9}}>v{entry.version} · {entry.date}</p>
              <div style={{display:'flex',gap:'6px',marginTop:'8px',flexWrap:'wrap',alignItems:'center'}}>
                <button type="button" tabIndex={-1} onMouseDown={e=>e.preventDefault()} onClick={()=>onCopy(fullHash)}
                  title="คลิกเพื่อ copy commit hash (full SHA-1, 40 ตัว)"
                  style={{cursor:'pointer',border:'none',fontSize:'10px',fontFamily:'monospace',background: justCopiedHash ? '#d1fae5' : 'rgba(255,255,255,0.12)',color: justCopiedHash ? '#065f46' : '#fff',padding:'4px 10px',borderRadius:'6px',fontWeight:600,wordBreak:'break-all',maxWidth:'100%',textAlign:'left',transition:'all 0.15s'}}>
                  <i className={'fa-solid '+(justCopiedHash?'fa-check':'fa-code-commit')} style={{marginRight:'5px'}}></i>{justCopiedHash ? 'คัดลอกแล้ว' : fullHash}
                </button>
                <button type="button" onClick={onCopyFull} title="คัดลอก commit ฉบับเต็ม (รวม body)"
                  style={{cursor:'pointer',border:'none',fontSize:'11px',background: justCopiedFull ? '#d1fae5' : '#fef3c7',color: justCopiedFull ? '#065f46' : '#92400e',padding:'4px 10px',borderRadius:'6px',fontWeight:700,transition:'all 0.15s'}}>
                  <i className={(justCopiedFull ? 'fa-solid fa-check' : 'fa-regular fa-copy')} style={{marginRight:'5px'}}></i>{justCopiedFull ? 'คัดลอกแล้ว' : 'คัดลอกทั้งหมด'}
                </button>
                {ghUrl && (
                  <a href={ghUrl} target="_blank" rel="noopener noreferrer"
                    style={{fontSize:'11px',background:'rgba(255,255,255,0.2)',color:'#fff',padding:'4px 10px',borderRadius:'6px',fontWeight:700,textDecoration:'none'}}>
                    <i className="fa-brands fa-github" style={{marginRight:'5px'}}></i>เปิดใน GitHub
                  </a>
                )}
              </div>
            </div>
            <button type="button" onClick={close}
              style={{width:'32px',height:'32px',borderRadius:'8px',border:'none',background:'rgba(255,255,255,0.2)',color:'#fff',cursor:'pointer',flexShrink:0}}>
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>
        {/* Body — scrollable monospace */}
        <div style={{flex:1,overflowY:'auto',padding:'20px 24px',background:'#fafafa'}}>
          {entry.body
            ? <pre style={{margin:0,fontFamily:'monospace',fontSize:'12.5px',color:'#374151',lineHeight:1.7,whiteSpace:'pre-wrap',wordBreak:'break-word'}}>{entry.body}</pre>
            : <p style={{fontSize:'13px',color:'#9ca3af',textAlign:'center',padding:'40px 20px'}}>
                <i className="fa-solid fa-file-circle-question" style={{fontSize:'24px',display:'block',marginBottom:'10px'}}></i>
                ยังไม่มีรายละเอียด commit body สำหรับเวอร์ชันนี้
              </p>
          }
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ChangelogCommentSection — ระบบ comment ต่อ version
// • ทุกคนเห็น comment ของทุกคน
// • เขียน/แก้ไข/ลบ ของตัวเอง (admin ลบของคนอื่นได้)
// • 4 status: feedback / bug_report / request / note
// ═══════════════════════════════════════════════════════════════════════════
const CHANGELOG_STATUS_META = {
  feedback:   { emoji:'💬', label:'ความเห็น',   bg:'#dbeafe', fg:'#1e3a8a', border:'#93c5fd' },
  bug_report: { emoji:'🐛', label:'แจ้งบั๊ก',   bg:'#fee2e2', fg:'#991b1b', border:'#fca5a5' },
  request:    { emoji:'✨', label:'ขอฟีเจอร์', bg:'#f3e8ff', fg:'#6b21a8', border:'#d8b4fe' },
  note:       { emoji:'📝', label:'บันทึก',     bg:'#f1f5f9', fg:'#334155', border:'#cbd5e1' },
};

const ChangelogCommentSection = React.memo(function ChangelogCommentSection({ version, onCountChange, theme, initialComments, currentUserId: propsUserId, isAdmin: propsIsAdmin, onRefresh, pageFilter, highlightCommentId }) {
  const T = theme === 'amber'
    ? { bg:'#fffbeb', border:'#f59e0b', accent:'#92400e', accent2:'#d97706', sub:'#b45309', cardBorder:'#fbbf24', formBorder:'#f59e0b' }
    : { bg:'#f0fdfa', border:'#99f6e4', accent:'#0f766e', accent2:'#0d9488', sub:'#5eead4', cardBorder:'#ccfbf1', formBorder:'#5eead4' };
  const [comments, setComments] = React.useState(initialComments || []);
  const [loading, setLoading]   = React.useState(!initialComments);
  const [error, setError]       = React.useState('');
  const [currentUserId, setCurrentUserId] = React.useState(propsUserId || null);
  const [isAdmin, setIsAdmin]   = React.useState(!!propsIsAdmin);
  React.useEffect(() => {
    if (initialComments) {
      // v0.7.15.1 fix — merge optimistic _pending comments ที่ parent ยังไม่เห็น
      // match ด้วย signature (user_id + comment_text + version + parent_comment_id)
      // เพราะ id ของ optimistic = tmp-xxx ไม่ตรงกับ id จริงของ server
      setComments(prev => {
        // flatten incoming: parents + replies
        const flatIncoming = [];
        for (const c of initialComments) {
          flatIncoming.push(c);
          if (Array.isArray(c.replies)) flatIncoming.push(...c.replies);
        }
        const stillPending = prev.filter(c => {
          if (!c._pending) return false;
          // เก็บไว้ถ้า server ยังไม่มี comment ที่ match
          const matched = flatIncoming.some(ic =>
            ic.user_id === c.user_id &&
            ic.comment_text === c.comment_text &&
            ic.version === c.version &&
            (ic.parent_comment_id || null) === (c.parent_comment_id || null)
          );
          return !matched;
        });
        return stillPending.length > 0 ? [...initialComments, ...stillPending] : initialComments;
      });
      setLoading(false);
    }
    if (propsUserId !== undefined) setCurrentUserId(propsUserId);
    if (propsIsAdmin !== undefined) setIsAdmin(!!propsIsAdmin);
  }, [initialComments, propsUserId, propsIsAdmin]);
  // v0.7.16.7+ — draft auto-save keys (localStorage)
  const draftKey = 'tb_draft_' + version;
  const draftStatusKey = 'tb_draft_status_' + version;
  const [draftText, setDraftText] = React.useState(() => {
    try { return localStorage.getItem(draftKey) || ''; } catch { return ''; }
  });
  const [draftStatus, setDraftStatus] = React.useState(() => {
    try { return localStorage.getItem(draftStatusKey) || 'feedback'; } catch { return 'feedback'; }
  });
  const [draftSavedAt, setDraftSavedAt] = React.useState(null); // indicator "บันทึกเมื่อ HH:MM"
  const [uploadToast, setUploadToast] = React.useState(false); // toast แสดง "ฟีเจอร์อัปโหลดยังไม่เปิด"
  const showUploadToast = React.useCallback(() => {
    setUploadToast(true);
    setTimeout(() => setUploadToast(false), 2800);
  }, []);
  // Save draft → localStorage (debounced 1.5s)
  React.useEffect(() => {
    const t = setTimeout(() => {
      try {
        if (draftText) {
          localStorage.setItem(draftKey, draftText);
          localStorage.setItem(draftStatusKey, draftStatus);
          setDraftSavedAt(Date.now());
        } else {
          localStorage.removeItem(draftKey);
          localStorage.removeItem(draftStatusKey);
        }
      } catch {}
    }, 1500);
    return () => clearTimeout(t);
  }, [draftText, draftStatus, draftKey, draftStatusKey]);
  const [submitting, setSubmitting]   = React.useState(false);
  const [editingId, setEditingId]   = React.useState(null);
  const [editText, setEditText]     = React.useState('');
  const [editStatus, setEditStatus] = React.useState('feedback');
  const [savingEdit, setSavingEdit] = React.useState(false);
  const [confirmDelId, setConfirmDelId] = React.useState(null);
  // v0.7.14.5 states
  const [filterMode, setFilterMode] = React.useState('all');
  const [sortMode, setSortMode]     = React.useState('oldest');
  const [hideResolved, setHideResolved] = React.useState(false);
  const [replyingToId, setReplyingToId] = React.useState(null);
  const [replyText, setReplyText]       = React.useState('');
  const [replyStatus, setReplyStatus]   = React.useState('feedback');
  const [savingReply, setSavingReply]   = React.useState(false);
  // v0.7.16.7+ — reply draft auto-save per parentId
  React.useEffect(() => {
    if (!replyingToId) return;
    const t = setTimeout(() => {
      try {
        const k = 'tb_draft_reply_' + replyingToId;
        if (replyText) localStorage.setItem(k, replyText);
        else localStorage.removeItem(k);
      } catch {}
    }, 1500);
    return () => clearTimeout(t);
  }, [replyText, replyingToId]);
  // edit draft auto-save per commentId
  React.useEffect(() => {
    if (!editingId) return;
    const t = setTimeout(() => {
      try {
        const k = 'tb_draft_edit_' + editingId;
        if (editText) localStorage.setItem(k, editText);
        else localStorage.removeItem(k);
      } catch {}
    }, 1500);
    return () => clearTimeout(t);
  }, [editText, editingId]);
  const [historyOpenId, setHistoryOpenId] = React.useState(null);
  const [historyData, setHistoryData]     = React.useState(null);
  const [historyLoading, setHistoryLoading] = React.useState(false);
  const [mentionState, setMentionState] = React.useState(null);
  const [revealDeletedIds, setRevealDeletedIds] = React.useState(new Set());
  const toggleRevealDeleted = (id) => setRevealDeletedIds(prev => {
    const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n;
  });
  // Tick state — บังคับ re-render ทุก 30s เพื่ออัป relative time ("4 นาทีที่แล้ว")
  // v0.7.15.1 — tick 60s (เดิม 30s) → ลด re-render ครึ่งหนึ่ง
  // relative time "4 นาทีที่แล้ว" → "5 นาที" — ไม่ละเอียดวินาที ยอมรับได้
  const [, setTick] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(id);
  }, []);

  const onCountChangeRef = React.useRef(onCountChange);
  const onRefreshRef = React.useRef(onRefresh);
  React.useEffect(() => { onCountChangeRef.current = onCountChange; onRefreshRef.current = onRefresh; });

  // นับ active + deleted (admin เห็นทั้งคู่)
  const { activeCount, deletedCount } = React.useMemo(() => {
    let a = 0, d = 0;
    for (const c of comments) {
      if (c.deleted_at) d += 1; else a += 1;
      if (Array.isArray(c.replies)) for (const r of c.replies) { if (r.deleted_at) d += 1; else a += 1; }
    }
    return { activeCount: a, deletedCount: d };
  }, [comments]);
  React.useEffect(() => { if (onCountChangeRef.current) onCountChangeRef.current(activeCount); }, [activeCount]);

  // กรอง + เรียง parent (deleted ยังคงแสดงเป็น tombstone — ไม่ filter ออก ยกเว้น status filter)
  const visibleParents = React.useMemo(() => {
    let arr = comments.filter(c => !c.parent_comment_id);
    if (filterMode === 'unresolved_bug')          arr = arr.filter(c => c.status === 'bug_report' && !c.resolved_at && !c.deleted_at);
    else if (filterMode === 'unresolved_request') arr = arr.filter(c => c.status === 'request' && !c.resolved_at && !c.deleted_at);
    else if (filterMode === 'bug')      arr = arr.filter(c => c.status === 'bug_report' && !c.deleted_at);
    else if (filterMode === 'request')  arr = arr.filter(c => c.status === 'request' && !c.deleted_at);
    else if (filterMode === 'feedback') arr = arr.filter(c => c.status === 'feedback' && !c.deleted_at);
    else if (filterMode === 'note')     arr = arr.filter(c => c.status === 'note' && !c.deleted_at);
    if (hideResolved) arr = arr.filter(c => !c.resolved_at);
    arr = [...arr];
    if (sortMode === 'newest')    arr.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    else if (sortMode === 'oldest') arr.sort((a,b) => new Date(a.created_at) - new Date(b.created_at));
    else if (sortMode === 'most_liked') arr.sort((a,b) => (b.likes_count||0) - (a.likes_count||0));
    return arr;
  }, [comments, filterMode, sortMode, hideResolved]);

  // v0.7.17.1 — Lazy render comments (15 ก่อน + ดูเพิ่ม)
  // v0.7.17.2 — fix: ถ้ามี highlightCommentId (กระดิ่ง navigate) ที่ตรงกับ comment ใน list → render ครบ
  //              กัน scroll หา cmt-{id} ไม่เจอเพราะอยู่นอกช่วง lazy
  const [visibleCmtCount, setVisibleCmtCount] = React.useState(15);
  React.useEffect(() => { setVisibleCmtCount(15); }, [filterMode, sortMode, hideResolved]);
  const hasHighlightInList = React.useMemo(() => {
    if (!highlightCommentId) return false;
    return visibleParents.some(c =>
      c.id === highlightCommentId || (c.replies||[]).some(r => r.id === highlightCommentId)
    );
  }, [highlightCommentId, visibleParents]);
  const visibleCommentParents = React.useMemo(
    () => hasHighlightInList ? visibleParents : visibleParents.slice(0, visibleCmtCount),
    [visibleParents, visibleCmtCount, hasHighlightInList]
  );

  const load = React.useCallback(async () => {
    if (onRefreshRef.current) { await onRefreshRef.current(); return; }
    setLoading(true); setError('');
    try {
      const r = await fetch(`/api/changelog/comments?version=${encodeURIComponent(version)}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'load failed');
      setComments(j.comments || []);
      setCurrentUserId(j.current_user_id);
      setIsAdmin(!!j.is_admin);
    } catch (e) { setError(e.message || 'โหลด comment ล้มเหลว'); }
    finally { setLoading(false); }
  }, [version]);

  // ถ้า parent ไม่ส่ง initialComments มา → fallback โหลดเอง
  React.useEffect(() => {
    if (initialComments === undefined && !onRefresh) load();
  }, [initialComments, onRefresh, load]);

  // v0.7.14.7 — หา snapshot ของ user ปัจจุบันจาก comment เก่า (display_name + profession_label)
  const findMySnapshot = () => {
    for (const c of comments) {
      if (c.user_id === currentUserId) return { display_name: c.display_name, profession_label: c.profession_label, role: c.role, avatar_url: c.avatar_url || null, avatar_updated_at: c.avatar_updated_at || null };
      if (Array.isArray(c.replies)) {
        for (const r of c.replies) {
          if (r.user_id === currentUserId) return { display_name: r.display_name, profession_label: r.profession_label, role: r.role, avatar_url: r.avatar_url || null, avatar_updated_at: r.avatar_updated_at || null };
        }
      }
    }
    return { display_name: 'คุณ', profession_label: '', role: isAdmin ? 'admin' : 'user', avatar_url: null, avatar_updated_at: null };
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const t = draftText.trim();
    if (!t) return;
    if (t.length > 2000) { setError('comment ยาวเกิน 2000 ตัวอักษร'); return; }
    setSubmitting(true); setError('');
    // ── Optimistic: push comment ทันที ──
    const tempId = 'tmp-' + Date.now() + '-' + Math.random().toString(36).slice(2,8);
    const me = findMySnapshot();
    const optimistic = {
      id: tempId,
      version,
      user_id: currentUserId,
      display_name: me.display_name,
      profession_label: me.profession_label,
      role: me.role,
      avatar_url: me.avatar_url,
      avatar_updated_at: me.avatar_updated_at,
      comment_text: t,
      status: draftStatus,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      edited: false,
      parent_comment_id: null,
      resolved_at: null,
      mentioned_user_ids: [],
      deleted_at: null,
      likes_count: 0,
      liked_by_me: false,
      replies: [],
      _pending: true,
    };
    setComments(prev => [...prev, optimistic]);
    setDraftText(''); setDraftStatus('feedback');
    // clear localStorage draft (success path)
    try { localStorage.removeItem(draftKey); localStorage.removeItem(draftStatusKey); } catch {}
    setDraftSavedAt(null);
    try {
      const r = await fetch('/api/changelog/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version, comment_text: t, status: draftStatus }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'submit failed');
      await load(); // refetch → replace temp ด้วย real
    } catch (e) {
      setError(e.message || 'ส่ง comment ล้มเหลว');
      // rollback + คืน text + restore draft
      setComments(prev => prev.filter(c => c.id !== tempId));
      setDraftText(t);
    } finally { setSubmitting(false); }
  };

  const startEdit = (c) => {
    setEditingId(c.id);
    // ถ้ามี draft edit เก่าใน localStorage → ใช้ค่านั้น (กันหาย)
    let savedDraft = '';
    try { savedDraft = localStorage.getItem('tb_draft_edit_' + c.id) || ''; } catch {}
    setEditText(savedDraft || c.comment_text);
    setEditStatus(c.status);
  };
  const cancelEdit = () => {
    if (editingId) { try { localStorage.removeItem('tb_draft_edit_' + editingId); } catch {} }
    setEditingId(null); setEditText('');
  };
  const saveEdit = async (id) => {
    const t = editText.trim();
    if (!t) return;
    setSavingEdit(true); setError('');
    // Backup เพื่อ rollback
    const before = comments;
    const nowIso = new Date().toISOString();
    // ── Optimistic: update local ทันที ──
    const applyEdit = (c) => c.id === id
      ? { ...c, comment_text: t, status: editStatus, edited: true, updated_at: nowIso }
      : c;
    setComments(prev => prev.map(c => {
      const updated = applyEdit(c);
      if (Array.isArray(c.replies)) {
        const nr = c.replies.map(applyEdit);
        if (nr.some((r,i) => r !== c.replies[i])) return { ...updated, replies: nr };
      }
      return updated;
    }));
    try { localStorage.removeItem('tb_draft_edit_' + id); } catch {}
    setEditingId(null);
    try {
      const r = await fetch(`/api/changelog/comment/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment_text: t, status: editStatus }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'edit failed');
      await load();
    } catch (e) {
      setError(e.message || 'แก้ไขล้มเหลว');
      setComments(before); // rollback
    } finally { setSavingEdit(false); }
  };

  const doDelete = async (id) => {
    setError('');
    const nowIso = new Date().toISOString();
    setComments(prev => prev.map(p => {
      if (p.id === id) return { ...p, deleted_at: nowIso, deleted_by: currentUserId };
      if (Array.isArray(p.replies)) {
        let t = false;
        const nr = p.replies.map(r => { if (r.id === id) { t = true; return { ...r, deleted_at: nowIso, deleted_by: currentUserId }; } return r; });
        if (t) return { ...p, replies: nr };
      }
      return p;
    }));
    setConfirmDelId(null);
    try {
      const r = await fetch(`/api/changelog/comment/${id}`, { method: 'DELETE' });
      if (!r.ok) { const j = await r.json(); setError(j.error || 'ลบล้มเหลว'); await load(); }
    } catch (e) { setError(e.message || 'ลบล้มเหลว'); await load(); }
  };

  // v0.7.14.5 handlers
  const toggleLike = async (c) => {
    const wasLiked = c.liked_by_me;
    setComments(prev => prev.map(p => {
      if (p.id === c.id) return { ...p, liked_by_me: !wasLiked, likes_count: (p.likes_count||0) + (wasLiked ? -1 : 1) };
      if (Array.isArray(p.replies)) {
        const nr = p.replies.map(r => r.id === c.id ? { ...r, liked_by_me: !wasLiked, likes_count: (r.likes_count||0) + (wasLiked ? -1 : 1) } : r);
        if (nr !== p.replies) return { ...p, replies: nr };
      }
      return p;
    }));
    try { await fetch(`/api/changelog/comment/${c.id}/like`, { method: wasLiked ? 'DELETE' : 'POST' }); } catch {}
  };
  const openHistory = async (id) => {
    setHistoryOpenId(id); setHistoryLoading(true); setHistoryData(null);
    try { const r = await fetch(`/api/changelog/comment/${id}/history`); const j = await r.json(); if (r.ok) setHistoryData(j); }
    finally { setHistoryLoading(false); }
  };
  const closeHistory = () => { setHistoryOpenId(null); setHistoryData(null); };
  const startReply = (parentId, defaultStatus) => {
    setReplyingToId(parentId);
    // ดึง draft reply เก่าจาก localStorage (ถ้ามี)
    let savedDraft = '';
    try { savedDraft = localStorage.getItem('tb_draft_reply_' + parentId) || ''; } catch {}
    setReplyText(savedDraft);
    setReplyStatus(defaultStatus || 'feedback');
  };
  const cancelReply = () => {
    // ลบ draft + clear state
    if (replyingToId) { try { localStorage.removeItem('tb_draft_reply_' + replyingToId); } catch {} }
    setReplyingToId(null); setReplyText('');
  };
  const submitReply = async (parentId) => {
    const t = replyText.trim(); if (!t) return;
    if (t.length > 2000) { setError('ตอบกลับยาวเกิน 2000 ตัวอักษร'); return; }
    setSavingReply(true); setError('');
    // ── Optimistic: push reply ใน parent.replies ทันที ──
    const tempId = 'tmp-' + Date.now() + '-' + Math.random().toString(36).slice(2,8);
    const me = findMySnapshot();
    const optimisticReply = {
      id: tempId,
      version,
      user_id: currentUserId,
      display_name: me.display_name,
      profession_label: me.profession_label,
      role: me.role,
      avatar_url: me.avatar_url,
      avatar_updated_at: me.avatar_updated_at,
      comment_text: t,
      status: replyStatus,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      edited: false,
      parent_comment_id: parentId,
      resolved_at: null,
      mentioned_user_ids: [],
      deleted_at: null,
      likes_count: 0,
      liked_by_me: false,
      _pending: true,
    };
    setComments(prev => prev.map(c => c.id === parentId
      ? { ...c, replies: [...(c.replies||[]), optimisticReply] }
      : c
    ));
    try { localStorage.removeItem('tb_draft_reply_' + parentId); } catch {}
    cancelReply();
    try {
      const r = await fetch(`/api/changelog/comment/${parentId}/reply`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ comment_text: t, status: replyStatus }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'reply failed');
      await load();
    } catch (e) {
      setError(e.message || 'ตอบกลับล้มเหลว');
      // rollback: ลบ reply temp ออก
      setComments(prev => prev.map(c => c.id === parentId
        ? { ...c, replies: (c.replies||[]).filter(r => r.id !== tempId) }
        : c
      ));
    } finally { setSavingReply(false); }
  };
  const toggleResolve = async (c) => {
    // ── Optimistic: update resolved_at ทันที ──
    const newResolvedAt = c.resolved_at ? null : new Date().toISOString();
    setComments(prev => prev.map(p => p.id === c.id ? { ...p, resolved_at: newResolvedAt } : p));
    try {
      const r = await fetch(`/api/changelog/comment/${c.id}/resolve`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ resolved: !c.resolved_at }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'resolve failed');
      await load();
    } catch (e) {
      setError(e.message || 'ทำเครื่องหมายล้มเหลว');
      // rollback
      setComments(prev => prev.map(p => p.id === c.id ? { ...p, resolved_at: c.resolved_at } : p));
    }
  };

  // ── Mention autocomplete + caret position ──
  // v0.7.14.7 — ใช้ global cache (window scope) → persist ข้าม component mount → ไม่ต้องโหลดซ้ำเมื่อกลับมาหน้านี้
  // v0.7.14.7 — เตือนก่อนปิดแท็บ/รีโหลด + ตั้ง window flag สำหรับ App component
  React.useEffect(() => {
    const hasDraft = !!(draftText.trim() || editText.trim() || replyText.trim());
    window._hasUnsentChangelogDraft = hasDraft;
    if (!hasDraft) return;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = 'มีข้อความที่ยังไม่ได้ส่ง — ออกจากหน้านี้แล้วข้อความจะหาย';
      return e.returnValue;
    };
    window.addEventListener('beforeunload', handler);
    return () => {
      window.removeEventListener('beforeunload', handler);
      window._hasUnsentChangelogDraft = false;
    };
  }, [draftText, editText, replyText]);
  // cleanup เมื่อ unmount — กัน flag ค้าง
  React.useEffect(() => {
    return () => { window._hasUnsentChangelogDraft = false; };
  }, []);

  if (!window._mentionUsersCache) window._mentionUsersCache = { users: null, fetchedAt: 0 };
  const mentionCacheRef = React.useRef(window._mentionUsersCache);
  // tick → trigger re-render เมื่อ cache โหลดเสร็จ → renderCommentText แสดงสีตาม role ถูก
  const [, setMentionTick] = useState(0);
  // Pre-fetch users ตอน mount + sync กับ global cache
  React.useEffect(() => {
    if (window._mentionUsersCache.users) { mentionCacheRef.current = window._mentionUsersCache; return; }
    (async () => {
      try {
        const r = await fetch('/api/changelog/mentionable-users');
        const j = await r.json();
        if (r.ok) {
          window._mentionUsersCache = { users: j.users || [], fetchedAt: Date.now() };
          mentionCacheRef.current = window._mentionUsersCache;
          setMentionTick(t => t + 1);  // trigger re-render → render mention ถูกสี
        }
      } catch {/* ignore */}
    })();
  }, []);
  const getCaretPx = (ta) => {
    try {
      const div = document.createElement('div');
      const s = window.getComputedStyle(ta);
      ['fontFamily','fontSize','fontWeight','lineHeight','letterSpacing','paddingTop','paddingRight','paddingBottom','paddingLeft','borderTopWidth','borderRightWidth','borderBottomWidth','borderLeftWidth','width','boxSizing'].forEach(p => div.style[p] = s[p]);
      div.style.position='absolute'; div.style.visibility='hidden'; div.style.top='0'; div.style.left='0'; div.style.whiteSpace='pre-wrap'; div.style.wordWrap='break-word';
      div.textContent = ta.value.substring(0, ta.selectionStart);
      const sp = document.createElement('span'); sp.textContent='​'; div.appendChild(sp);
      document.body.appendChild(div);
      const sr = sp.getBoundingClientRect(); const dr = div.getBoundingClientRect();
      const top = sr.top - dr.top + parseFloat(s.lineHeight || s.fontSize);
      const left = sr.left - dr.left;
      document.body.removeChild(div);
      return { top, left };
    } catch { return { top: 24, left: 0 }; }
  };
  const checkMention = async (text, caretPos, context, ta) => {
    const before = text.slice(0, caretPos);
    const m = before.match(/@([\w.\-ก-๛]*)$/);
    if (!m) { setMentionState(null); return; }
    const query = m[1].toLowerCase();
    const px = ta ? getCaretPx(ta) : { top: 24, left: 0 };
    // v0.7.14.7 — ถ้ามี cache แล้ว → ใช้ทันที (ไม่ขึ้น loading)
    let all = window._mentionUsersCache?.users;
    const cacheValid = all && Date.now() - (window._mentionUsersCache?.fetchedAt || 0) < 60000;
    if (cacheValid) {
      const filtered = query ? all.filter(u => (u.username||'').toLowerCase().startsWith(query) || (u.display_name||'').toLowerCase().includes(query)) : all;
      setMentionState({ context, query, users: filtered.slice(0, 8), idx: 0, caretPos, loading: false, top: px.top, left: px.left });
      return;
    }
    // ไม่มี cache → fetch + แสดง loading
    setMentionState({ context, query, users: [], idx: 0, caretPos, loading: true, top: px.top, left: px.left });
    try {
      const r = await fetch('/api/changelog/mentionable-users');
      const j = await r.json();
      if (r.ok) {
        all = j.users || [];
        window._mentionUsersCache = { users: all, fetchedAt: Date.now() };
        mentionCacheRef.current = window._mentionUsersCache;
      } else { all = []; }
    } catch { all = []; }
    const filtered = query ? all.filter(u => (u.username||'').toLowerCase().startsWith(query) || (u.display_name||'').toLowerCase().includes(query)) : all;
    setMentionState({ context, query, users: filtered.slice(0, 8), idx: 0, caretPos, loading: false, top: px.top, left: px.left });
  };
  const applyMention = (u, context) => {
    const ins = '@' + u.username + ' ';
    const apply = (text, caret) => {
      const before = text.slice(0, caret); const after = text.slice(caret);
      const replaced = before.replace(/@([\w.\-ก-๛]*)$/, ins);
      return replaced + after;
    };
    if (context === 'draft') setDraftText(apply(draftText, mentionState?.caretPos ?? draftText.length));
    else if (context === 'edit') setEditText(apply(editText, mentionState?.caretPos ?? editText.length));
    else if (context === 'reply') setReplyText(apply(replyText, mentionState?.caretPos ?? replyText.length));
    setMentionState(null);
  };
  // Keyboard handler สำหรับ textarea — รองรับ mention navigation + Enter ส่ง
  const handleTextareaKey = (e, context, submitFn) => {
    // ถ้า popup mention เปิดอยู่ → ใช้ลูกศร/Enter เลือกชื่อ
    if (mentionState && mentionState.context === context && mentionState.users.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionState(prev => prev ? { ...prev, idx: Math.min(prev.users.length - 1, prev.idx + 1) } : prev);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionState(prev => prev ? { ...prev, idx: Math.max(0, prev.idx - 1) } : prev);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const u = mentionState.users[mentionState.idx];
        if (u) applyMention(u, context);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setMentionState(null);
        return;
      }
    }
    // Enter (ไม่กด Shift) → submit · Shift+Enter → ขึ้นบรรทัดใหม่ (default)
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && submitFn) {
      e.preventDefault();
      submitFn();
    }
  };

  const renderCommentText = (text) => {
    if (!text) return null;
    const users = window._mentionUsersCache?.users || [];
    const userRoleMap = {};
    for (const u of users) {
      if (u.username) userRoleMap[u.username.toLowerCase()] = u.role;
    }
    // v0.7.16.7+ — split รวม URL (https?://) + mention เดียวกัน
    const splitRegex = /((?:https?:\/\/[^\s<>"'()]+)|(?:@[\w.\-ก-๛]+(?:@[\w.\-]+\.[A-Za-z]{2,})?))/g;
    return text.split(splitRegex).map((p, i) => {
      if (!p) return p;
      // URL → ลิงก์คลิกได้
      if (/^https?:\/\//.test(p)) {
        // ตัดเครื่องหมายวรรคตอนท้าย URL (. , ; ) เป็นต้น)
        const trailing = p.match(/[.,;!?]+$/);
        const url = trailing ? p.slice(0, -trailing[0].length) : p;
        const after = trailing ? trailing[0] : '';
        return (
          <React.Fragment key={i}>
            <a href={url} target="_blank" rel="noopener noreferrer"
              style={{color:'#1d4ed8',textDecoration:'underline',wordBreak:'break-all',fontWeight:500}}>
              {url}
            </a>{after}
          </React.Fragment>
        );
      }
      // Mention
      if (p.startsWith('@')) {
        const uname = p.slice(1).toLowerCase();
        const role = userRoleMap[uname];
        const isAdmin = role === 'admin';
        const style = isAdmin
          ? { background:'#fef3c7', color:'#92400e', fontWeight:700, padding:'1px 5px', borderRadius:'4px', boxShadow:'0 0 6px 1px rgba(217,119,6,0.45)' }
          : role === 'user'
          ? { background:'#ccfbf1', color:'#1f2937', fontWeight:700, padding:'1px 5px', borderRadius:'4px', boxShadow:'0 0 6px 1px rgba(13,148,136,0.45)' }
          : { background:'#f3f4f6', color:'#6b7280', fontWeight:600, padding:'1px 5px', borderRadius:'4px' };
        return <span key={i} style={style}>{p}</span>;
      }
      return p;
    });
  };

  const initials = (name) => {
    const parts = (name || '').split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    return parts.slice(0,2).map(p => p[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div style={{marginTop:'14px',background:T.bg,border:'1px solid '+T.border,borderRadius:'12px',padding:'14px 16px'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'10px',flexWrap:'wrap',gap:'8px'}}>
        <p style={{fontWeight:700,fontSize:'13px',color:T.accent,margin:0}}>
          💬 ความคิดเห็น <span style={{color:T.sub,fontWeight:600}}>({activeCount})</span>
          {isAdmin && deletedCount > 0 && (
            <span style={{marginLeft:'8px',fontSize:'11px',color:'#991b1b',fontWeight:600}}>
              · <i className="fa-solid fa-trash" style={{fontSize:'9px'}}></i> ลบไป {deletedCount}
            </span>
          )}
        </p>
        <button type="button" onClick={(e)=>{e.stopPropagation();load();}} tabIndex={-1} onMouseDown={e=>e.preventDefault()}
          style={{cursor:'pointer',border:'1px solid '+T.sub,background:'#fff',color:T.accent2,fontSize:'11px',padding:'4px 10px',borderRadius:'6px',fontWeight:600}}>
          <i className="fa-solid fa-rotate" style={{marginRight:'4px'}}></i>โหลดใหม่
        </button>
      </div>

      {!loading && comments.length > 0 && (
        <div style={{display:'flex',alignItems:'center',gap:'10px',flexWrap:'wrap',marginBottom:'10px',padding:'8px 10px',background:'#fff',border:'1px solid '+T.cardBorder,borderRadius:'8px'}}>
          <span style={{fontSize:'11px',color:'#6b7280',fontWeight:600}}>กรอง:</span>
          <select value={filterMode} onChange={e=>setFilterMode(e.target.value)} style={{fontSize:'11px',padding:'3px 8px',borderRadius:'5px',border:'1px solid #e5e7eb',color:'#1f2937',background:'#fff'}}>
            <option value="all">ทั้งหมด</option>
            <option value="unresolved_bug">บั๊กที่ยังไม่จัดการ</option>
            <option value="unresolved_request">คำขอที่ยังไม่จัดการ</option>
            <option value="feedback">💬 ความเห็น</option>
            <option value="bug">🐛 แจ้งบั๊ก</option>
            <option value="request">✨ ขอฟีเจอร์</option>
            <option value="note">📝 บันทึก</option>
          </select>
          <span style={{fontSize:'11px',color:'#6b7280',fontWeight:600,marginLeft:'4px'}}>เรียง:</span>
          <select value={sortMode} onChange={e=>setSortMode(e.target.value)} style={{fontSize:'11px',padding:'3px 8px',borderRadius:'5px',border:'1px solid #e5e7eb',color:'#1f2937',background:'#fff'}}>
            <option value="oldest">ใหม่สุดอยู่ล่าง</option>
            <option value="newest">ใหม่สุดอยู่บน</option>
            <option value="most_liked">ถูกใจมากสุด</option>
          </select>
          <label style={{display:'inline-flex',alignItems:'center',gap:'4px',fontSize:'11px',color:'#6b7280',fontWeight:600,cursor:'pointer',marginLeft:'auto'}}>
            <input type="checkbox" checked={hideResolved} onChange={e=>setHideResolved(e.target.checked)} style={{cursor:'pointer'}}/>
            ซ่อนที่จัดการแล้ว
          </label>
        </div>
      )}

      {loading && (
        <div style={{padding:'20px',textAlign:'center',color:'#9ca3af',fontSize:'12px'}}>
          <i className="fa-solid fa-spinner fa-spin"></i> กำลังโหลด...
        </div>
      )}

      {!loading && error && (
        <div style={{padding:'10px 12px',background:'#fee2e2',border:'1px solid #fca5a5',borderRadius:'8px',fontSize:'12px',color:'#991b1b',marginBottom:'10px'}}>
          ⚠️ {error}
        </div>
      )}

      {!loading && comments.length === 0 && (
        <div style={{padding:'24px',textAlign:'center',color:T.accent2,fontSize:'12px',background:'#fff',border:'1px dashed '+T.sub,borderRadius:'8px',marginBottom:'10px'}}>
          ยังไม่มีความคิดเห็น — เริ่มเขียนเป็นคนแรก!
        </div>
      )}

      {!loading && comments.length > 0 && visibleParents.length === 0 && (
        <div style={{padding:'14px',textAlign:'center',color:'#9ca3af',fontSize:'12px',background:'#fff',border:'1px dashed #e5e7eb',borderRadius:'8px',marginBottom:'10px'}}>ไม่มีความคิดเห็นตามตัวกรองนี้</div>
      )}

      {!loading && visibleParents.length > 0 && (
        <div style={{display:'flex',flexDirection:'column',gap:'8px',marginBottom:'12px'}}>
          {visibleCommentParents.map(c => {
            const meta = CHANGELOG_STATUS_META[c.status] || CHANGELOG_STATUS_META.feedback;
            const isOwner = c.user_id === currentUserId;
            const canDelete = isOwner || isAdmin;
            const editing = editingId === c.id;
            const canResolve = isAdmin && !c.parent_comment_id;  // เฉพาะ admin เท่านั้น (user ไม่ใช่คนแก้บั๊ก)
            const isResolved = !!c.resolved_at;
            const isDeleted = !!c.deleted_at;
            const resolvedLabel = c.status === 'bug_report' ? 'แก้ไขบั๊กแล้ว' : c.status === 'request' ? 'เพิ่มฟีเจอร์นี้แล้ว' : 'รับทราบ';
            const cta = c.status === 'bug_report' ? { icon: 'fa-wrench', text: 'แก้ไขบั๊กนี้แล้ว' }
                      : c.status === 'request'    ? { icon: 'fa-circle-plus', text: 'เพิ่มฟีเจอร์นี้แล้ว' }
                      : c.status === 'feedback'   ? { icon: 'fa-thumbs-up', text: 'รับทราบ' }
                                                  : { icon: 'fa-bookmark', text: 'รับทราบ' };
            return (
              <div key={c.id} id={'cmt-'+c.id} className="cm-card" style={{background:(pageFilter?.hasFilter && pageFilter.matches(c))?'#fef3c7':'#fff',border:'1.5px solid '+((pageFilter?.hasFilter && pageFilter.matches(c))?'#fbbf24':T.cardBorder),borderLeft:`3px solid ${meta.fg}`,opacity:isDeleted?0.85:(c._pending?0.7:1)}}>
                <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'6px',flexWrap:'wrap'}}>
                  <AvatarCircle urlKey={c.avatar_url} updatedAt={c.avatar_updated_at} fallback={nameInitials(c.display_name)} name={c.display_name} colorKey={c.user_id} size={28} fontSize={11} />
                  <span style={{fontWeight:700,fontSize:'12px',color:'#1f2937'}}>{c.display_name}</span>
                  {c.role === 'admin' && <span style={{fontSize:'9px',fontWeight:700,color:'#0f766e',background:'#ccfbf1',padding:'1px 6px',borderRadius:'999px'}}>ADMIN</span>}
                  <span style={{display:'inline-flex',alignItems:'center',gap:'3px',padding:'2px 8px',borderRadius:'999px',background:meta.bg,color:meta.fg,border:`1px solid ${meta.border}`,fontSize:'10px',fontWeight:700}}>{meta.emoji} {meta.label}</span>
                  {isResolved && <span style={{display:'inline-flex',alignItems:'center',gap:'3px',padding:'2px 8px',borderRadius:'999px',background:'#d1fae5',color:'#065f46',border:'1px solid #6ee7b7',fontSize:'10px',fontWeight:700}} title={c.resolved_at ? `จัดการเมื่อ ${new Date(c.resolved_at).toLocaleString('th-TH')}` : ''}>✓ {resolvedLabel}</span>}
                  {isDeleted && <span style={{display:'inline-flex',alignItems:'center',gap:'3px',padding:'2px 8px',borderRadius:'999px',background:'#fee2e2',color:'#991b1b',border:'1px solid #fca5a5',fontSize:'10px',fontWeight:700}}><i className="fa-solid fa-trash" style={{fontSize:'8px'}}></i> ลบแล้ว</span>}
                  <span style={{marginLeft:'auto',display:'inline-flex',alignItems:'center',gap:'8px',flexWrap:'wrap'}}>
                    {!isDeleted && (
                      <button type="button" onClick={()=>toggleLike(c)} tabIndex={-1} onMouseDown={e=>e.preventDefault()}
                        style={{cursor:'pointer',border:'1px solid '+(c.liked_by_me?'#d97706':'#e5e7eb'),background:c.liked_by_me?'#fef3c7':'#fff',color:c.liked_by_me?'#92400e':'#6b7280',fontSize:'11px',padding:'2px 8px',borderRadius:'6px',fontWeight:700}}>
                        👍 {c.likes_count || 0}
                      </button>
                    )}
                    {canResolve && !isResolved && !editing && !isDeleted && (
                      <button type="button" onClick={()=>toggleResolve(c)} tabIndex={-1} onMouseDown={e=>e.preventDefault()}
                        style={{cursor:'pointer',border:'1.5px dashed #0d9488',background:'#fff',color:'#0f766e',fontSize:'10px',padding:'3px 10px',borderRadius:'6px',fontWeight:700}}
                        title="กดเพื่อบอกว่าจัดการแล้ว">
                        <i className={`fa-solid ${cta.icon}`} style={{marginRight:'4px',fontSize:'9px'}}></i>{cta.text}
                      </button>
                    )}
                    {canResolve && isResolved && !editing && !isDeleted && (
                      <button type="button" onClick={()=>toggleResolve(c)} tabIndex={-1} onMouseDown={e=>e.preventDefault()}
                        style={{cursor:'pointer',border:'1px solid #e5e7eb',background:'#fff',color:'#6b7280',fontSize:'10px',padding:'3px 10px',borderRadius:'6px',fontWeight:700}}>
                        <i className="fa-solid fa-rotate-left" style={{marginRight:'4px',fontSize:'9px'}}></i>ยกเลิกสถานะ
                      </button>
                    )}
                    {!editing && isOwner && !isDeleted && (
                      <button type="button" onClick={()=>startEdit(c)} tabIndex={-1} onMouseDown={e=>e.preventDefault()} style={{cursor:'pointer',border:'none',background:'transparent',color:'#0d9488',fontSize:'11px',padding:'2px 4px',fontWeight:600}}>
                        <i className="fa-solid fa-pen" style={{marginRight:'3px',fontSize:'9px'}}></i>แก้ไข
                      </button>
                    )}
                    {!editing && canDelete && !isDeleted && (
                      <button type="button" onClick={()=>setConfirmDelId(c.id)} tabIndex={-1} onMouseDown={e=>e.preventDefault()} style={{cursor:'pointer',border:'none',background:'transparent',color:'#dc2626',fontSize:'11px',padding:'2px 4px',fontWeight:600}}>
                        <i className="fa-solid fa-trash" style={{marginRight:'3px',fontSize:'9px'}}></i>ลบ
                      </button>
                    )}
                    <span style={{fontSize:'11px',color:'#9ca3af',whiteSpace:'nowrap'}} title={new Date(c.created_at).toLocaleString('th-TH')}>
                      {(() => {
                        const d = new Date(c.created_at); if (isNaN(d.getTime())) return '';
                        const M = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
                        return `${d.getDate()} ${M[d.getMonth()]} ${d.getFullYear()+543} · ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
                      })()}
                      <span style={{marginLeft:'6px',opacity:0.75}}>({relTime(c.created_at)})</span>
                      {c.edited && (isOwner || isAdmin) ? (
                        <button type="button" onClick={()=>openHistory(c.id)} tabIndex={-1} onMouseDown={e=>e.preventDefault()} title="กดเพื่อดูข้อความก่อนแก้ไข (เฉพาะคุณ/admin)"
                          style={{marginLeft:'6px',cursor:'pointer',border:'none',background:'transparent',color:'#0d9488',fontSize:'11px',padding:'0',fontWeight:600,textDecoration:'underline',fontStyle:'italic'}}>
                          · แก้ไขแล้ว (ดูประวัติ)
                        </button>
                      ) : c.edited && (
                        <span style={{marginLeft:'6px',fontStyle:'italic'}}>· แก้ไขแล้ว</span>
                      )}
                    </span>
                  </span>
                </div>

                {!editing && isDeleted && !(isAdmin && revealDeletedIds.has(c.id)) && (
                  <p style={{fontSize:'13px',color:'#9ca3af',fontStyle:'italic',margin:'2px 0 0',lineHeight:1.6}}>
                    [ข้อความนี้ถูกลบ]
                    {isAdmin && (
                      <button type="button" onClick={()=>toggleRevealDeleted(c.id)}
                        style={{marginLeft:'8px',cursor:'pointer',border:'1px solid #e5e7eb',background:'#fff',color:'#6b7280',fontSize:'10px',padding:'1px 8px',borderRadius:'5px',fontWeight:600}}>
                        <i className="fa-regular fa-eye" style={{marginRight:'3px',fontSize:'8px'}}></i>ดูข้อความเดิม (admin)
                      </button>
                    )}
                  </p>
                )}
                {!editing && isDeleted && isAdmin && revealDeletedIds.has(c.id) && (
                  <div style={{margin:'2px 0 0'}}>
                    <p style={{fontSize:'17px',color:'#7c2d12',fontWeight:500,background:'#fef2f2',border:'1px dashed #fca5a5',borderRadius:'6px',padding:'10px 12px',margin:0,lineHeight:1.55,whiteSpace:'pre-wrap',wordBreak:'break-word',overflowWrap:'anywhere'}}>
                      {renderCommentText(c.comment_text)}
                    </p>
                    <button type="button" onClick={()=>toggleRevealDeleted(c.id)} style={{marginTop:'4px',cursor:'pointer',border:'none',background:'transparent',color:'#9ca3af',fontSize:'10px',padding:'1px 4px',fontWeight:600}}>
                      <i className="fa-regular fa-eye-slash" style={{marginRight:'3px'}}></i>ซ่อน
                    </button>
                  </div>
                )}
                {!editing && !isDeleted && (
                  <p className="cm-card-text">{renderCommentText(c.comment_text)}</p>
                )}

                {editing && (
                  <div style={{marginTop:'4px',position:'relative'}}>
                    <select value={editStatus} onChange={e=>setEditStatus(e.target.value)} style={{fontSize:'11px',padding:'3px 6px',borderRadius:'5px',border:'1px solid #e5e7eb',marginBottom:'6px'}}>
                      {Object.entries(CHANGELOG_STATUS_META).map(([k,m])=>(<option key={k} value={k}>{m.emoji} {m.label}</option>))}
                    </select>
                    <textarea value={editText}
                      onChange={e=>{ setEditText(e.target.value); checkMention(e.target.value, e.target.selectionStart, 'edit', e.target); }}
                      onKeyDown={e=>handleTextareaKey(e, 'edit', () => saveEdit(c.id))}
                      rows={3} maxLength={2000}
                      style={{width:'100%',padding:'8px 10px',borderRadius:'6px',border:'1px solid #d1d5db',fontSize:'13px',outline:'none',fontFamily:'inherit',resize:'vertical',color:'#1f2937',caretColor:'#0d9488',background:'#fff'}}/>
                    {mentionState && mentionState.context === 'edit' && (
                      <div style={{position:'absolute',top:(mentionState.top||24)+'px',left:(mentionState.left||0)+'px',zIndex:9999,background:'#fff',border:'2px solid #0d9488',borderRadius:'8px',padding:'4px',boxShadow:'0 8px 24px rgba(0,0,0,0.18)',minWidth:'260px',maxHeight:'220px',overflowY:'auto'}}>
                        {mentionState.loading && <div style={{padding:'8px 10px',fontSize:'12px',color:'#6b7280'}}><i className="fa-solid fa-spinner fa-spin" style={{marginRight:'5px'}}></i>กำลังโหลด...</div>}
                        {!mentionState.loading && mentionState.users.length === 0 && <div style={{padding:'8px 10px',fontSize:'12px',color:'#6b7280',fontStyle:'italic'}}>ไม่พบผู้ใช้</div>}
                        {!mentionState.loading && mentionState.users.map((u, i) => {
                          const isAdminUser = u.role === 'admin';
                          const isActive = i === mentionState.idx;
                          const rowBg = isActive
                            ? (isAdminUser ? '#fcd34d' : '#ccfbf1')
                            : (isAdminUser ? '#fef3c7' : 'transparent');
                          return (
                            <div key={u.id} onClick={()=>applyMention(u,'edit')} onMouseDown={e=>e.preventDefault()}
                              onMouseEnter={()=>setMentionState(prev => prev ? {...prev, idx: i} : prev)}
                              style={{display:'flex',alignItems:'center',gap:'7px',padding:'7px 10px',cursor:'pointer',borderRadius:'5px',fontSize:'13px',color:'#1f2937',background:rowBg,borderBottom:'1px solid #f1f5f9',borderLeft:isAdminUser?'3px solid #d97706':'3px solid transparent',transition:'background 0.12s ease'}}>
                              <AvatarCircle urlKey={u.avatar_url} updatedAt={u.avatar_updated_at} name={u.display_name} colorKey={u.id} fallback={nameInitials(u.display_name)} size={22} fontSize={9} />
                              <span style={{minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                                <b style={{color:isAdminUser?'#92400e':'#0f766e'}}>@{u.username}</b>
                                {isAdminUser && <span style={{marginLeft:'5px',fontSize:'9px',fontWeight:800,color:'#fff',background:'#d97706',padding:'1px 6px',borderRadius:'999px'}}>ADMIN</span>}
                                <span style={{color:'#374151',fontWeight:600,marginLeft:'4px'}}>· {u.display_name}</span>
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <div style={{display:'flex',gap:'6px',marginTop:'6px',justifyContent:'flex-end'}}>
                      <button type="button" onClick={showUploadToast} title="แนบรูป (กำลังพัฒนา)"
                        style={{cursor:'pointer',border:'1px dashed #9ca3af',background:'#f9fafb',color:'#6b7280',fontSize:'11px',padding:'5px 10px',borderRadius:'6px',fontWeight:600}}>
                        <i className="fa-solid fa-paperclip" style={{marginRight:'3px'}}></i>แนบรูป
                      </button>
                      <button type="button" onClick={cancelEdit} disabled={savingEdit} style={{cursor:'pointer',border:'1px solid #e5e7eb',background:'#fff',color:'#6b7280',fontSize:'11px',padding:'5px 12px',borderRadius:'6px',fontWeight:600}}>ยกเลิก</button>
                      <button type="button" onClick={()=>saveEdit(c.id)} disabled={savingEdit || !editText.trim()} style={{cursor:'pointer',border:'none',background:'#0f766e',color:'#fff',fontSize:'11px',padding:'5px 14px',borderRadius:'6px',fontWeight:700,opacity:savingEdit||!editText.trim()?0.5:1}}>{savingEdit ? 'กำลังบันทึก...' : 'บันทึก'}</button>
                    </div>
                  </div>
                )}

                {!editing && !c.parent_comment_id && replyingToId !== c.id && !isDeleted && (
                  <div style={{marginTop:'6px'}}>
                    <button type="button" onClick={()=>startReply(c.id, c.status)} tabIndex={-1} onMouseDown={e=>e.preventDefault()} style={{cursor:'pointer',border:'none',background:'transparent',color:T.accent2,fontSize:'11px',padding:'2px 6px',fontWeight:600}}>
                      <i className="fa-solid fa-reply" style={{marginRight:'4px'}}></i>ตอบกลับ
                    </button>
                  </div>
                )}

                {replyingToId === c.id && (
                  <div style={{marginTop:'8px',padding:'10px',background:'#f9fafb',borderRadius:'8px',border:'1px dashed '+T.cardBorder,position:'relative'}}>
                    <p style={{fontSize:'11px',color:'#6b7280',margin:'0 0 6px',fontWeight:600}}>↩ ตอบกลับ {c.display_name}</p>
                    <select value={replyStatus} onChange={e=>setReplyStatus(e.target.value)} style={{fontSize:'11px',padding:'3px 6px',borderRadius:'5px',border:'1px solid #e5e7eb',marginBottom:'6px'}}>
                      {Object.entries(CHANGELOG_STATUS_META).map(([k,m])=>(<option key={k} value={k}>{m.emoji} {m.label}</option>))}
                    </select>
                    <textarea value={replyText}
                      onChange={e=>{ setReplyText(e.target.value); checkMention(e.target.value, e.target.selectionStart, 'reply', e.target); }}
                      onKeyDown={e=>handleTextareaKey(e, 'reply', () => submitReply(c.id))}
                      rows={2} maxLength={2000} placeholder="พิมพ์ตอบกลับ... (Enter ส่ง · Shift+Enter ขึ้นบรรทัดใหม่)"
                      style={{width:'100%',padding:'8px 10px',borderRadius:'6px',border:'1px solid #d1d5db',fontSize:'13px',outline:'none',fontFamily:'inherit',resize:'vertical',color:'#1f2937',caretColor:'#0d9488',background:'#fff'}}/>
                    {mentionState && mentionState.context === 'reply' && (
                      <div style={{position:'absolute',top:(mentionState.top||24)+'px',left:(mentionState.left||10)+'px',zIndex:9999,background:'#fff',border:'2px solid #0d9488',borderRadius:'8px',padding:'4px',boxShadow:'0 8px 24px rgba(0,0,0,0.18)',minWidth:'260px',maxHeight:'220px',overflowY:'auto'}}>
                        {mentionState.loading && <div style={{padding:'8px 10px',fontSize:'12px',color:'#6b7280'}}><i className="fa-solid fa-spinner fa-spin" style={{marginRight:'5px'}}></i>กำลังโหลด...</div>}
                        {!mentionState.loading && mentionState.users.length === 0 && <div style={{padding:'8px 10px',fontSize:'12px',color:'#6b7280',fontStyle:'italic'}}>ไม่พบผู้ใช้</div>}
                        {!mentionState.loading && mentionState.users.map((u, i) => {
                          const isAdminUser = u.role === 'admin';
                          const isActive = i === mentionState.idx;
                          const rowBg = isActive
                            ? (isAdminUser ? '#fcd34d' : '#ccfbf1')
                            : (isAdminUser ? '#fef3c7' : 'transparent');
                          return (
                            <div key={u.id} onClick={()=>applyMention(u,'reply')} onMouseDown={e=>e.preventDefault()}
                              onMouseEnter={()=>setMentionState(prev => prev ? {...prev, idx: i} : prev)}
                              style={{display:'flex',alignItems:'center',gap:'7px',padding:'7px 10px',cursor:'pointer',borderRadius:'5px',fontSize:'13px',color:'#1f2937',background:rowBg,borderBottom:'1px solid #f1f5f9',borderLeft:isAdminUser?'3px solid #d97706':'3px solid transparent',transition:'background 0.12s ease'}}>
                              <AvatarCircle urlKey={u.avatar_url} updatedAt={u.avatar_updated_at} name={u.display_name} colorKey={u.id} fallback={nameInitials(u.display_name)} size={22} fontSize={9} />
                              <span style={{minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                                <b style={{color:isAdminUser?'#92400e':'#0f766e'}}>@{u.username}</b>
                                {isAdminUser && <span style={{marginLeft:'5px',fontSize:'9px',fontWeight:800,color:'#fff',background:'#d97706',padding:'1px 6px',borderRadius:'999px'}}>ADMIN</span>}
                                <span style={{color:'#374151',fontWeight:600,marginLeft:'4px'}}>· {u.display_name}</span>
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:'6px'}}>
                      <span style={{fontSize:'10px',color:replyText.length>1900?'#dc2626':'#9ca3af'}}>{replyText.length} / 2000</span>
                      <div style={{display:'flex',gap:'6px'}}>
                        <button type="button" onClick={showUploadToast} title="แนบรูป (กำลังพัฒนา)"
                          style={{cursor:'pointer',border:'1px dashed #9ca3af',background:'#f9fafb',color:'#6b7280',fontSize:'11px',padding:'5px 10px',borderRadius:'6px',fontWeight:600}}>
                          <i className="fa-solid fa-paperclip" style={{marginRight:'3px'}}></i>แนบรูป
                        </button>
                        <button type="button" onClick={cancelReply} disabled={savingReply} style={{cursor:'pointer',border:'1px solid #e5e7eb',background:'#fff',color:'#6b7280',fontSize:'11px',padding:'5px 12px',borderRadius:'6px',fontWeight:600}}>ยกเลิก</button>
                        <button type="button" onClick={()=>submitReply(c.id)} disabled={savingReply || !replyText.trim()} style={{cursor:'pointer',border:'none',background:'#0f766e',color:'#fff',fontSize:'11px',padding:'5px 14px',borderRadius:'6px',fontWeight:700,opacity:savingReply||!replyText.trim()?0.5:1}}>{savingReply ? 'กำลังส่ง...' : 'ส่ง'}</button>
                      </div>
                    </div>
                  </div>
                )}

                {Array.isArray(c.replies) && c.replies.length > 0 && (
                  <div style={{marginTop:'10px',paddingLeft:'18px',borderLeft:'2px dashed '+T.cardBorder,display:'flex',flexDirection:'column',gap:'6px'}}>
                    {c.replies.map(r => {
                      const rmeta = CHANGELOG_STATUS_META[r.status] || CHANGELOG_STATUS_META.feedback;
                      const rIsOwner = r.user_id === currentUserId;
                      const rIsDeleted = !!r.deleted_at;
                      const rRevealed = isAdmin && revealDeletedIds.has(r.id);
                      return (
                        <div key={r.id} id={'cmt-'+r.id} className="cm-card-reply" style={{background:(pageFilter?.hasFilter && pageFilter.matches(r))?'#fef3c7':'#fff',border:'1px solid '+((pageFilter?.hasFilter && pageFilter.matches(r))?'#fbbf24':T.cardBorder),borderLeft:`2px solid ${rmeta.fg}`,opacity:rIsDeleted?0.75:(r._pending?0.7:1)}}>
                          <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'4px',flexWrap:'wrap'}}>
                            <AvatarCircle urlKey={r.avatar_url} updatedAt={r.avatar_updated_at} fallback={nameInitials(r.display_name)} name={r.display_name} colorKey={r.user_id} size={22} fontSize={10} />
                            <span style={{fontWeight:700,fontSize:'11.5px',color:'#1f2937'}}>{r.display_name}</span>
                            {r.role === 'admin' && <span style={{fontSize:'9px',fontWeight:700,color:'#0f766e',background:'#ccfbf1',padding:'1px 5px',borderRadius:'999px'}}>ADMIN</span>}
                            {rIsDeleted && <span style={{fontSize:'9px',fontWeight:700,color:'#991b1b',background:'#fee2e2',border:'1px solid #fca5a5',padding:'1px 5px',borderRadius:'999px'}}><i className="fa-solid fa-trash" style={{fontSize:'7px'}}></i> ลบแล้ว</span>}
                            <span style={{marginLeft:'auto',display:'inline-flex',alignItems:'center',gap:'6px'}}>
                              {!rIsDeleted && (
                                <button type="button" onClick={()=>toggleLike(r)} tabIndex={-1} onMouseDown={e=>e.preventDefault()}
                                  style={{cursor:'pointer',border:'1px solid '+(r.liked_by_me?'#d97706':'#e5e7eb'),background:r.liked_by_me?'#fef3c7':'#fff',color:r.liked_by_me?'#92400e':'#6b7280',fontSize:'10px',padding:'1px 6px',borderRadius:'5px',fontWeight:700}}>
                                  👍 {r.likes_count || 0}
                                </button>
                              )}
                              {rIsOwner && !rIsDeleted && editingId !== r.id && <button type="button" onClick={()=>startEdit(r)} tabIndex={-1} onMouseDown={e=>e.preventDefault()} style={{cursor:'pointer',border:'none',background:'transparent',color:'#0d9488',fontSize:'10px',padding:'1px 3px',fontWeight:600}}><i className="fa-solid fa-pen" style={{fontSize:'8px',marginRight:'2px'}}></i>แก้</button>}
                              {(rIsOwner || isAdmin) && !rIsDeleted && editingId !== r.id && <button type="button" onClick={()=>setConfirmDelId(r.id)} tabIndex={-1} onMouseDown={e=>e.preventDefault()} style={{cursor:'pointer',border:'none',background:'transparent',color:'#dc2626',fontSize:'10px',padding:'1px 3px',fontWeight:600}}><i className="fa-solid fa-trash" style={{fontSize:'8px',marginRight:'2px'}}></i>ลบ</button>}
                              <span style={{fontSize:'10px',color:'#9ca3af',whiteSpace:'nowrap'}} title={new Date(r.created_at).toLocaleString('th-TH')}>
                                {relTime(r.created_at)}
                                {r.edited && !rIsDeleted && (rIsOwner || isAdmin) ? (
                                  <button type="button" onClick={()=>openHistory(r.id)} tabIndex={-1} onMouseDown={e=>e.preventDefault()} title="ดูข้อความก่อนแก้ไข" style={{marginLeft:'4px',cursor:'pointer',border:'none',background:'transparent',color:'#0d9488',fontSize:'10px',padding:'0',fontWeight:600,textDecoration:'underline'}}>· แก้แล้ว (ดู)</button>
                                ) : r.edited && !rIsDeleted && <span> · แก้แล้ว</span>}
                              </span>
                            </span>
                          </div>
                          {editingId === r.id ? (
                            <div style={{marginTop:'4px'}}>
                              <textarea value={editText} onChange={e=>setEditText(e.target.value)} rows={2} maxLength={2000} style={{width:'100%',padding:'6px 8px',borderRadius:'5px',border:'1px solid #d1d5db',fontSize:'12px',outline:'none',fontFamily:'inherit',resize:'vertical',color:'#1f2937',caretColor:'#0d9488',background:'#fff'}}/>
                              <div style={{display:'flex',gap:'6px',marginTop:'4px',justifyContent:'flex-end'}}>
                                <button type="button" onClick={cancelEdit} style={{cursor:'pointer',border:'1px solid #e5e7eb',background:'#fff',color:'#6b7280',fontSize:'10px',padding:'3px 10px',borderRadius:'5px',fontWeight:600}}>ยกเลิก</button>
                                <button type="button" onClick={()=>saveEdit(r.id)} disabled={savingEdit || !editText.trim()} style={{cursor:'pointer',border:'none',background:'#0f766e',color:'#fff',fontSize:'10px',padding:'3px 12px',borderRadius:'5px',fontWeight:700,opacity:savingEdit||!editText.trim()?0.5:1}}>{savingEdit?'กำลังบันทึก...':'บันทึก'}</button>
                              </div>
                            </div>
                          ) : rIsDeleted && !rRevealed ? (
                            <p style={{fontSize:'12.5px',color:'#9ca3af',fontStyle:'italic',margin:'2px 0 0',lineHeight:1.55}}>
                              [ข้อความนี้ถูกลบ]
                              {isAdmin && <button type="button" onClick={()=>toggleRevealDeleted(r.id)} style={{marginLeft:'6px',cursor:'pointer',border:'1px solid #e5e7eb',background:'#fff',color:'#6b7280',fontSize:'9px',padding:'1px 6px',borderRadius:'4px',fontWeight:600}}><i className="fa-regular fa-eye" style={{marginRight:'2px',fontSize:'7px'}}></i>ดูเดิม</button>}
                            </p>
                          ) : rIsDeleted && rRevealed ? (
                            <div style={{margin:'2px 0 0'}}>
                              <p style={{fontSize:'15px',color:'#7c2d12',fontWeight:500,background:'#fef2f2',border:'1px dashed #fca5a5',borderRadius:'5px',padding:'8px 10px',margin:0,lineHeight:1.5,whiteSpace:'pre-wrap',wordBreak:'break-word',overflowWrap:'anywhere'}}>{renderCommentText(r.comment_text)}</p>
                              <button type="button" onClick={()=>toggleRevealDeleted(r.id)} style={{marginTop:'3px',cursor:'pointer',border:'none',background:'transparent',color:'#9ca3af',fontSize:'9px',padding:'1px 3px',fontWeight:600}}><i className="fa-regular fa-eye-slash" style={{marginRight:'2px'}}></i>ซ่อน</button>
                            </div>
                          ) : (
                            <p className="cm-card-text-reply">{renderCommentText(r.comment_text)}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          {!hasHighlightInList && visibleParents.length > visibleCmtCount && (
            <div style={{textAlign:'center',padding:'6px 0'}}>
              <button type="button" onClick={()=>setVisibleCmtCount(c=>c+15)}
                style={{cursor:'pointer',padding:'6px 18px',border:'1px solid '+T.border,background:'#fff',color:T.accent,fontSize:'12px',fontWeight:700,borderRadius:'999px',transition:'all 0.15s'}}
                onMouseEnter={e=>{e.currentTarget.style.background=T.bg;}}
                onMouseLeave={e=>{e.currentTarget.style.background='#fff';}}>
                <i className="fa-solid fa-chevron-down" style={{marginRight:'6px',fontSize:'10px'}}></i>
                ดูความคิดเห็นเพิ่มอีก {Math.min(15, visibleParents.length - visibleCmtCount)} อัน
                <span style={{marginLeft:'8px',fontSize:'10px',color:'#9ca3af',fontWeight:500}}>
                  ({visibleCmtCount} / {visibleParents.length})
                </span>
              </button>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{background:'#fff',border:'1.5px solid '+T.formBorder,borderRadius:'8px',padding:'10px 12px'}}>
        <div style={{display:'flex',gap:'6px',alignItems:'center',marginBottom:'6px',flexWrap:'wrap'}}>
          <label style={{fontSize:'11px',color:'#6b7280',fontWeight:600}}>ประเภท:</label>
          <select value={draftStatus} onChange={e=>setDraftStatus(e.target.value)} style={{fontSize:'11px',padding:'3px 6px',borderRadius:'5px',border:'1px solid #e5e7eb'}}>
            {Object.entries(CHANGELOG_STATUS_META).map(([k,m])=>(<option key={k} value={k}>{m.emoji} {m.label}</option>))}
          </select>
          <span style={{marginLeft:'auto',fontSize:'10px',color:'#9ca3af',fontStyle:'italic'}} title="พิมพ์ @ แล้วเลือกชื่อจากรายการ เพื่อเรียกผู้ใช้คนนั้นในระบบ">
            <i className="fa-regular fa-circle-question" style={{marginRight:'3px',color:'#0d9488'}}></i>
            พิมพ์ <b>@</b> เพื่อเรียกผู้ใช้
          </span>
        </div>
        <div style={{position:'relative'}}>
          <textarea value={draftText}
            onChange={e=>{ setDraftText(e.target.value); checkMention(e.target.value, e.target.selectionStart, 'draft', e.target); }}
            onKeyDown={e=>handleTextareaKey(e, 'draft', () => handleSubmit())}
            rows={3} maxLength={2000}
            placeholder="เขียนความคิดเห็น ข้อเสนอแนะ หรือแจ้งบั๊กที่นี่... (พิมพ์ @ เพื่อเรียกผู้ใช้ · Enter ส่ง · Shift+Enter ขึ้นบรรทัดใหม่)"
            style={{width:'100%',padding:'8px 10px',borderRadius:'6px',border:'1px solid #d1d5db',fontSize:'13px',outline:'none',fontFamily:'inherit',resize:'vertical',color:'#1f2937',caretColor:'#0d9488',background:'#fff'}}/>
          {mentionState && mentionState.context === 'draft' && (
            <div style={{position:'absolute',top:(mentionState.top||24)+'px',left:(mentionState.left||0)+'px',zIndex:9999,background:'#fff',border:'2px solid #0d9488',borderRadius:'8px',padding:'4px',boxShadow:'0 8px 24px rgba(0,0,0,0.18)',minWidth:'260px',maxHeight:'260px',overflowY:'auto'}}>
              {mentionState.loading && <div style={{padding:'8px 10px',fontSize:'12px',color:'#6b7280'}}><i className="fa-solid fa-spinner fa-spin" style={{marginRight:'5px'}}></i>กำลังโหลด...</div>}
              {!mentionState.loading && mentionState.users.length === 0 && <div style={{padding:'8px 10px',fontSize:'12px',color:'#6b7280',fontStyle:'italic'}}>ไม่พบผู้ใช้</div>}
              {!mentionState.loading && mentionState.users.map((u, i) => {
                const isAdminUser = u.role === 'admin';
                const isActive = i === mentionState.idx;
                // v0.7.14.7 — admin active = อำพันเข้ม, user active = เทลจาง, idle: admin=อำพันอ่อน, user=ใส
                const rowBg = isActive
                  ? (isAdminUser ? '#fcd34d' : '#ccfbf1')
                  : (isAdminUser ? '#fef3c7' : 'transparent');
                return (
                  <div key={u.id} onClick={()=>applyMention(u,'draft')} onMouseDown={e=>e.preventDefault()}
                    onMouseEnter={()=>setMentionState(prev => prev ? {...prev, idx: i} : prev)}
                    style={{display:'flex',alignItems:'center',gap:'7px',padding:'7px 10px',cursor:'pointer',borderRadius:'5px',fontSize:'13px',color:'#1f2937',background:rowBg,borderBottom:'1px solid #f1f5f9',borderLeft:isAdminUser?'3px solid #d97706':'3px solid transparent',transition:'background 0.12s ease'}}>
                    <AvatarCircle urlKey={u.avatar_url} updatedAt={u.avatar_updated_at} name={u.display_name} colorKey={u.id} fallback={nameInitials(u.display_name)} size={22} fontSize={9} />
                    <span style={{minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                      <b style={{color:isAdminUser?'#92400e':'#0f766e'}}>@{u.username}</b>
                      {isAdminUser && <span style={{marginLeft:'5px',fontSize:'9px',fontWeight:800,color:'#fff',background:'#d97706',padding:'1px 6px',borderRadius:'999px'}}>ADMIN</span>}
                      <span style={{color:'#374151',fontWeight:600,marginLeft:'4px'}}>· {u.display_name}</span>
                      {u.profession_label && <span style={{color:'#6b7280',fontSize:'11px'}}> · {u.profession_label}</span>}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:'6px',gap:'8px',flexWrap:'wrap'}}>
          <div style={{display:'flex',alignItems:'center',gap:'10px',fontSize:'10px',color:'#9ca3af'}}>
            <span style={{color:draftText.length>1900?'#dc2626':'#9ca3af'}}>{draftText.length} / 2000</span>
            {draftSavedAt && draftText && (
              <span style={{color:'#0d9488',fontWeight:600}}><i className="fa-solid fa-cloud-arrow-up" style={{marginRight:'3px'}}></i>บันทึกอัตโนมัติแล้ว</span>
            )}
          </div>
          <div style={{display:'flex',gap:'6px'}}>
            <button type="button" onClick={showUploadToast}
              title="แนบรูป (กำลังพัฒนา)"
              style={{cursor:'pointer',border:'1px dashed #9ca3af',background:'#f9fafb',color:'#6b7280',fontSize:'12px',padding:'7px 12px',borderRadius:'6px',fontWeight:600}}>
              <i className="fa-solid fa-paperclip" style={{marginRight:'4px'}}></i>แนบรูป
            </button>
            <button type="button" onClick={()=>{ setDraftText(''); setDraftStatus('feedback'); try { localStorage.removeItem(draftKey); localStorage.removeItem(draftStatusKey); } catch {} }}
              disabled={submitting || !draftText.trim()}
              style={{cursor:(submitting||!draftText.trim())?'not-allowed':'pointer',border:'1.5px solid #ef4444',background:'#fef2f2',color:'#b91c1c',fontSize:'12px',padding:'7px 14px',borderRadius:'6px',fontWeight:700,opacity:(submitting||!draftText.trim())?0.5:1}}>
              <i className="fa-solid fa-xmark" style={{marginRight:'4px'}}></i>ยกเลิก
            </button>
            <button type="submit" disabled={submitting || !draftText.trim()} style={{cursor:'pointer',border:'none',background:'#0f766e',color:'#fff',fontSize:'12px',padding:'7px 18px',borderRadius:'6px',fontWeight:700,opacity:(submitting||!draftText.trim())?0.5:1}}>
              <i className="fa-solid fa-paper-plane" style={{marginRight:'5px'}}></i>{submitting ? 'กำลังส่ง...' : 'ส่ง'}
            </button>
          </div>
        </div>
      </form>

      {/* v0.7.16.7+ — toast แนบรูป (coming soon) */}
      {uploadToast && (
        <div style={{position:'fixed',bottom:'24px',left:'50%',transform:'translateX(-50%)',zIndex:9999,background:'#1f2937',color:'#fff',padding:'10px 18px',borderRadius:'10px',fontSize:'13px',fontWeight:600,boxShadow:'0 8px 20px rgba(0,0,0,0.3)',display:'flex',alignItems:'center',gap:'8px'}} className="modal-toast">
          <i className="fa-solid fa-paperclip" style={{color:'#fbbf24'}}></i>
          <span>ฟีเจอร์แนบรูปกำลังพัฒนา จะเปิดในเวอร์ชั่นถัดไป</span>
        </div>
      )}

      {historyOpenId && (
        <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.5)',backdropFilter:'blur(2px)',zIndex:80,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}} onClick={closeHistory}>
          <div onClick={e=>e.stopPropagation()} className="modal-A" style={{background:'#fff',borderRadius:'14px',padding:'18px 22px',maxWidth:'520px',width:'100%',maxHeight:'80vh',overflowY:'auto',boxShadow:'0 20px 50px rgba(0,0,0,0.25)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
              <p style={{fontSize:'14px',fontWeight:700,color:'#1f2937',margin:0}}><i className="fa-regular fa-clock" style={{marginRight:'6px',color:'#0d9488'}}></i>ประวัติการแก้ไข</p>
              <button type="button" onClick={closeHistory} style={{cursor:'pointer',border:'none',background:'transparent',color:'#9ca3af',fontSize:'18px'}}>×</button>
            </div>
            {historyLoading && <div style={{padding:'20px',textAlign:'center',color:'#9ca3af',fontSize:'12px'}}><i className="fa-solid fa-spinner fa-spin"></i> กำลังโหลด...</div>}
            {!historyLoading && historyData && (
              <div>
                <p style={{fontSize:'11px',color:'#0d9488',fontWeight:700,margin:'10px 0 6px'}}>เวอร์ชันปัจจุบัน</p>
                <div style={{background:'#f0fdfa',border:'1px solid #5eead4',borderRadius:'8px',padding:'10px 12px',marginBottom:'14px'}}>
                  <p style={{fontSize:'12.5px',color:'#374151',margin:0,whiteSpace:'pre-wrap',wordBreak:'break-word',lineHeight:1.5}}>{historyData.current.comment_text}</p>
                  <p style={{fontSize:'10px',color:'#9ca3af',margin:'4px 0 0'}}>ประเภท: {CHANGELOG_STATUS_META[historyData.current.status]?.label}</p>
                </div>
                {historyData.edits && historyData.edits.length > 0 ? (
                  <>
                    <p style={{fontSize:'11px',color:'#6b7280',fontWeight:700,margin:'14px 0 6px'}}>เวอร์ชันก่อนหน้า ({historyData.edits.length})</p>
                    {historyData.edits.map(ed => (
                      <div key={ed.id} style={{background:'#f9fafb',border:'1px solid #e5e7eb',borderRadius:'8px',padding:'10px 12px',marginBottom:'8px'}}>
                        <p style={{fontSize:'10px',color:'#6b7280',margin:'0 0 4px'}}>{new Date(ed.edited_at).toLocaleString('th-TH')} · ประเภท: {CHANGELOG_STATUS_META[ed.old_status]?.label}</p>
                        <p style={{fontSize:'12.5px',color:'#374151',margin:0,whiteSpace:'pre-wrap',wordBreak:'break-word',lineHeight:1.5}}>{ed.old_text}</p>
                      </div>
                    ))}
                  </>
                ) : <p style={{fontSize:'11px',color:'#9ca3af',textAlign:'center',padding:'14px',fontStyle:'italic'}}>ไม่มีประวัติเก่า (อาจถูกแก้ก่อนระบบบันทึก)</p>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── popup ยืนยันลบ ────────────────────────────────── */}
      {confirmDelId && (
        <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.5)',backdropFilter:'blur(2px)',zIndex:80,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}
          onClick={()=>setConfirmDelId(null)}>
          <div onClick={e=>e.stopPropagation()} className="modal-A"
            style={{background:'#fff',borderRadius:'14px',padding:'20px 22px',maxWidth:'360px',width:'100%',textAlign:'center',boxShadow:'0 20px 50px rgba(0,0,0,0.25)'}}>
            <i className="fa-solid fa-triangle-exclamation" style={{fontSize:'24px',color:'#ef4444',marginBottom:'10px',display:'block'}}></i>
            <p style={{fontSize:'14px',fontWeight:700,color:'#1f2937',margin:'0 0 6px'}}>ยืนยันลบ comment</p>
            <p style={{fontSize:'12px',color:'#6b7280',margin:'0 0 14px'}}>ลบแล้วจะไม่สามารถกู้คืนได้</p>
            <div style={{display:'flex',gap:'8px'}}>
              <button type="button" onClick={()=>setConfirmDelId(null)}
                style={{flex:1,padding:'8px',borderRadius:'8px',border:'1px solid #e5e7eb',background:'#fff',color:'#6b7280',fontSize:'12px',fontWeight:700,cursor:'pointer'}}>
                ยกเลิก
              </button>
              <button type="button" onClick={()=>doDelete(confirmDelId)}
                style={{flex:1,padding:'8px',borderRadius:'8px',border:'none',background:'#ef4444',color:'#fff',fontSize:'12px',fontWeight:700,cursor:'pointer'}}>
                ลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}, (prev, next) =>
  prev.version === next.version &&
  prev.theme === next.theme &&
  prev.initialComments === next.initialComments &&
  prev.currentUserId === next.currentUserId &&
  prev.isAdmin === next.isAdmin &&
  prev.pageFilter?.hasFilter === next.pageFilter?.hasFilter &&
  prev.pageFilter?.matches === next.pageFilter?.matches
);

// ───── Main Profile Modal ─────
// ── Password Eye icon (รูปแบบเดียวกับหน้า login) ─────────────────────────────

export { ChangelogPage, CommitDetailModal, CHANGELOG_STATUS_META, ChangelogCommentSection }
