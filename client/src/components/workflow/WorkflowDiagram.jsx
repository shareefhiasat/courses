import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  MarkerType,
  BackgroundVariant,
  applyNodeChanges
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { getThemedIcon, getUserRoleIcon, getUserRoleColor } from '@constants/iconTypes';
import { Tooltip } from '@ui';
import { Send, RotateCcw, Download, Layout, Minimize2, Maximize2, X } from 'lucide-react';

// Create Dagre graph instance
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

// Custom node component with tooltip
const WorkflowNode = ({ data }) => {
  const { historyEntry, actorName, entryDate, comment, description } = data;
  
  return (
    <div className="w-full h-full">
      {data.label}
    </div>
  );
};

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
    draft: {
      description: { en: 'Create and edit document', ar: 'إنشاء وتحرير المستند' },
      roles: { en: 'Owner', ar: 'المالك' },
      transitions: { en: ['Submit'], ar: ['تقديم'] }
    },
    submit: {
      description: { en: 'Submit document for HR review', ar: 'تقديم المستند لمراجعة الموارد البشرية' },
      roles: { en: 'Owner', ar: 'المالك' },
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
    { id: 'draft', label: { en: 'Draft', ar: 'مسودة' }, status: 'DRAFT' },
    { id: 'submit', label: { en: 'Submit', ar: 'تقديم' }, status: 'SUBMITTED' },
    { id: 'hr_review', label: { en: 'HR Review', ar: 'مراجعة الموارد البشرية' }, status: 'UNDER_HR_REVIEW' },
    { id: 'approved', label: { en: 'Approved', ar: 'موافق عليه' }, status: 'APPROVED' },
    { id: 'rejected', label: { en: 'Rejected', ar: 'مرفوض' }, status: 'REJECTED' }
  ]
};

