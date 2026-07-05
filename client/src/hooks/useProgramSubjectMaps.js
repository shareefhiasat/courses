import { useEffect, useState } from 'react';
import { getPrograms, getSubjects } from '@services/business/programService';

function indexByKeys(items = []) {
  const map = {};
  items.forEach((item) => {
    if (item.code) map[item.code] = item;
    if (item.id != null) map[String(item.id)] = item;
    if (item.docId != null) map[String(item.docId)] = item;
  });
  return map;
}

export function useProgramSubjectMaps() {
  const [programMap, setProgramMap] = useState({});
  const [subjectMap, setSubjectMap] = useState({});

  useEffect(() => {
    Promise.all([getPrograms(), getSubjects()]).then(([pRes, sRes]) => {
      if (pRes.success) setProgramMap(indexByKeys(pRes.data || []));
      if (sRes.success) setSubjectMap(indexByKeys(sRes.data || []));
    });
  }, []);

  return { programMap, subjectMap };
}

export function getWorkflowContextParts(workflow, { programMap = {}, subjectMap = {}, lang = 'en' } = {}) {
  const parts = [];

  if (workflow?.program) {
    const prog = programMap[workflow.program] || programMap[String(workflow.program)];
    const name = prog
      ? (lang === 'ar' ? (prog.nameAr || prog.nameEn) : prog.nameEn)
      : workflow.program;
    parts.push(name);
  }

  if (workflow?.subject) {
    const subj = subjectMap[workflow.subject] || subjectMap[String(workflow.subject)];
    const name = subj
      ? (lang === 'ar' ? (subj.nameAr || subj.nameEn) : subj.nameEn)
      : workflow.subject;
    parts.push(name);
  }

  const cls = workflow?.class;
  if (cls) {
    parts.push(lang === 'ar' ? (cls.nameAr || cls.nameEn || cls.code) : (cls.nameEn || cls.nameAr || cls.code));
  }

  return parts;
}
