'use client'
/**
 * parts/about.jsx — domain: โมดัล "เกี่ยวกับระบบ"
 * ย้ายจาก tb-monolith.jsx (แยกรอบ 2) — โค้ดเดิม ไม่แก้ logic
 * อ่านเวอร์ชันผ่าน window.APP_VERSION / window.BUILD_DATE (shell ตั้ง bridge — เหมือน changelog.jsx)
 */
import * as React from 'react'
const { useState } = React

function AboutModal({ onClose, onShowChangelog }) {
  const [closing, setClosing] = React.useState(false);
  const handleClose = () => { if (closing) return; setClosing(true); setTimeout(onClose, 580); };
  const openChangelog = () => {
    if (closing) return;
    if (onShowChangelog) onShowChangelog();
  };
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.45)',backdropFilter:'blur(2px)',zIndex:60,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}} className={closing?'modal-overlay-out':''} onClick={handleClose}>
      <div onClick={e=>e.stopPropagation()} className={closing?'modal-A-out':'modal-A'} style={{background:'#fff',borderRadius:'20px',width:'100%',maxWidth:'380px',boxShadow:'0 20px 60px rgba(0,0,0,0.25)',overflow:'hidden'}}>
        {/* Header */}
        <div style={{background:'linear-gradient(160deg,#0f766e,#14b8a6)',padding:'28px 24px',textAlign:'center'}}>
          <div style={{width:'64px',height:'64px',borderRadius:'16px',background:'#ffffff',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 12px'}}>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" width="48" height="40"><path fill="#0d9488" d="M320 0c17.7 0 32 14.3 32 32l0 124.2c-8.5-7.6-19.7-12.2-32-12.2s-23.5 4.6-32 12.2L288 32c0-17.7 14.3-32 32-32zM444.5 195.5c-16.4-16.4-41.8-18.5-60.5-6.1l0-24.1C384 127 415 96 453.3 96c21.7 0 42.8 10.2 55.8 28.8c15.4 22.1 44.3 65.4 71 116.9c26.5 50.9 52.4 112.5 59.6 170.3c.2 1.3 .2 2.6 .2 4l0 7c0 49.1-39.8 89-89 89c-7.3 0-14.5-.9-21.6-2.7l-72.7-18.2c-20.9-5.2-38.7-17.1-51.5-32.9c14 1.5 28.5-3 39.2-13.8l-22.6-22.6 22.6 22.6c18.7-18.7 18.7-49.1 0-67.9c-1.1-1.1-1.4-2-1.5-2.5c-.1-.8-.1-1.8 .4-2.9s1.2-1.9 1.8-2.3c.5-.3 1.3-.8 2.9-.8c26.5 0 48-21.5 48-48s-21.5-48-48-48c-1.6 0-2.4-.4-2.9-.8c-.6-.4-1.3-1.2-1.8-2.3s-.5-2.2-.4-2.9c.1-.6 .4-1.4 1.5-2.5c18.7-18.7 18.7-49.1 0-67.9zM183.3 491.2l-72.7 18.2c-7.1 1.8-14.3 2.7-21.6 2.7c-49.1 0-89-39.8-89-89l0-7c0-1.3 .1-2.7 .2-4c7.2-57.9 33.1-119.4 59.6-170.3c26.8-51.5 55.6-94.8 71-116.9c13-18.6 34-28.8 55.8-28.8C225 96 256 127 256 165.3l0 24.1c-18.6-12.4-44-10.3-60.5 6.1c-18.7 18.7-18.7 49.1 0 67.9c1.1 1.1 1.4 2 1.5 2.5c.1 .8 .1 1.8-.4 2.9s-1.2 1.9-1.8 2.3c-.5 .3-1.3 .8-2.9 .8c-26.5 0-48 21.5-48 48s21.5 48 48 48c1.6 0 2.4 .4 2.9 .8c.6 .4 1.3 1.2 1.8 2.3s.5 2.2 .4 2.9c-.1 .6-.4 1.4-1.5 2.5c-18.7 18.7-18.7 49.1 0 67.9c10.7 10.7 25.3 15.3 39.2 13.8c-12.8 15.9-30.6 27.7-51.5 32.9z"/><path fill="#fbbf24" d="M421.8 421.8c-6.2 6.2-16.4 6.2-22.6 0C375.9 398.5 336 415 336 448c0 8.8-7.2 16-16 16s-16-7.2-16-16c0-33-39.9-49.5-63.2-26.2c-6.2 6.2-16.4 6.2-22.6 0s-6.2-16.4 0-22.6C241.5 375.9 225 336 192 336c-8.8 0-16-7.2-16-16s7.2-16 16-16c33 0 49.5-39.9 26.2-63.2c-6.2-6.2-6.2-16.4 0-22.6s16.4-6.2 22.6 0C264.1 241.5 304 225 304 192c0-8.8 7.2-16 16-16s16 7.2 16 16c0 33 39.9 49.5 63.2 26.2c6.2-6.2 16.4-6.2 22.6 0s6.2 16.4 0 22.6C398.5 264.1 415 304 448 304c8.8 0 16 7.2 16 16s-7.2 16-16 16c-33 0-49.5 39.9-26.2 63.2c6.2 6.2 6.2 16.4 0 22.6z"/><path fill="#e11d48" d="M296 320a24 24 0 1 0 0-48 24 24 0 1 0 0 48zm72 32a16 16 0 1 0 -32 0 16 16 0 1 0 32 0z"/></svg>
          </div>
          <p style={{fontFamily:"'Manrope', sans-serif",fontWeight:800,fontSize:'18px',color:'#fff',margin:0,letterSpacing:'-0.3px'}}>TB JOURNEY <span style={{fontFamily:"'Plus Jakarta Sans', sans-serif"}}>&amp;</span> CARE</p>
          <p style={{fontSize:'12px',color:'rgba(255,255,255,0.85)',margin:'5px 0 0',lineHeight:1.4}}>ระบบเก็บข้อมูลผู้ป่วยวัณโรคและติดตามการรักษา</p>
        </div>
        {/* Body */}
        <div style={{padding:'20px 24px'}}>
          <div style={{textAlign:'center',marginBottom:'16px'}}>
            <p style={{fontSize:'14px',fontWeight:700,color:'#0f766e',margin:0}}>เวอร์ชัน {window.APP_VERSION}</p>
            <p style={{fontSize:'12px',color:'#f59e0b',fontWeight:600,margin:'3px 0 0'}}>ยังไม่เผยแพร่ (อยู่ระหว่างพัฒนา)</p>
            <p onClick={openChangelog} style={{fontSize:'11px',color:'#9ca3af',margin:'3px 0 0',cursor:'pointer',display:'inline-block',padding:'2px 8px',borderRadius:'6px',transition:'background 0.15s'}} onMouseEnter={e=>{e.currentTarget.style.background='#f0fdfa';e.currentTarget.style.color='#0d9488';}} onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color='#9ca3af';}} title="ดูประวัติเวอร์ชัน"><i className="fa-solid fa-screwdriver-wrench" style={{marginRight:'5px'}}></i>Build {window.BUILD_DATE}</p>
            <p onClick={openChangelog} style={{fontSize:'11px',color:'#0d9488',margin:'6px 0 0',cursor:'pointer',fontWeight:600}} title="ดูประวัติเวอร์ชัน"><i className="fa-solid fa-clock-rotate-left" style={{marginRight:'5px'}}></i>ดูประวัติเวอร์ชัน</p>
          </div>
          <div style={{borderTop:'1px solid #f1f5f9',paddingTop:'14px',textAlign:'center'}}>
            <p style={{fontSize:'11px',color:'#9ca3af',margin:'0 0 4px'}}>พัฒนาโดย</p>
            <p style={{fontSize:'14px',fontWeight:700,color:'#1f2937',margin:0}}>เภสัชกร สิรวิชญ์ เผ่าผา (ภ.47186)</p>
            <p style={{fontSize:'12px',color:'#6b7280',margin:'3px 0 0'}}>กลุ่มงานเภสัชกรรม โรงพยาบาลปรางค์กู่</p>
            <p style={{fontSize:'12px',fontWeight:600,color:'#6b7280',margin:'10px 0 3px'}}>
              <i className="fa-solid fa-envelope" style={{marginRight:'5px',color:'#0d9488'}}></i>ติดต่อ
            </p>
            <a href="mailto:siravitphoapha9928@gmail.com" style={{display:'block',fontSize:'12px',color:'#0d9488',fontWeight:600,margin:0,textDecoration:'none',wordBreak:'break-all'}}>
              siravitphoapha9928@gmail.com
            </a>
            <a href="mailto:siravitphoapha9928@hotmail.com" style={{display:'block',fontSize:'12px',color:'#0d9488',fontWeight:600,margin:'2px 0 0',textDecoration:'none',wordBreak:'break-all'}}>
              siravitphoapha9928@hotmail.com
            </a>
          </div>
          <div style={{borderTop:'1px solid #f1f5f9',marginTop:'14px',paddingTop:'14px',textAlign:'center'}}>
            <p style={{fontSize:'12px',color:'#6b7280',margin:0}}><i className="fa-solid fa-robot" style={{marginRight:'5px',color:'#8b5cf6'}}></i>ช่วยพัฒนาโดย Claude Code + Gemini</p>
          </div>
          <div style={{background:'#fffbeb',border:'1px solid #fde68a',borderRadius:'12px',padding:'12px 14px',marginTop:'14px',textAlign:'center'}}>
            <p style={{fontSize:'13px',color:'#b45309',fontWeight:600,margin:0,fontStyle:'italic',lineHeight:1.5}}>“ เภสัชควรใช้ Claude เขียนโค้ดให้เป็นนะจ๊ะ ”</p>
          </div>
          <button onClick={handleClose} style={{width:'100%',marginTop:'16px',padding:'11px',borderRadius:'12px',border:'none',background:'#0f766e',color:'#fff',fontWeight:700,fontSize:'14px',cursor:'pointer'}}>ปิด</button>
          <p style={{fontSize:'10px',color:'#cbd5e1',textAlign:'center',margin:'10px 0 0'}}>© 2026 TB JOURNEY &amp; CARE</p>
        </div>
      </div>
    </div>
  );
}

// ChangelogPage, CommitDetailModal, CHANGELOG_STATUS_META, ChangelogCommentSection ย้ายไป parts/changelog.jsx (เฟส 2)
// PwEye, password/session helpers, cropToWebp/resizeToWebp, AvatarCropModal, AvatarDeleteConfirm, ChangePasswordPanel, SessionsPanel, UserProfileModal ย้ายไป parts/account.jsx (เฟส 6)


export { AboutModal }
