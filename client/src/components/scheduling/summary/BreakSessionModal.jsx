import React, { useState, useEffect } from 'react';
import { useLang } from '@contexts/LangContext';
import { Modal, Button, Select, Input } from '@ui';
import schedulingSummaryService from '@services/business/schedulingSummaryService';

const BREAK_TYPES = ['TeaBreak', 'PrayerBreak', 'LunchBreak', 'Other'];

export default function BreakSessionModal({
  open,
  onClose,
  onSaved,
  programId,
  programs = [],
  timeSlots = [],
  instructors = [],
  editData = null,
}) {
  const { t } = useLang();
  const [form, setForm] = useState({
    programId: programId || '',
    timeSlotId: '',
    instructorUserId: '',
    classroomId: '',
    date: new Date().toISOString().split('T')[0],
    breakType: 'TeaBreak',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editData) {
      setForm({
        programId: editData.programId,
        timeSlotId: editData.timeSlotId,
        instructorUserId: editData.instructorUserId || '',
        classroomId: editData.classroomId || '',
        date: new Date(editData.date).toISOString().split('T')[0],
        breakType: editData.breakType,
        notes: editData.notes || '',
      });
    } else {
      setForm((f) => ({ ...f, programId: programId || '' }));
    }
  }, [editData, programId, open]);

  const handleSave = async () => {
    setSaving(true);
    const payload = { ...form, programId: form.programId || programId };
    const result = editData
      ? await schedulingSummaryService.updateBreakSession(editData.id, payload)
      : await schedulingSummaryService.createBreakSession(payload);
    setSaving(false);
    if (result.success) {
      onSaved?.();
      onClose?.();
    }
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title={t('manage_break_session') || 'Manage Break Session'}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minWidth: '320px' }}>
        <Select
          placeholder={t('select_program') || 'Select a program'}
          value={String(form.programId || '')}
          onChange={(e) => setForm({ ...form, programId: e.target.value })}
          options={programs.map((p) => ({ value: String(p.id), label: p.nameEn || p.code }))}
        />
        <Select
          placeholder={t('select_time_slot') || 'Select a time slot'}
          value={String(form.timeSlotId || '')}
          onChange={(e) => setForm({ ...form, timeSlotId: e.target.value })}
          options={timeSlots.map((ts) => ({ value: String(ts.id), label: `${ts.labelEn} (${ts.startTime}-${ts.endTime})` }))}
        />
        <Select
          placeholder={t('select_break_type') || 'Select break type'}
          value={form.breakType}
          onChange={(e) => setForm({ ...form, breakType: e.target.value })}
          options={BREAK_TYPES.map((bt) => ({ value: bt, label: t(`break_type_${bt}`) || bt }))}
        />
        <Input type="date" label={t('date') || 'Date'} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        <Select
          placeholder={t('select_instructor_optional') || 'Select instructor (optional)'}
          value={String(form.instructorUserId || '')}
          onChange={(e) => setForm({ ...form, instructorUserId: e.target.value })}
          options={instructors.map((i) => ({
            value: String(i.id),
            label: i.displayName || i.firstName,
          }))}
        />
        <Input label={t('notes') || 'Notes'} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <Button variant="outline" onClick={onClose}>{t('cancel') || 'Cancel'}</Button>
          <Button variant="primary" onClick={handleSave} disabled={saving || !form.timeSlotId || !form.programId}>
            {saving ? t('saving') || 'Saving...' : t('save') || 'Save'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
