import { getEntityDisplayName } from '../entityDisplayName.js';

describe('getEntityDisplayName', () => {
  const program = { nameEn: 'Program EN', nameAr: 'برنامج', code: 'P1' };
  const subject = { nameEn: 'Subject EN', nameAr: 'مادة', code: 'S1' };
  const classroom = { nameEn: 'Room EN', nameAr: 'قاعة', code: 'R1' };
  const user = {
    displayName: 'John Doe',
    displayNameAr: 'جون دو',
    firstName: 'John',
    lastName: 'Doe',
  };

  it('returns fallback for null entity', () => {
    expect(getEntityDisplayName(null)).toBe('—');
    expect(getEntityDisplayName(null, { fallback: 'N/A' })).toBe('N/A');
  });

  it('resolves user kind with localization', () => {
    expect(getEntityDisplayName(user, { kind: 'user', lang: 'en' })).toBe('John Doe');
    expect(getEntityDisplayName(user, { kind: 'user', lang: 'ar' })).toBe('جون دو');
  });

  it('resolves lookup kind via nameEn/nameAr', () => {
    const lookup = { nameEn: 'Type EN', nameAr: 'نوع', code: 'T1' };
    expect(getEntityDisplayName(lookup, { kind: 'lookup', lang: 'en' })).toBe('Type EN');
    expect(getEntityDisplayName(lookup, { kind: 'lookup', lang: 'ar' })).toBe('نوع');
  });

  it('resolves scheduling entity kinds', () => {
    expect(getEntityDisplayName(program, { kind: 'program', lang: 'en' })).toBe('Program EN');
    expect(getEntityDisplayName(program, { kind: 'program', lang: 'ar' })).toBe('برنامج');
    expect(getEntityDisplayName(subject, { kind: 'subject', lang: 'ar' })).toBe('مادة');
    expect(getEntityDisplayName(classroom, { kind: 'classroom', lang: 'en' })).toBe('Room EN');
  });

  it('falls back to generic name fields when kind is omitted', () => {
    expect(getEntityDisplayName({ nameEn: 'Generic EN', nameAr: 'عام' }, { lang: 'ar' })).toBe('عام');
    expect(getEntityDisplayName({ code: 'X1' }, { lang: 'en' })).toBe('X1');
  });
});
