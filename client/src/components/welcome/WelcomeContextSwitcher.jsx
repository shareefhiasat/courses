import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Divider,
  CircularProgress,
  Chip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useLang } from '@contexts/LangContext';
import { useAuth } from '@contexts/AuthContext';
import {
  getInstructorPrograms,
  getAllPrograms,
  getProgramTerms,
} from '@services/business/attendanceWorkspaceService';
import { getThemedIcon } from '@constants/iconTypes';

function labelFor(item, lang, field = 'name') {
  if (!item) return '';
  const en = field === 'code' ? item.code : item.nameEn;
  const ar = field === 'code' ? item.code : item.nameAr;
  return lang === 'ar' && ar ? ar : en || item.code || '';
}

export default function WelcomeContextSwitcher({
  open,
  onClose,
  selection,
  onSelectTerm,
}) {
  const { t, lang } = useLang();
  const { isInstructor, isAdmin, isSuperAdmin } = useAuth();
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));

  const [programs, setPrograms] = useState([]);
  const [terms, setTerms] = useState([]);
  const [programsLoading, setProgramsLoading] = useState(false);
  const [termsLoading, setTermsLoading] = useState(false);
  const [activeProgramId, setActiveProgramId] = useState(null);
  const [mobileStep, setMobileStep] = useState('program');

  const activeProgram = useMemo(
    () => programs.find((p) => p.id === activeProgramId) || null,
    [programs, activeProgramId],
  );

  useEffect(() => {
    if (!open) return;
    setActiveProgramId(selection?.program?.id ?? null);
    setMobileStep('program');
  }, [open, selection?.program?.id]);

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    const loadPrograms = async () => {
      setProgramsLoading(true);
      const result = isInstructor ? await getInstructorPrograms() : await getAllPrograms();
      if (!cancelled && result.success) {
        setPrograms(result.data || []);
      }
      if (!cancelled) setProgramsLoading(false);
    };
    loadPrograms();
    return () => { cancelled = true; };
  }, [open, isInstructor]);

  useEffect(() => {
    if (!open || !activeProgramId) {
      setTerms([]);
      return undefined;
    }
    let cancelled = false;
    const loadTerms = async () => {
      setTermsLoading(true);
      const result = await getProgramTerms(activeProgramId, { all: isAdmin || isSuperAdmin });
      if (!cancelled && result.success) {
        setTerms(result.data || []);
      }
      if (!cancelled) setTermsLoading(false);
    };
    loadTerms();
    return () => { cancelled = true; };
  }, [open, activeProgramId, isAdmin, isSuperAdmin]);

  const handleProgramPick = useCallback((program) => {
    setActiveProgramId(program.id);
    if (isMobile) setMobileStep('term');
  }, [isMobile]);

  const handleTermPick = useCallback((term) => {
    if (!activeProgram) return;
    onSelectTerm({ program: activeProgram, academicTerm: term });
    onClose();
  }, [activeProgram, onSelectTerm, onClose]);

  const showPrograms = !isMobile || mobileStep === 'program';
  const showTerms = !isMobile || mobileStep === 'term';

  return (
    <Drawer
      anchor="top"
      open={open}
      onClose={onClose}
      data-testid="welcome-context-switcher"
      slotProps={{
        paper: {
          sx: {
            top: 'var(--navbar-height, 60px)',
            left: { xs: 0, md: '50%' },
            right: { xs: 0, md: 'auto' },
            transform: { md: 'translateX(-50%)' },
            width: { xs: '100%', md: 'min(720px, calc(100vw - 32px))' },
            maxHeight: 'min(70vh, 520px)',
            borderBottomLeftRadius: 12,
            borderBottomRightRadius: 12,
            boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
          },
        },
        backdrop: {
          sx: { top: 'var(--navbar-height, 60px)' },
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 280 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            py: 1.5,
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>
              {t('welcome_switch_context_title') || 'Switch program & term'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t('welcome_switch_context_hint') || 'Stay on your current tab — only the context changes.'}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small" aria-label={t('close') || 'Close'}>
            {getThemedIcon('ui', 'x', 18, 'currentColor')}
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {showPrograms && (
            <Box
              sx={{
                width: { xs: '100%', md: '42%' },
                borderRight: { md: 1 },
                borderColor: 'divider',
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
              }}
            >
              <Typography variant="overline" sx={{ px: 2, pt: 1.5, color: 'text.secondary' }}>
                {t('workspace_select_program')}
              </Typography>
              {programsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : (
                <List dense sx={{ overflowY: 'auto', flex: 1, py: 0 }}>
                  {programs.map((program) => {
                    const selected = program.id === activeProgramId;
                    const isCurrent = selection?.program?.id === program.id;
                    return (
                      <ListItemButton
                        key={program.id}
                        selected={selected}
                        onClick={() => handleProgramPick(program)}
                        data-testid={`context-program-${program.id}`}
                      >
                        <ListItemText
                          primary={labelFor(program, lang)}
                          secondary={program.code}
                          primaryTypographyProps={{ fontWeight: selected ? 700 : 500 }}
                        />
                        {isCurrent && (
                          <Chip size="small" label={t('current') || 'Current'} color="primary" variant="outlined" />
                        )}
                      </ListItemButton>
                    );
                  })}
                </List>
              )}
            </Box>
          )}

          {showTerms && (
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              {isMobile && (
                <Box sx={{ px: 2, pt: 1 }}>
                  <IconButton
                    size="small"
                    onClick={() => setMobileStep('program')}
                    sx={{ mb: 0.5 }}
                    aria-label={t('workspace_back')}
                  >
                    {getThemedIcon('ui', 'arrow_left', 18, 'currentColor')}
                  </IconButton>
                  <Typography variant="body2" color="text.secondary">
                    {labelFor(activeProgram, lang)}
                  </Typography>
                </Box>
              )}
              {!isMobile && (
                <Typography variant="overline" sx={{ px: 2, pt: 1.5, color: 'text.secondary' }}>
                  {t('workspace_select_term')}
                </Typography>
              )}
              {!activeProgramId ? (
                <Box sx={{ p: 3, color: 'text.secondary', fontSize: 14 }}>
                  {t('welcome_switch_pick_program') || 'Select a program to see terms.'}
                </Box>
              ) : termsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : (
                <List dense sx={{ overflowY: 'auto', flex: 1, py: 0 }}>
                  {terms.map((term) => {
                    const isCurrent =
                      selection?.program?.id === activeProgramId
                      && selection?.academicTerm?.id === term.id;
                    return (
                      <ListItemButton
                        key={term.id}
                        onClick={() => handleTermPick(term)}
                        data-testid={`context-term-${term.id}`}
                        sx={{
                          borderLeft: isCurrent ? '3px solid' : '3px solid transparent',
                          borderColor: isCurrent ? 'primary.main' : 'transparent',
                        }}
                      >
                        <ListItemText
                          primary={labelFor(term, lang)}
                          secondary={
                            [term.code, term.classCount > 0 && `${term.classCount} ${t('workspace_classes')}`]
                              .filter(Boolean)
                              .join(' · ')
                          }
                          primaryTypographyProps={{ fontWeight: isCurrent ? 700 : 500 }}
                        />
                        {isCurrent && (
                          <Chip size="small" label={t('current') || 'Current'} color="primary" />
                        )}
                      </ListItemButton>
                    );
                  })}
                  {terms.length === 0 && (
                    <Box sx={{ p: 2, color: 'text.secondary', fontSize: 14 }}>
                      {t('workspace_no_terms')}
                    </Box>
                  )}
                </List>
              )}
            </Box>
          )}
        </Box>

        {selection?.program && selection?.academicTerm && (
          <>
            <Divider />
            <Box sx={{ px: 2, py: 1, bgcolor: 'action.hover' }}>
              <Typography variant="caption" color="text.secondary">
                {t('welcome_switch_current') || 'Current:'}{' '}
                <strong>
                  {labelFor(selection.program, lang)}
                  {' · '}
                  {labelFor(selection.academicTerm, lang)}
                </strong>
              </Typography>
            </Box>
          </>
        )}
      </Box>
    </Drawer>
  );
}
