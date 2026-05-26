import React, { useMemo, useState, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  MarkerType,
  BackgroundVariant
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { getThemedIcon } from '@constants/iconTypes';

// Define workflow rules outside component to avoid React Flow warning
const WORKFLOW_RULES = {
  ATTENDANCE_REPORT: {
    draft: {
      description: { en: 'Create and edit attendance report', ar: 'إنشاء وتحرير تقرير الحضور' },
      roles: { en: 'Instructor', ar: 'المعلم' },
      transitions: { en: ['Submitted'], ar: ['مقدم'] }
    },
    submitted: {
      description: { en: 'Report submitted for HR review', ar: 'تم تقديم التقرير لمراجعة الموارد البشرية' },
      roles: { en: 'HR', ar: 'الموارد البشرية' },
      transitions: { en: ['Under HR Review'], ar: ['تحت مراجعة الموارد البشرية'] }
    },
    hr_review: {
      description: { en: 'HR reviewing attendance report', ar: 'مراجعة الموارد البشرية لتقرير الحضور' },
      roles: { en: 'HR', ar: 'الموارد البشرية' },
      transitions: { en: ['Admin Review', 'Approved'], ar: ['مراجعة الإدارة', 'موافق عليه'] }
    },
    admin_review: {
      description: { en: 'Admin reviewing attendance report', ar: 'مراجعة الإدارة لتقرير الحضور' },
      roles: { en: 'Admin', ar: 'الإدارة' },
      transitions: { en: ['Approved'], ar: ['موافق عليه'] }
    },
    approved: {
      description: { en: 'Report approved and finalized', ar: 'تمت الموافقة على التقرير وإتمامه' },
      roles: { en: 'None', ar: 'لا يوجد' },
      transitions: { en: [], ar: [] }
    },
    rejected: {
      description: { en: 'Report rejected by owner only', ar: 'تم رفض التقرير من قبل المالك فقط' },
      roles: { en: 'Owner', ar: 'المالك' },
      transitions: { en: [], ar: [] }
    }
  },
  WEEKLY_SUMMARY: {
    draft: {
      description: { en: 'Create and edit weekly summary', ar: 'إنشاء وتحرير الملخص الأسبوعي' },
      roles: { en: 'Instructor', ar: 'المعلم' },
      transitions: { en: ['Submitted'], ar: ['مقدم'] }
    },
    submitted: {
      description: { en: 'Summary submitted for HR review', ar: 'تم تقديم الملخص لمراجعة الموارد البشرية' },
      roles: { en: 'HR', ar: 'الموارد البشرية' },
      transitions: { en: ['Under HR Review'], ar: ['تحت مراجعة الموارد البشرية'] }
    },
    hr_review: {
      description: { en: 'HR reviewing weekly summary', ar: 'مراجعة الموارد البشرية للملخص الأسبوعي' },
      roles: { en: 'HR', ar: 'الموارد البشرية' },
      transitions: { en: ['Approved'], ar: ['موافق عليه'] }
    },
    approved: {
      description: { en: 'Summary approved and finalized', ar: 'تمت الموافقة على الملخص وإتمامه' },
      roles: { en: 'None', ar: 'لا يوجد' },
      transitions: { en: [], ar: [] }
    },
    rejected: {
      description: { en: 'Summary rejected by owner only', ar: 'تم رفض الملخص من قبل المالك فقط' },
      roles: { en: 'Owner', ar: 'المالك' },
      transitions: { en: [], ar: [] }
    }
  },
  GENERAL: {
    admin_submit: {
      description: { en: 'Admin submits document', ar: 'تقديم المستند من قبل الإدارة' },
      roles: { en: 'Admin', ar: 'الإدارة' },
      transitions: { en: ['HR Review'], ar: ['مراجعة الموارد البشرية'] }
    },
    hr_review: {
      description: { en: 'HR reviewing document', ar: 'مراجعة الموارد البشرية للمستند' },
      roles: { en: 'HR', ar: 'الموارد البشرية' },
      transitions: { en: ['Approved', 'Rejected'], ar: ['موافق عليه', 'مرفوض'] }
    }
  }
};

// Define workflow stages outside component
const WORKFLOW_STAGES = {
  ATTENDANCE_REPORT: [
    { id: 'draft', label: { en: 'Draft', ar: 'مسودة' }, status: 'DRAFT' },
    { id: 'submitted', label: { en: 'Submitted', ar: 'مقدم' }, status: 'SUBMITTED' },
    { id: 'hr_review', label: { en: 'HR Review', ar: 'مراجعة الموارد البشرية' }, status: 'UNDER_HR_REVIEW' },
    { id: 'admin_review', label: { en: 'Admin Review', ar: 'مراجعة الإدارة' }, status: 'UNDER_ADMIN_REVIEW' },
    { id: 'approved', label: { en: 'Approved', ar: 'موافق عليه' }, status: 'APPROVED' },
    { id: 'rejected', label: { en: 'Rejected', ar: 'مرفوض' }, status: 'REJECTED' }
  ],
  WEEKLY_SUMMARY: [
    { id: 'draft', label: { en: 'Draft', ar: 'مسودة' }, status: 'DRAFT' },
    { id: 'submitted', label: { en: 'Submitted', ar: 'مقدم' }, status: 'SUBMITTED' },
    { id: 'hr_review', label: { en: 'HR Review', ar: 'مراجعة الموارد البشرية' }, status: 'UNDER_HR_REVIEW' },
    { id: 'approved', label: { en: 'Approved', ar: 'موافق عليه' }, status: 'APPROVED' },
    { id: 'rejected', label: { en: 'Rejected', ar: 'مرفوض' }, status: 'REJECTED' }
  ],
  GENERAL: [
    { id: 'admin_submit', label: { en: 'Admin Submit', ar: 'تقديم الإدارة' }, status: 'SUBMITTED' },
    { id: 'hr_review', label: { en: 'HR Review', ar: 'مراجعة الموارد البشرية' }, status: 'UNDER_HR_REVIEW' },
    { id: 'approved', label: { en: 'Approved', ar: 'موافق عليه' }, status: 'APPROVED' },
    { id: 'rejected', label: { en: 'Rejected', ar: 'مرفوض' }, status: 'REJECTED' }
  ]
};

const WorkflowDiagram = ({ status, workflowType = 'ATTENDANCE_REPORT', document }) => {
  const { lang } = useLang();
  const { theme } = useTheme();

  // Get workflow rules and stages
  const workflowRules = WORKFLOW_RULES[workflowType] || WORKFLOW_RULES.ATTENDANCE_REPORT;
  const workflowStages = WORKFLOW_STAGES[workflowType] || WORKFLOW_STAGES.ATTENDANCE_REPORT;

  // Determine current stage index
  const currentStageIndex = useMemo(() => {
    return workflowStages.findIndex(stage => stage.status === status);
  }, [workflowStages, status]);

  // Generate nodes
  const nodes = useMemo(() => {
    const isRTL = lang === 'ar';
    const nodeWidth = 240;
    const nodeHeight = 140;
    const gap = 60;
    const startX = isRTL ? 800 : 50;
    const direction = isRTL ? -1 : 1;

    // Get status history for dates and actors
    const statusHistory = document?.statusHistory || [];

    return workflowStages.map((stage, index) => {
      const x = startX + (index * (nodeWidth + gap) * direction);
      const y = 100;

      // Determine node style based on status
      let backgroundColor = '#f9fafb';
      let borderColor = '#9ca3af';
      let textColor = '#111827';

      if (index < currentStageIndex) {
        // Completed
        backgroundColor = '#d1fae5';
        borderColor = '#10b981';
        textColor = '#064e3b';
      } else if (index === currentStageIndex) {
        // Current
        backgroundColor = '#dbeafe';
        borderColor = '#3b82f6';
        textColor = '#1e3a8a';
      } else {
        // Pending
        backgroundColor = '#f3f4f6';
        borderColor = '#d1d5db';
        textColor = '#374151';
      }

      // Rejected status - use owner color scheme
      if (stage.status === 'REJECTED' && status === 'REJECTED') {
        backgroundColor = '#fef3c7';
        borderColor = '#f59e0b';
        textColor = '#92400e';
      }

      // Get role icon based on stage (matching navbar avatar icons exactly)
      const getRoleIcon = (stageId, color = null) => {
        const rule = workflowRules[stageId];
        if (!rule) return null;
        const role = rule.roles[lang].toLowerCase();
        if (role.includes('instructor')) return getThemedIcon('ui', 'book_open', 18, color);
        if (role.includes('hr')) return getThemedIcon('ui', 'users', 18, color);
        if (role.includes('admin')) return getThemedIcon('ui', 'shield', 18, color);
        if (role.includes('owner')) return getThemedIcon('ui', 'crown', 18, color);
        if (role.includes('super admin')) return getThemedIcon('ui', 'crown', 18, color);
        return null;
      };

      // Get colored icon based on status color
      const getColoredIcon = (stageId) => {
        // Pass the borderColor directly to getThemedIcon to override default colors
        return getRoleIcon(stageId, borderColor);
      };

      // Find the status history entry for this stage
      const historyEntry = statusHistory.find(h => h.toStatus === stage.status);
      const actorName = historyEntry?.actor?.name || historyEntry?.actor?.firstName || '-';
      const entryDate = historyEntry?.createdAt ? new Date(historyEntry.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';

      const roleInfo = getRoleIcon(stage.id);
      const coloredIcon = getColoredIcon(stage.id);

      return {
        id: stage.id,
        position: { x, y },
        data: {
          label: (
            <div className="flex flex-col h-full justify-between">
              <div className="flex flex-row items-center gap-4">
                <div className="flex items-center gap-2">
                  {coloredIcon}
                  <span className="font-semibold text-base" style={{ color: borderColor }}>{stage.label[lang]}</span>
                </div>
                <div className="flex flex-col items-start gap-1">
                  <div className="text-sm font-medium text-black">
                    {workflowRules[stage.id]?.roles[lang] || '-'}
                  </div>
                </div>
              </div>
              {historyEntry && (
                <div className="flex flex-col items-start gap-1 mt-auto">
                  <div className="text-sm font-medium text-black">
                    {actorName}
                  </div>
                  <div className="text-xs text-black">
                    {entryDate}
                  </div>
                </div>
              )}
            </div>
          )
        },
        style: {
          backgroundColor,
          borderColor,
          color: textColor,
          borderWidth: 3,
          borderRadius: 12,
          padding: 16,
          width: nodeWidth,
          height: nodeHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          fontWeight: 600,
          cursor: 'default',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }
      };
    });
  }, [workflowStages, currentStageIndex, status, lang, workflowRules, theme, document]);

  // Generate edges based on WORKFLOW_RULES transitions
  const edges = useMemo(() => {
    const isRTL = lang === 'ar';
    const edges = [];

    workflowStages.forEach((stage, index) => {
      const rule = workflowRules[stage.id];
      if (!rule || !rule.transitions[lang] || rule.transitions[lang].length === 0) {
        return;
      }

      // Find target stages based on transitions
      rule.transitions[lang].forEach((transitionName) => {
        const targetStage = workflowStages.find(s => s.label[lang] === transitionName);
        if (targetStage) {
          const isCompleted = index < currentStageIndex;
          const isCurrentStage = index === currentStageIndex;
          
          // Animate edges from current stage to possible next stages with dashed line
          const shouldAnimate = isCurrentStage;
          const isDashed = shouldAnimate;

          edges.push({
            id: `${stage.id}-${targetStage.id}`,
            source: stage.id,
            target: targetStage.id,
            type: 'smoothstep',
            animated: shouldAnimate,
            style: {
              stroke: isCompleted ? '#10b981' : (shouldAnimate ? '#3b82f6' : '#6b7280'),
              strokeWidth: 3,
              strokeDasharray: isDashed ? '5,5' : 'none'
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: isCompleted ? '#10b981' : (shouldAnimate ? '#3b82f6' : '#6b7280'),
              width: 20,
              height: 20
            }
          });
        }
      });
    });

    return edges;
  }, [workflowStages, currentStageIndex, status, lang, workflowRules]);

  // Theme styles - always use white background
  const themeStyles = useMemo(() => {
    return {
      background: '#ffffff',
      textColor: '#111827'
    };
  }, []);

  return (
    <div className="w-full h-64 md:h-80 lg:h-96 py-8">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        attributionPosition="hidden"
        style={{ background: themeStyles.background }}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
        zoomOnScroll={true}
        panOnScroll={true}
        panOnDrag={true}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={12}
          size={1}
          color={theme === 'dark' ? '#374151' : '#e5e7eb'}
        />
        <Controls />
      </ReactFlow>

      {/* Role Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 border border-gray-200">
        <p className="text-xs font-semibold text-gray-900 uppercase mb-3">
          {lang === 'ar' ? 'أيقونات الأدوار' : 'Role Icons'}
        </p>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 flex items-center justify-center rounded-full" style={{ background: '#0ea5e9' }}>
              {getThemedIcon('ui', 'book_open', 16, 'white')}
            </div>
            <span className="text-xs text-gray-900">
              {lang === 'ar' ? 'المعلم' : 'Instructor'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 flex items-center justify-center rounded-full" style={{ background: '#8b5cf6' }}>
              {getThemedIcon('ui', 'users', 16, 'white')}
            </div>
            <span className="text-xs text-gray-900">
              {lang === 'ar' ? 'الموارد البشرية' : 'HR'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 flex items-center justify-center rounded-full" style={{ background: '#4f46e5' }}>
              {getThemedIcon('ui', 'shield', 16, 'white')}
            </div>
            <span className="text-xs text-gray-900">
              {lang === 'ar' ? 'الإدارة' : 'Admin'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 flex items-center justify-center rounded-full" style={{ background: '#f59e0b' }}>
              {getThemedIcon('ui', 'crown', 16, 'white')}
            </div>
            <span className="text-xs text-gray-900">
              {lang === 'ar' ? 'المالك / مسؤول النظام' : 'Owner / Super Admin'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowDiagram;
