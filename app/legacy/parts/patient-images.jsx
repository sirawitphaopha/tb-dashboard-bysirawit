'use client'
/**
 * parts/patient-images.jsx — barrel: รวม re-export โดเมนรูปภาพผู้ป่วย (แยกรอบ 3)
 * แตกเป็นโฟลเดอร์ patient-images/ (โค้ดเดิม ไม่แก้ logic):
 *   patient-images/helpers.jsx     → foundation (codecs, JustifiedGallery, ImgViewToolbar, cache, CXR viewers)
 *   patient-images/trash.jsx       → TrashHub, ImageTrashPage · import TrashList จาก ../misc
 *   patient-images/patient-tab.jsx → PatientImagesTab
 *   patient-images/library.jsx     → ImageLibraryPage
 * 3 หน้า import foundation จาก ./helpers · shell/patient-modal import จาก barrel นี้เหมือนเดิม
 */
export { TrashHub } from './patient-images/trash'
export { PatientImagesTab } from './patient-images/patient-tab'
export { ImageLibraryPage } from './patient-images/library'
