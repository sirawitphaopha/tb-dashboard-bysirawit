-- ════════════════════════════════════════════════════════════════════════
-- Backfill: ใส่ profession_label (ชื่อเต็ม) ให้ comment เก่าที่ค่าว่าง
-- ════════════════════════════════════════════════════════════════════════

update tb_changelog_comments c
set profession_label = case p.profession
  when 'pharmacist'          then 'เภสัชกร'
  when 'doctor'              then 'แพทย์'
  when 'dentist'             then 'ทันตแพทย์'
  when 'nurse1'              then 'พยาบาล'
  when 'nurse2'              then 'พยาบาล'
  when 'medtech'             then 'เทคนิคการแพทย์'
  when 'physio'              then 'กายภาพบำบัด'
  when 'radio'               then 'รังสีการแพทย์'
  when 'publichealthofficer' then 'สาธารณสุข'
  when 'publichealthtech'    then 'นักวิชาการสาธารณสุข'
  when 'officer'             then 'เจ้าพนักงาน'
  when 'other'               then 'อื่นๆ'
  else coalesce(p.title, '')
end
from profiles p
where c.user_id = p.id
  and (c.profession_label is null or c.profession_label = '' or c.profession_label in ('ภก.','ภญ.','นพ.','พญ.','ทพ.','ทพญ.','ทนพ.','ทนพญ.','กภ.','นาย','นาง','นางสาว'));
