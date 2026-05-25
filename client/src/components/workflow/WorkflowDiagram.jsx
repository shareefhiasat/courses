import React, { useMemo, useState, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  MarkerType,
  BackgroundVariant
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useLang } from '../../contexts/LangContext';
import { useTheme } from '../../contexts/ThemeContext';

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
      transitions: { en: ['Under HR Review', 'Rejected'], ar: ['تحت مراجعة الموارد البشرية', 'مرفوض'] }
    },
    hr_review: {
      description: { en: 'HR reviewing attendance report', ar: 'مراجعة الموارد البشرية لتقرير الحضور' },
      roles: { en: 'HR', ar: 'الموارد البشرية' },
      transitions: { en: ['Final HR Review', 'Rejected'], ar: ['مراجعة الموارد البشرية النهائية', 'مرفوض'] }
    },
    final_hr_review: {
      description: { en: 'Final HR review before approval', ar: 'مراجعة الموارد البشرية النهائية قبل الموافقة' },
      roles: { en: 'HR Admin', ar: 'إدارة الموارد البشرية' },
      transitions: { en: ['Approved', 'Rejected'], ar: ['موافق عليه', 'مرفوض'] }
    },
    approved: {
      description: { en: 'Report approved and finalized', ar: 'تمت الموافقة على التقرير وإتمامه' },
      roles: { en: 'None', ar: 'لا يوجد' },
      transitions: { en: [], ar: [] }
    },
    rejected: {
      description: { en: 'Report rejected, needs revision', ar: 'تم رفض التقرير، يحتاج إلى مراجعة' },
      roles: { en: 'None', ar: 'لا يوجد' },
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
      transitions: { en: ['Under HR Review', 'Rejected'], ar: ['تحت مراجعة الموارد البشرية', 'مرفوض'] }
    },
    hr_review: {
      description: { en: 'HR reviewing weekly summary', ar: 'مراجعة الموارد البشرية للملخص الأسبوعي' },
      roles: { en: 'HR', ar: 'الموارد البشرية' },
      transitions: { en: ['Approved', 'Rejected'], ar: ['موافق عليه', 'مرفوض'] }
    },
    approved: {
      description: { en: 'Summary approved and finalized', ar: 'تمت الموافقة على الملخص وإتمامه' },
      roles: { en: 'None', ar: 'لا يوجد' },
      transitions: { en: [], ar: [] }
    },
    rejected: {
      description: { en: 'Summary rejected, needs revision', ar: 'تم رفض الملخص، يحتاج إلى مراجعة' },
      roles: { en: 'None', ar: 'لا يوجد' },
      transitions: { en: [], ar: [] }
    }
  }
};

// Define workflow stages outside component
const WORKFLOW_STAGES = {
  ATTENDANCE_REPORT: [
    { id: 'draft', label: { en: 'Draft', ar: 'مسودة' }, status: 'DRAFT' },
    { id: 'submitted', label: { en: 'Submitted', ar: 'مقدم' }, status: 'SUBMITTED' },
    { id: 'hr_review', label: { en: 'HR Review', ar: 'مراجعة الموارد البشرية' }, status: 'UNDER_HR_REVIEW' },
    { id: 'final_hr_review', label: { en: 'Final HR Review', ar: 'مراجعة الموارد البشرية النهائية' }, status: 'UNDER_FINAL_HR_REVIEW' },
    { id: 'approved', label: { en: 'Approved', ar: 'موافق عليه' }, status: 'APPROVED' },
    { id: 'rejected', label: { en: 'Rejected', ar: 'مرفوض' }, status: 'REJECTED' }
  ],
  WEEKLY_SUMMARY: [
    { id: 'draft', label: { en: 'Draft', ar: 'مسودة' }, status: 'DRAFT' },
    { id: 'submitted', label: { en: 'Submitted', ar: 'مقدم' }, status: 'SUBMITTED' },
    { id: 'hr_review', label: { en: 'HR Review', ar: 'مراجعة الموارد البشرية' }, status: 'UNDER_HR_REVIEW' },
    { id: 'approved', label: { en: 'Approved', ar: 'موافق عليه' }, status: 'APPROVED' },
    { id: 'rejected', label: { en: 'Rejected', ar: 'مرفوض' }, status: 'REJECTED' }
  ]
};

