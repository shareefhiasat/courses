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
  const isRTL = lang === 'ar';

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
            left: { xs: 0, md: isRTL ? 'auto' : '64px' },
            right: { xs: 0, md: isRTL ? '64px' : 'auto' },
            transform: 'none',
            width: { xs: '100%', md: 'min(600px, calc(100vw - 96px))' },
            maxHeight: 'min(60vh, 400px)',
            borderBottomLeftRadius: 12,
            borderBottomRightRadius: 12,
            boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
          },
        },
        backdrop: {
          sx: {},
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 200 }} dir={isRTL ? 'rtl' : 'ltr'}>
        <Box sx={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {showPrograms && (
            <Box
              sx={{
                width: { xs: '100%', md: '42%' },
                borderRight: { md: isRTL ? 0 : 1 },
                borderLeft: { md: isRTL ? 1 : 0 },
                borderColor: 'divider',
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
              }}
            >
              {programsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                  <CircularProgress size={20} />
                </Box>
              ) : (
                <List dense sx={{ overflowY: 'auto', flex: 1, py: 0.5 }}>
                  {programs.map((program) => {
                    const selected = program.id === activeProgramId;
                    const isCurrent = selection?.program?.id === program.id;
                    return (
                      <ListItemButton
                        key={program.id}
                        selected={selected}
                        onClick={() => handleProgramPick(program)}
                        data-testid={`context-program-${program.id}`}
                        sx={{ py: 0.5 }}
                      >
                        <ListItemText
                          primary={labelFor(program, lang)}
                          secondary={program.code}
                          primaryTypographyProps={{ fontWeight: selected ? 700 : 500, fontSize: '0.85rem', textAlign: isRTL ? 'right' : 'left' }}
                          secondaryTypographyProps={{ fontSize: '0.75rem', textAlign: isRTL ? 'right' : 'left' }}
                        />
                        {isCurrent && (
                          <Chip size="small" label={t('current') || 'Current'} color="primary" variant="outlined" sx={{ fontSize: '0.7rem', height: 20 }} />
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
                <Box sx={{ px: 1.5, pt: 0.5 }}>
                  <IconButton
                    size="small"
                    onClick={() => setMobileStep('program')}
                    sx={{ mb: 0.25 }}
                    aria-label={t('workspace_back')}
                  >
                    {getThemedIcon('ui', isRTL ? 'arrow_right' : 'arrow_left', 16, 'currentColor')}
                  </IconButton>
                  <Typography variant="caption" color="text.secondary" fontSize="0.8rem" sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                    {labelFor(activeProgram, lang)}
                  </Typography>
                </Box>
              )}
              {!activeProgramId ? (
                <Box sx={{ p: 2, color: 'text.secondary', fontSize: 13, textAlign: isRTL ? 'right' : 'left' }}>
                  {t('welcome_switch_pick_program') || 'Select a program to see terms.'}
                </Box>
              ) : termsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                  <CircularProgress size={20} />
                </Box>
              ) : (
                <List dense sx={{ overflowY: 'auto', flex: 1, py: 0.5 }}>
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
                          borderRight: isRTL ? (isCurrent ? `3px solid ${muiTheme.palette.primary.main}` : '3px solid transparent') : '3px solid transparent',
                          borderLeft: !isRTL ? (isCurrent ? `3px solid ${muiTheme.palette.primary.main}` : '3px solid transparent') : '3px solid transparent',
                          py: 0.5,
                        }}
                      >
                        <ListItemText
                          primary={labelFor(term, lang)}
                          secondary={
                            [term.code, term.classCount > 0 && `${term.classCount} ${t('workspace_classes')}`]
                              .filter(Boolean)
                              .join(' · ')
                          }
                          primaryTypographyProps={{ fontWeight: isCurrent ? 700 : 500, fontSize: '0.85rem', textAlign: isRTL ? 'right' : 'left' }}
                          secondaryTypographyProps={{ fontSize: '0.75rem', textAlign: isRTL ? 'right' : 'left' }}
                        />
                        {isCurrent && (
                          <Chip size="small" label={t('current') || 'Current'} color="primary" sx={{ fontSize: '0.7rem', height: 20 }} />
                        )}
                      </ListItemButton>
                    );
                  })}
                  {terms.length === 0 && (
                    <Box sx={{ p: 1.5, color: 'text.secondary', fontSize: 13, textAlign: isRTL ? 'right' : 'left' }}>
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
            <Box sx={{ px: 1.5, py: 0.75, bgcolor: 'action.hover' }}>
              <Typography variant="caption" color="text.secondary" fontSize="0.75rem" sx={{ textAlign: isRTL ? 'right' : 'left', width: '100%', display: 'block' }}>
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
