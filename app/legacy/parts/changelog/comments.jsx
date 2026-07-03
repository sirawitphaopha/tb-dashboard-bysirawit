'use client'
/** changelog/comments.jsx — ระบบคอมเมนต์ changelog (แยกรอบ 3) · CHANGELOG_STATUS_META + ChangelogCommentSection */
import * as React from 'react'
const { useState, useEffect, useRef, useCallback, useMemo } = React
import { AvatarCircle, nameInitials, relTime } from '../shared'

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


export { CHANGELOG_STATUS_META, ChangelogCommentSection }