const WorkflowDiagram = ({ status, workflowType = 'ATTENDANCE_REPORT', onNodeClick }) => {
  const { lang } = useLang();
  const { theme } = useTheme();
  const [hoveredNode, setHoveredNode] = useState(null);

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
    const nodeWidth = 150;
    const nodeHeight = 60;
    const gap = 50;
    const startX = isRTL ? 800 : 50;
    const direction = isRTL ? -1 : 1;

    return workflowStages.map((stage, index) => {
      const x = startX + (index * (nodeWidth + gap) * direction);
      const y = 100;

      // Determine node style based on status
      let backgroundColor = '#e5e7eb';
      let borderColor = '#9ca3af';
      let textColor = '#374151';
      let icon = null;

      if (index < currentStageIndex) {
        // Completed
        backgroundColor = '#d1fae5';
        borderColor = '#10b981';
        textColor = '#065f46';
        icon = '✓';
      } else if (index === currentStageIndex) {
        // Current
        backgroundColor = '#dbeafe';
        borderColor = '#3b82f6';
        textColor = '#1e40af';
        icon = '●';
      } else {
        // Pending
        backgroundColor = '#f3f4f6';
        borderColor = '#d1d5db';
        textColor = '#6b7280';
      }

      // Rejected status
      if (stage.status === 'REJECTED' && status === 'REJECTED') {
        backgroundColor = '#fee2e2';
        borderColor = '#ef4444';
        textColor = '#991b1b';
        icon = '✗';
      }

      return {
        id: stage.id,
        position: { x, y },
        data: {
          label: (
            <div className="flex items-center gap-2">
              {icon && <span className="font-bold">{icon}</span>}
              <span className="font-medium">{stage.label[lang]}</span>
            </div>
          )
        },
        style: {
          backgroundColor,
          borderColor,
          color: textColor,
          borderWidth: 2,
          borderRadius: 8,
          padding: 10,
          width: nodeWidth,
          height: nodeHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          fontWeight: 500,
          cursor: 'pointer'
        }
      };
    });
  }, [workflowStages, currentStageIndex, status, lang]);

  // Generate edges
  const edges = useMemo(() => {
    const isRTL = lang === 'ar';
    const edges = [];

    for (let i = 0; i < workflowStages.length - 1; i++) {
      const source = workflowStages[i].id;
      const target = workflowStages[i + 1].id;

      // Skip edge to rejected if not rejected
      if (workflowStages[i + 1].status === 'REJECTED' && status !== 'REJECTED') {
        continue;
      }

      edges.push({
        id: `${source}-${target}`,
        source,
        target,
        type: 'smoothstep',
        animated: i === currentStageIndex - 1,
        style: {
          stroke: i < currentStageIndex ? '#10b981' : '#d1d5db',
          strokeWidth: 2
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: i < currentStageIndex ? '#10b981' : '#d1d5db'
        }
      });
    }

    return edges;
  }, [workflowStages, currentStageIndex, status, lang]);

  // Theme styles
  const themeStyles = useMemo(() => {
    if (theme === 'dark') {
      return {
        background: '#1f2937',
        textColor: '#f9fafb'
      };
    }
    return {
      background: '#ffffff',
      textColor: '#111827'
    };
  }, [theme]);

  return (
    <div className="w-full h-64 md:h-80 lg:h-96">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        attributionPosition="bottom-left"
        style={{ background: themeStyles.background }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
        zoomOnScroll={false}
        panOnScroll={false}
        onNodeClick={(event, node) => {
          if (onNodeClick) {
            onNodeClick(node);
          }
        }}
        onNodeMouseEnter={(event, node) => {
          setHoveredNode(node);
        }}
        onNodeMouseLeave={() => {
          setHoveredNode(null);
        }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={12}
          size={1}
          color={theme === 'dark' ? '#374151' : '#e5e7eb'}
        />
        <Controls
          style={{
            background: theme === 'dark' ? '#374151' : '#ffffff',
            color: themeStyles.textColor
          }}
        />
        <MiniMap
          style={{
            background: theme === 'dark' ? '#374151' : '#ffffff',
            color: themeStyles.textColor
          }}
          nodeColor={(node) => {
            if (node.style.borderColor === '#10b981') return '#10b981';
            if (node.style.borderColor === '#3b82f6') return '#3b82f6';
            if (node.style.borderColor === '#ef4444') return '#ef4444';
            return '#9ca3af';
          }}
        />
      </ReactFlow>

      {/* Tooltip */}
      {hoveredNode && workflowRules[hoveredNode.id] && (
        <div
          className="absolute z-50 p-4 rounded-lg shadow-lg max-w-xs"
          style={{
            background: theme === 'dark' ? '#374151' : '#ffffff',
            color: theme === 'dark' ? '#f9fafb' : '#111827',
            border: `1px solid ${theme === 'dark' ? '#4b5563' : '#e5e7eb'}`,
            top: hoveredNode.position.y + 80,
            left: hoveredNode.position.x + 50
          }}
        >
          <div className="space-y-2">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">
                {lang === 'ar' ? 'الوصف' : 'Description'}
              </p>
              <p className="text-sm">{workflowRules[hoveredNode.id].description[lang]}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">
                {lang === 'ar' ? 'الأدوار' : 'Roles'}
              </p>
              <p className="text-sm">{workflowRules[hoveredNode.id].roles[lang]}</p>
            </div>
            {workflowRules[hoveredNode.id].transitions[lang].length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">
                  {lang === 'ar' ? 'الانتقالات الممكنة' : 'Possible Transitions'}
                </p>
                <ul className="text-sm list-disc list-inside">
                  {workflowRules[hoveredNode.id].transitions[lang].map((transition, index) => (
                    <li key={index}>{transition}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowDiagram;