const WorkflowDiagram = ({ status, workflowType = 'ATTENDANCE_REPORT', document, currentAssignee }) => {
  const { lang, t } = useLang();
  const { theme } = useTheme();
  const [viewMode, setViewMode] = useState('flow'); // 'flow' or 'timeline'
  const [layoutMode, setLayoutMode] = useState('default'); // 'default', 'hierarchical', 'compact'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const reactFlowInstance = useRef(null);
  const [nodes, setNodes] = useState([]);

  // Helper function to get role icon with color
  const getRoleIcon = (roleName) => {
    const roleLower = roleName?.toLowerCase() || '';
    
    // Determine role type
    let roleType = null;
    if (roleLower.includes('owner') || roleLower.includes('مالك')) {
      roleType = 'owner';
    } else if (roleLower.includes('hr') || roleLower.includes('موارد')) {
      roleType = 'hr';
    } else if (roleLower.includes('admin') || roleLower.includes('إدارة')) {
      roleType = 'admin';
    } else if (roleLower.includes('instructor') || roleLower.includes('معلم')) {
      roleType = 'instructor';
    } else if (roleLower.includes('super_admin') || roleLower.includes('superadmin')) {
      roleType = 'super_admin';
    }
    
    if (!roleType) return null;
    
    // Get icon with role-specific color
    const icon = getUserRoleIcon(roleType);
    const color = getUserRoleColor(roleType);
    return React.cloneElement(icon, { color, size: 16 });
  };

  // Get workflow rules and stages
  const workflowRules = WORKFLOW_RULES[workflowType] || WORKFLOW_RULES.ATTENDANCE_REPORT;
  const workflowStages = WORKFLOW_STAGES[workflowType] || WORKFLOW_STAGES.ATTENDANCE_REPORT;

  // Determine current stage index (must be before progressPercentage)
  const currentStageIndex = useMemo(() => {
    return workflowStages.findIndex(stage => stage.status === status);
  }, [workflowStages, status]);

  // Calculate progress percentage
  const progressPercentage = useMemo(() => {
    if (currentStageIndex === -1) return 0;
    return Math.round((currentStageIndex / (workflowStages.length - 1)) * 100);
  }, [currentStageIndex, workflowStages.length]);

  // Helper to calculate stage duration
  const calculateDuration = (historyEntry, nextEntry) => {
    if (!historyEntry?.createdAt) return null;
    const startDate = new Date(historyEntry.createdAt);
    const endDate = nextEntry?.createdAt ? new Date(nextEntry.createdAt) : new Date();
    const diffMs = endDate - startDate;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) return `${diffDays}d ${diffHours}h`;
    if (diffHours > 0) return `${diffHours}h`;
    return '<1h';
  };

  // Dagre layout function for auto-arranging nodes
  const getLayoutedElements = (nodes, edges, direction = 'LR') => {
    const isRTL = lang === 'ar';
    let nodeWidth = 200;
    let nodeHeight = 120;
    let ranksep = 100;
    let nodesep = 100;

    // Adjust based on layout mode
    if (layoutMode === 'compact') {
      nodeWidth = 160;
      nodeHeight = 100;
      ranksep = 50;
      nodesep = 50;
    } else if (layoutMode === 'hierarchical') {
      nodeWidth = 220;
      nodeHeight = 140;
      ranksep = 150;
      nodesep = 120;
    }

    dagreGraph.setGraph({ 
      rankdir: isRTL ? 'RL' : direction,
      ranksep,
      nodesep
    });

    nodes.forEach((node) => {
      dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      return {
        ...node,
        sourcePosition: isRTL ? 'left' : 'right',
        targetPosition: isRTL ? 'right' : 'left',
        position: {
          x: nodeWithPosition.x - nodeWidth / 2,
          y: nodeWithPosition.y - nodeHeight / 2,
        },
      };
    });

    return { nodes: layoutedNodes, edges };
  };

  // Generate nodes
  const initialNodes = useMemo(() => {
    const nodeWidth = 200;
    const nodeHeight = 120;

    // Get status history for dates and actors
    const statusHistory = document?.statusHistory || [];

    const generatedNodes = workflowStages.map((stage, index) => {

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
        borderColor = getUserRoleColor('owner');
        textColor = '#92400e';
      }

      // Find the status history entry for this stage
      const historyEntry = statusHistory.find(h => h.toStatus === stage.status);
      const nextEntry = statusHistory[statusHistory.findIndex(h => h.toStatus === stage.status) + 1];
      
      // For draft stage, use document owner and creation date if no history entry
      let actorName = historyEntry?.actor?.name || historyEntry?.actor?.firstName || '-';
      let entryDate = historyEntry?.createdAt ? new Date(historyEntry.createdAt).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';
      
      if (stage.id === 'draft' && !historyEntry && document) {
        actorName = document.owner?.name || document.owner?.firstName || '-';
        entryDate = document.createdAt ? new Date(document.createdAt).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';
      }
      
      const duration = calculateDuration(historyEntry, nextEntry);
      const comment = historyEntry?.comment || '';
      const description = workflowRules[stage.id]?.description[lang] || '';

      // Get status-specific icon and color from workflow inbox filter definitions
      const getStatusIcon = (stageId) => {
        const statusMap = {
          'draft': { icon: 'file_text', color: '#6b7280' },
          'submitted': { icon: 'send', color: '#3b82f6' },
          'submit': { icon: 'send', color: '#3b82f6' },
          'hr_review': { icon: 'alert_triangle', color: '#3b82f6' },
          'admin_review': { icon: 'alert_triangle', color: '#8b5cf6' },
          'approved': { icon: 'check_circle', color: '#10b981' },
          'rejected': { icon: 'x_circle', color: '#ef4444' }
        };
        return statusMap[stageId] || { icon: 'file_text', color: '#6b7280' };
      };

      const statusIcon = getStatusIcon(stage.id);

      return {
        id: stage.id,
        data: {
          label: (
            <div
              className="flex flex-col h-full justify-between"
              style={{ position: 'relative' }}
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getRoleIcon(workflowRules[stage.id]?.roles[lang])}
                    {getThemedIcon('ui', statusIcon.icon, 20, statusIcon.color)}
                    <span className="font-bold text-lg" style={{ color: borderColor }}>{stage.label[lang]}</span>
                  </div>
                  {duration && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ background: '#e0f2fe', color: '#0369a1' }}>
                      {duration}
                    </span>
                  )}
                </div>
              </div>
              {historyEntry && (
                <div className="flex flex-col gap-1 mt-auto">
                  <div className="text-sm font-semibold" style={{ color: '#111827' }}>
                    {actorName}
                  </div>
                  <div className="text-xs" style={{ color: '#6b7280' }}>
                    {entryDate}
                  </div>
                  {comment && (
                    <div className="text-xs italic mt-1" style={{ color: '#6b7280', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={comment}>
                      "{comment}"
                    </div>
                  )}
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
          padding: 20,
          width: nodeWidth,
          height: nodeHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: index === currentStageIndex ? '0 0 0 4px rgba(59, 130, 246, 0.2), 0 4px 12px rgba(0,0,0,0.15)' : '0 2px 8px rgba(0,0,0,0.1)',
          animation: index === currentStageIndex ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none',
          transition: 'all 0.3s ease'
        },
        className: index === currentStageIndex ? 'workflow-current-stage' : ''
      };
    });

    // Apply Dagre layout will be done after edges are generated
    return generatedNodes;
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

  // Initialize nodes state with layouted nodes
  useEffect(() => {
    const { nodes: layoutedNodes } = getLayoutedElements(initialNodes, edges);
    setNodes(layoutedNodes);
  }, [initialNodes, edges, layoutMode]);

  // Handle node position changes
  const onNodesChange = useCallback((changes) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, []);

  // Theme styles - always use white background
  const themeStyles = useMemo(() => {
    return {
      background: '#ffffff',
      textColor: '#111827'
    };
  }, []);

  // Reset node positions to Dagre layout
  const handleResetLayout = useCallback(() => {
    if (reactFlowInstance.current) {
      const { nodes: layoutedNodes } = getLayoutedElements(initialNodes, edges);
      reactFlowInstance.current.setNodes(layoutedNodes);
      reactFlowInstance.current.fitView({ padding: 0.2 });
    }
  }, [initialNodes, edges, layoutMode]);

  // Export diagram as image
  const handleExport = useCallback(() => {
    if (reactFlowInstance.current) {
      reactFlowInstance.current.fitView({ padding: 0.2 });
      setTimeout(() => {
        const { width, height } = reactFlowInstance.current.getBoundingClientRect();
        const element = window.document.querySelector('.react-flow__viewport');
        if (element) {
          // Use html2canvas or similar library for better export
          // For now, create a canvas and draw the SVG
          const svg = element.querySelector('svg');
          if (svg) {
            const svgData = new XMLSerializer().serializeToString(svg);
            const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = window.document.createElement('a');
            link.href = url;
            link.download = `workflow-diagram-${document?.id || 'export'}.svg`;
            link.click();
            URL.revokeObjectURL(url);
          }
        }
      }, 100);
    }
  }, [document?.id]);

  return (
    <div className="w-full py-4">
      <style>{`
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2), 0 4px 12px rgba(0,0,0,0.15);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.3), 0 6px 16px rgba(0,0,0,0.2);
          }
        }
        .workflow-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .workflow-scrollbar::-webkit-scrollbar-track {
          background: var(--scrollbar-track, #f1f5f9);
          border-radius: 4px;
        }
        .workflow-scrollbar::-webkit-scrollbar-thumb {
          background: var(--scrollbar-thumb, #cbd5e1);
          border-radius: 4px;
        }
        .workflow-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--scrollbar-thumb-hover, #94a3b8);
        }
      `}</style>

      {/* Header with progress, legend and controls */}
      <div className="flex items-center justify-between mb-4 px-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium" style={{ color: 'var(--text-secondary, #6b7280)' }}>
              {progressPercentage}%
            </div>
            <div style={{ width: 120, height: 8, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ width: `${progressPercentage}%`, height: '100%', background: '#10b981', transition: 'width 0.3s ease' }} />
            </div>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div style={{ width: 16, height: 16, background: '#10b981', borderRadius: 4 }} />
              <span style={{ color: '#10b981', fontWeight: 500 }}>{t('workflow.legend.completed', 'Completed')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div style={{ width: 16, height: 16, background: '#3b82f6', borderRadius: 4 }} />
              <span style={{ color: '#3b82f6', fontWeight: 500 }}>{t('workflow.legend.current', 'Current')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div style={{ width: 16, height: 16, background: '#6b7280', borderRadius: 4 }} />
              <span style={{ color: '#6b7280', fontWeight: 500 }}>{t('workflow.legend.pending', 'Pending')}</span>
            </div>
            <div style={{ width: 1, height: 16, background: '#e5e7eb' }}></div>
            <div className="flex items-center gap-2">
              {getRoleIcon('Owner')}
              <span style={{ color: 'var(--text-secondary, #6b7280)' }}>{t('owner', 'Owner')}</span>
            </div>
            <div className="flex items-center gap-2">
              {getRoleIcon('HR')}
              <span style={{ color: 'var(--text-secondary, #6b7280)' }}>{t('roles.hr', 'HR')}</span>
            </div>
            <div className="flex items-center gap-2">
              {getRoleIcon('Admin')}
              <span style={{ color: 'var(--text-secondary, #6b7280)' }}>{t('roles.admin', 'Admin')}</span>
            </div>
            <div className="flex items-center gap-2">
              {getRoleIcon('Instructor')}
              <span style={{ color: 'var(--text-secondary, #6b7280)' }}>{t('roles.instructor', 'Instructor')}</span>
            </div>
          </div>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('flow')}
            style={{
              padding: '0.5rem',
              background: viewMode === 'flow' ? 'var(--color-primary, #3b82f6)' : 'transparent',
              color: viewMode === 'flow' ? 'white' : 'var(--text, #111827)',
              border: '1px solid var(--border, #d1d5db)',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {getThemedIcon('ui', 'workflow', 18, viewMode === 'flow' ? 'white' : 'primary')}
          </button>
          <button
            onClick={() => setViewMode('timeline')}
            style={{
              padding: '0.5rem',
              background: viewMode === 'timeline' ? 'var(--color-primary, #3b82f6)' : 'transparent',
              color: viewMode === 'timeline' ? 'white' : 'var(--text, #111827)',
              border: '1px solid var(--border, #d1d5db)',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {getThemedIcon('ui', 'clock', 18, viewMode === 'timeline' ? 'white' : 'primary')}
          </button>
          <div style={{ width: 1, height: 24, background: 'var(--border, #d1d5db)', margin: '0 0.5rem' }} />
          <Tooltip content="Default Layout">
            <button
              onClick={() => setLayoutMode('default')}
              style={{
                padding: '0.5rem',
                background: layoutMode === 'default' ? 'var(--color-primary, #3b82f6)' : 'transparent',
                color: layoutMode === 'default' ? 'white' : 'var(--text, #111827)',
                border: '1px solid var(--border, #d1d5db)',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Layout size={18} />
            </button>
          </Tooltip>
          <Tooltip content="Compact Layout">
            <button
              onClick={() => setLayoutMode('compact')}
              style={{
                padding: '0.5rem',
                background: layoutMode === 'compact' ? 'var(--color-primary, #3b82f6)' : 'transparent',
                color: layoutMode === 'compact' ? 'white' : 'var(--text, #111827)',
                border: '1px solid var(--border, #d1d5db)',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Minimize2 size={18} />
            </button>
          </Tooltip>
          <Tooltip content="Hierarchical Layout">
            <button
              onClick={() => setLayoutMode('hierarchical')}
              style={{
                padding: '0.5rem',
                background: layoutMode === 'hierarchical' ? 'var(--color-primary, #3b82f6)' : 'transparent',
                color: layoutMode === 'hierarchical' ? 'white' : 'var(--text, #111827)',
                border: '1px solid var(--border, #d1d5db)',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Layout size={18} />
            </button>
          </Tooltip>
          <div style={{ width: 1, height: 24, background: 'var(--border, #d1d5db)', margin: '0 0.5rem' }} />
          <Tooltip content="Reset Layout">
            <button
              onClick={handleResetLayout}
              style={{
                padding: '0.5rem',
                background: 'transparent',
                color: 'var(--text, #111827)',
                border: '1px solid var(--border, #d1d5db)',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <RotateCcw size={18} />
            </button>
          </Tooltip>
          <Tooltip content="Export as SVG">
            <button
              onClick={handleExport}
              style={{
                padding: '0.5rem',
                background: 'transparent',
                color: 'var(--text, #111827)',
                border: '1px solid var(--border, #d1d5db)',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Download size={18} />
            </button>
          </Tooltip>
          <Tooltip content="Fullscreen">
            <button
              onClick={() => setIsFullscreen(true)}
              style={{
                padding: '0.5rem',
                background: 'transparent',
                color: 'var(--text, #111827)',
                border: '1px solid var(--border, #d1d5db)',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Maximize2 size={18} />
            </button>
          </Tooltip>
        </div>
      </div>

      {viewMode === 'flow' ? (
        <div className="w-full h-80 md:h-96 lg:h-[500px] workflow-scrollbar overflow-auto">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            attributionPosition="hidden"
            style={{ background: themeStyles.background }}
            nodesDraggable={true}
            nodesConnectable={false}
            elementsSelectable={true}
            zoomOnScroll={true}
            panOnScroll={false}
            panOnDrag={true}
            onNodesChange={onNodesChange}
            onInit={(instance) => {
              reactFlowInstance.current = instance;
              instance.fitView({ padding: 0.2 });
            }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={12}
              size={1}
              color={theme === 'dark' ? '#374151' : '#e5e7eb'}
            />
            <Controls />
          </ReactFlow>
        </div>
      ) : (
        <div className="px-4 workflow-scrollbar" style={{ maxHeight: '800px', overflowY: 'auto' }}>
          <div className="relative" style={{ paddingLeft: lang === 'ar' ? 0 : '2rem', paddingRight: lang === 'ar' ? '2rem' : 0 }}>
            {/* Timeline line */}
            <div style={{
              position: 'absolute',
              [lang === 'ar' ? 'right' : 'left']: '0.5rem',
              top: 0,
              bottom: 0,
              width: 2,
              background: '#e5e7eb'
            }} />
            
            {workflowStages.map((stage, index) => {
              const historyEntry = document?.statusHistory?.find(h => h.toStatus === stage.status);
              const nextEntry = document?.statusHistory?.[document.statusHistory.findIndex(h => h.toStatus === stage.status) + 1];
              const actorName = historyEntry?.actor?.name || historyEntry?.actor?.firstName || '-';
              const entryDate = historyEntry?.createdAt ? new Date(historyEntry.createdAt).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';
              const duration = calculateDuration(historyEntry, nextEntry);
              const comment = historyEntry?.comment || '';
              const isCompleted = index < currentStageIndex;
              const isCurrent = index === currentStageIndex;
              
              return (
                <div key={stage.id} className="relative mb-3" style={{ [lang === 'ar' ? 'paddingRight' : 'paddingLeft']: '2rem' }}>
                  {/* Timeline dot */}
                  <div style={{
                    position: 'absolute',
                    [lang === 'ar' ? 'right' : 'left']: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: isCompleted ? '#10b981' : (isCurrent ? '#3b82f6' : '#d1d5db'),
                    border: '2px solid white',
                    boxShadow: isCurrent ? '0 0 0 4px rgba(59, 130, 246, 0.2)' : 'none',
                    animation: isCurrent ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none'
                  }} />
                  
                  {/* Timeline content */}
                  <div style={{
                    padding: '1rem',
                    background: 'var(--panel, white)',
                    border: `2px solid ${isCompleted ? '#10b981' : (isCurrent ? '#3b82f6' : '#e5e7eb')}`,
                    borderRadius: '0.5rem',
                    boxShadow: isCurrent ? '0 0 0 4px rgba(59, 130, 246, 0.1)' : 'none'
                  }}>
                    <div className="flex items-center gap-2 mb-2">
                      {getRoleIcon(workflowRules[stage.id]?.roles[lang])}
                      {stage.id === 'submitted' || stage.id === 'submit' ? (
                        <Send size={18} color={isCurrent ? '#3b82f6' : '#10b981'} />
                      ) : stage.id === 'draft' ? (
                        getThemedIcon('ui', 'file_text', 18, isCurrent ? '#3b82f6' : '#6b7280')
                      ) : isCompleted ? (
                        getThemedIcon('ui', 'check_circle', 18, '#10b981')
                      ) : isCurrent ? (
                        getThemedIcon('ui', 'clock', 18, '#3b82f6')
                      ) : (
                        getThemedIcon('ui', 'hourglass', 18, '#6b7280')
                      )}
                      <span className="font-bold text-base" style={{ color: isCompleted ? '#10b981' : (isCurrent ? '#3b82f6' : '#6b7280') }}>
                        {stage.label[lang]}
                      </span>
                      {historyEntry && (
                        <>
                          <span className="font-semibold text-sm" style={{ color: '#374151' }}>{actorName}</span>
                          <span className="text-xs" style={{ color: '#6b7280' }}>{entryDate}</span>
                        </>
                      )}
                      {duration && isCompleted && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ background: '#e0f2fe', color: '#0369a1' }}>
                          {duration}
                        </span>
                      )}
                    </div>

                    {historyEntry && comment && (
                      <div className="text-sm" style={{ color: '#374151' }}>
                        <div className="mt-1 p-2 rounded" style={{ background: '#f9fafb', fontStyle: 'italic', color: '#6b7280' }}>
                          "{comment}"
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'white',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          padding: '1rem'
        }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold" style={{ color: '#111827' }}>
              {t('workflow.diagram', 'Workflow Diagram')}
            </h2>
            <button
              onClick={() => setIsFullscreen(false)}
              style={{
                padding: '0.5rem',
                background: 'transparent',
                color: '#111827',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={20} />
            </button>
          </div>
          
          <div style={{ flex: 1, overflow: 'auto' }}>
            {viewMode === 'flow' ? (
              <div style={{ width: '100%', height: '100%' }}>
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  attributionPosition="hidden"
                  style={{ background: themeStyles.background, height: 'calc(100vh - 100px)' }}
                  nodesDraggable={true}
                  nodesConnectable={false}
                  elementsSelectable={true}
                  zoomOnScroll={true}
                  panOnScroll={false}
                  panOnDrag={true}
                  onNodesChange={onNodesChange}
                  onInit={(instance) => {
                    reactFlowInstance.current = instance;
                    instance.fitView({ padding: 0.2 });
                  }}
                >
                  <Background
                    variant={BackgroundVariant.Dots}
                    gap={12}
                    size={1}
                    color={theme === 'dark' ? '#374151' : '#e5e7eb'}
                  />
                  <Controls />
                </ReactFlow>
              </div>
            ) : (
              <div className="px-4" style={{ maxHeight: 'calc(100vh - 100px)', overflowY: 'auto' }}>
                <div className="relative" style={{ paddingLeft: lang === 'ar' ? 0 : '2rem', paddingRight: lang === 'ar' ? '2rem' : 0 }}>
                  {/* Timeline line */}
                  <div style={{
                    position: 'absolute',
                    [lang === 'ar' ? 'right' : 'left']: '0.5rem',
                    top: 0,
                    bottom: 0,
                    width: 2,
                    background: '#e5e7eb'
                  }} />
                  
                  {workflowStages.map((stage, index) => {
                    const isCompleted = index < currentStageIndex;
                    const isCurrent = index === currentStageIndex;
                    const historyEntry = statusHistory.find(h => h.toStatus === stage.status);
                    const nextEntry = statusHistory[statusHistory.findIndex(h => h.toStatus === stage.status) + 1];
                    
                    let actorName = historyEntry?.actor?.name || historyEntry?.actor?.firstName || '-';
                    let entryDate = historyEntry?.createdAt ? new Date(historyEntry.createdAt).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';
                    
                    if (stage.id === 'draft' && !historyEntry && document) {
                      actorName = document.owner?.name || document.owner?.firstName || '-';
                      entryDate = document.createdAt ? new Date(document.createdAt).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';
                    }
                    
                    const duration = calculateDuration(historyEntry, nextEntry);
                    const comment = historyEntry?.comment || '';
                    
                    return (
                      <div key={stage.id} className="relative mb-6" style={{ marginLeft: lang === 'ar' ? 0 : '2rem', marginRight: lang === 'ar' ? '2rem' : 0 }}>
                        {/* Timeline dot */}
                        <div style={{
                          position: 'absolute',
                          [lang === 'ar' ? 'right' : 'left']: 0,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          background: isCompleted ? '#10b981' : (isCurrent ? '#3b82f6' : '#d1d5db'),
                          border: '2px solid white',
                          boxShadow: isCurrent ? '0 0 0 4px rgba(59, 130, 246, 0.2)' : 'none',
                          animation: isCurrent ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none'
                        }} />
                        
                        {/* Timeline content */}
                        <div style={{
                          padding: '1rem',
                          background: 'white',
                          border: `2px solid ${isCompleted ? '#10b981' : (isCurrent ? '#3b82f6' : '#e5e7eb')}`,
                          borderRadius: '0.5rem',
                          boxShadow: isCurrent ? '0 0 0 4px rgba(59, 130, 246, 0.1)' : 'none'
                        }}>
                          <div className="flex items-center gap-2 mb-2">
                            {getRoleIcon(workflowRules[stage.id]?.roles[lang])}
                            {stage.id === 'submitted' || stage.id === 'submit' ? (
                              <Send size={18} color={isCurrent ? '#3b82f6' : '#10b981'} />
                            ) : stage.id === 'draft' ? (
                              getThemedIcon('ui', 'file_text', 18, isCurrent ? '#3b82f6' : '#6b7280')
                            ) : isCompleted ? (
                              getThemedIcon('ui', 'check_circle', 18, '#10b981')
                            ) : isCurrent ? (
                              getThemedIcon('ui', 'clock', 18, '#3b82f6')
                            ) : (
                              getThemedIcon('ui', 'hourglass', 18, '#6b7280')
                            )}
                            <span className="font-bold text-base" style={{ color: isCompleted ? '#10b981' : (isCurrent ? '#3b82f6' : '#6b7280') }}>
                              {stage.label[lang]}
                            </span>
                            {historyEntry && (
                              <>
                                <span className="font-semibold text-sm" style={{ color: '#374151' }}>{actorName}</span>
                                <span className="text-xs" style={{ color: '#6b7280' }}>{entryDate}</span>
                              </>
                            )}
                            {duration && isCompleted && (
                              <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ background: '#e0f2fe', color: '#0369a1' }}>
                                {duration}
                              </span>
                            )}
                          </div>

                          {historyEntry && comment && (
                            <div className="text-sm" style={{ color: '#374151' }}>
                              <div className="mt-1 p-2 rounded" style={{ background: '#f9fafb', fontStyle: 'italic', color: '#6b7280' }}>
                                "{comment}"
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const WorkflowDiagramMemo = React.memo(WorkflowDiagram);

export default WorkflowDiagramMemo;
