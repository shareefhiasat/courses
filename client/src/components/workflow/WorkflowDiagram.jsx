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
import html2canvas from 'html2canvas';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { useAuth } from '@contexts/AuthContext';
import { getThemedIcon, getUserRoleIcon, getUserRoleColor } from '@constants/iconTypes';
import { Tooltip } from '@ui';
import { Send, RotateCcw, Download, Layout, Minimize, Maximize, X, Check, ArrowLeft, ArrowRight, Trash2, Eye, XCircle, List, GitBranch } from 'lucide-react';

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
  GENERAL_HR: {
    draft: {
      description: { en: 'Create and edit document', ar: 'إنشاء وتحرير المستند' },
      roles: { en: 'Owner', ar: 'المالك' },
      transitions: { en: ['Submitted'], ar: ['مقدم'] }
    },
    submitted: {
      description: { en: 'Document submitted for HR review', ar: 'تم تقديم المستند لمراجعة الموارد البشرية' },
      roles: { en: 'HR', ar: 'الموارد البشرية' },
      transitions: { en: ['HR Review'], ar: ['مراجعة الموارد البشرية'] }
    },
    hr_review: {
      description: { en: 'HR reviewing document', ar: 'مراجعة الموارد البشرية للمستند' },
      roles: { en: 'HR', ar: 'الموارد البشرية' },
      transitions: { en: ['Approved', 'Rejected'], ar: ['موافق عليه', 'مرفوض'] }
    },
    approved: {
      description: { en: 'Document approved and finalized', ar: 'تمت الموافقة على المستند وإتمامه' },
      roles: { en: 'None', ar: 'لا يوجد' },
      transitions: { en: [], ar: [] }
    },
    rejected: {
      description: { en: 'Document rejected', ar: 'تم رفض المستند' },
      roles: { en: 'Owner', ar: 'المالك' },
      transitions: { en: [], ar: [] }
    }
  },
  GENERAL_ADMIN: {
    draft: {
      description: { en: 'Create and edit document', ar: 'إنشاء وتحرير المستند' },
      roles: { en: 'Owner', ar: 'المالك' },
      transitions: { en: ['Submitted'], ar: ['مقدم'] }
    },
    submitted: {
      description: { en: 'Document submitted for Admin review', ar: 'تم تقديم المستند لمراجعة الإدارة' },
      roles: { en: 'Admin', ar: 'الإدارة' },
      transitions: { en: ['Admin Review'], ar: ['مراجعة الإدارة'] }
    },
    admin_review: {
      description: { en: 'Admin reviewing document', ar: 'مراجعة الإدارة للمستند' },
      roles: { en: 'Admin', ar: 'الإدارة' },
      transitions: { en: ['Approved', 'Rejected'], ar: ['موافق عليه', 'مرفوض'] }
    },
    approved: {
      description: { en: 'Document approved and finalized', ar: 'تمت الموافقة على المستند وإتمامه' },
      roles: { en: 'None', ar: 'لا يوجد' },
      transitions: { en: [], ar: [] }
    },
    rejected: {
      description: { en: 'Document rejected', ar: 'تم رفض المستند' },
      roles: { en: 'Owner', ar: 'المالك' },
      transitions: { en: [], ar: [] }
    }
  },
  GENERAL_MIXED_HR_ADMIN: {
    draft: {
      description: { en: 'Create and edit document', ar: 'إنشاء وتحرير المستند' },
      roles: { en: 'Owner', ar: 'المالك' },
      transitions: { en: ['Submitted'], ar: ['مقدم'] }
    },
    submitted: {
      description: { en: 'Document submitted for review', ar: 'تم تقديم المستند للمراجعة' },
      roles: { en: 'Owner', ar: 'المالك' },
      transitions: { en: ['HR Review'], ar: ['مراجعة الموارد البشرية'] }
    },
    hr_review: {
      description: { en: 'HR reviewing document', ar: 'مراجعة الموارد البشرية للمستند' },
      roles: { en: 'HR', ar: 'الموارد البشرية' },
      transitions: { en: ['Admin Review'], ar: ['مراجعة الإدارة'] }
    },
    admin_review: {
      description: { en: 'Admin reviewing document', ar: 'مراجعة الإدارة للمستند' },
      roles: { en: 'Admin', ar: 'الإدارة' },
      transitions: { en: ['Approved', 'Rejected'], ar: ['موافق عليه', 'مرفوض'] }
    },
    approved: {
      description: { en: 'Document approved and finalized', ar: 'تمت الموافقة على المستند وإتمامه' },
      roles: { en: 'None', ar: 'لا يوجد' },
      transitions: { en: [], ar: [] }
    },
    rejected: {
      description: { en: 'Document rejected', ar: 'تم رفض المستند' },
      roles: { en: 'Owner', ar: 'المالك' },
      transitions: { en: [], ar: [] }
    }
  },
  GENERAL_MIXED_ADMIN_HR: {
    draft: {
      description: { en: 'Create and edit document', ar: 'إنشاء وتحرير المستند' },
      roles: { en: 'Owner', ar: 'المالك' },
      transitions: { en: ['Submitted'], ar: ['مقدم'] }
    },
    submitted: {
      description: { en: 'Document submitted for review', ar: 'تم تقديم المستند للمراجعة' },
      roles: { en: 'Owner', ar: 'المالك' },
      transitions: { en: ['Admin Review'], ar: ['مراجعة الإدارة'] }
    },
    admin_review: {
      description: { en: 'Admin reviewing document', ar: 'مراجعة الإدارة للمستند' },
      roles: { en: 'Admin', ar: 'الإدارة' },
      transitions: { en: ['HR Review'], ar: ['مراجعة الموارد البشرية'] }
    },
    hr_review: {
      description: { en: 'HR reviewing document', ar: 'مراجعة الموارد البشرية للمستند' },
      roles: { en: 'HR', ar: 'الموارد البشرية' },
      transitions: { en: ['Approved', 'Rejected'], ar: ['موافق عليه', 'مرفوض'] }
    },
    approved: {
      description: { en: 'Document approved and finalized', ar: 'تمت الموافقة على المستند وإتمامه' },
      roles: { en: 'None', ar: 'لا يوجد' },
      transitions: { en: [], ar: [] }
    },
    rejected: {
      description: { en: 'Document rejected', ar: 'تم رفض المستند' },
      roles: { en: 'Owner', ar: 'المالك' },
      transitions: { en: [], ar: [] }
    }
  }
};

// Define workflow stages outside component
const WORKFLOW_STAGES = {
  GENERAL_HR: [
    { id: 'draft', label: { en: 'Draft', ar: 'مسودة' }, status: 'DRAFT' },
    { id: 'submitted', label: { en: 'Submitted', ar: 'مقدم' }, status: 'SUBMITTED' },
    { id: 'hr_review', label: { en: 'HR Review', ar: 'مراجعة الموارد البشرية' }, status: 'UNDER_HR_REVIEW' },
    { id: 'approved', label: { en: 'Approved', ar: 'موافق عليه' }, status: 'APPROVED' },
    { id: 'rejected', label: { en: 'Rejected', ar: 'مرفوض' }, status: 'REJECTED' }
  ],
  GENERAL_ADMIN: [
    { id: 'draft', label: { en: 'Draft', ar: 'مسودة' }, status: 'DRAFT' },
    { id: 'submitted', label: { en: 'Submitted', ar: 'مقدم' }, status: 'SUBMITTED' },
    { id: 'admin_review', label: { en: 'Admin Review', ar: 'مراجعة الإدارة' }, status: 'UNDER_ADMIN_REVIEW' },
    { id: 'approved', label: { en: 'Approved', ar: 'موافق عليه' }, status: 'APPROVED' },
    { id: 'rejected', label: { en: 'Rejected', ar: 'مرفوض' }, status: 'REJECTED' }
  ],
  GENERAL_MIXED_HR_ADMIN: [
    { id: 'draft', label: { en: 'Draft', ar: 'مسودة' }, status: 'DRAFT' },
    { id: 'submitted', label: { en: 'Submitted', ar: 'مقدم' }, status: 'SUBMITTED' },
    { id: 'hr_review', label: { en: 'HR Review', ar: 'مراجعة الموارد البشرية' }, status: 'UNDER_HR_REVIEW' },
    { id: 'admin_review', label: { en: 'Admin Review', ar: 'مراجعة الإدارة' }, status: 'UNDER_ADMIN_REVIEW' },
    { id: 'approved', label: { en: 'Approved', ar: 'موافق عليه' }, status: 'APPROVED' },
    { id: 'rejected', label: { en: 'Rejected', ar: 'مرفوض' }, status: 'REJECTED' }
  ],
  GENERAL_MIXED_ADMIN_HR: [
    { id: 'draft', label: { en: 'Draft', ar: 'مسودة' }, status: 'DRAFT' },
    { id: 'submitted', label: { en: 'Submitted', ar: 'مقدم' }, status: 'SUBMITTED' },
    { id: 'admin_review', label: { en: 'Admin Review', ar: 'مراجعة الإدارة' }, status: 'UNDER_ADMIN_REVIEW' },
    { id: 'hr_review', label: { en: 'HR Review', ar: 'مراجعة الموارد البشرية' }, status: 'UNDER_HR_REVIEW' },
    { id: 'approved', label: { en: 'Approved', ar: 'موافق عليه' }, status: 'APPROVED' },
    { id: 'rejected', label: { en: 'Rejected', ar: 'مرفوض' }, status: 'REJECTED' }
  ]
};

const WorkflowDiagram = ({ status, workflowType = 'GENERAL_HR', document, currentAssignee, onApprove, onReturn, onReject, onSubmit, onSendToNext, onDelete, onRefresh }) => {
  const { lang, t } = useLang();
  const { theme } = useTheme();
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState('flow'); // 'flow' or 'timeline'
  const [layoutMode, setLayoutMode] = useState('default'); // 'default', 'hierarchical', 'compact'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const reactFlowInstance = useRef(null);
  const [nodes, setNodes] = useState([]);
  
  // Helper to get all role codes from user object
  const getUserRoleCodes = useCallback((user) => {
    if (!user) return [];
    
    const roleCodes = [];
    
    // Check for roleAssignments array (database format)
    if (user.roleAssignments && Array.isArray(user.roleAssignments)) {
      user.roleAssignments.forEach(ra => {
        if (ra.role?.code) {
          roleCodes.push(ra.role.code.toLowerCase());
        }
      });
    }
    
    // Check for roles array (Keycloak format)
    if (user.roles && Array.isArray(user.roles)) {
      user.roles.forEach(role => {
        if (typeof role === 'string') {
          roleCodes.push(role.toLowerCase());
        } else if (role?.code) {
          roleCodes.push(role.code.toLowerCase());
        }
      });
    }
    
    // Check for single role string
    if (user.role && typeof user.role === 'string') {
      roleCodes.push(user.role.toLowerCase());
    }
    
    return roleCodes;
  }, []);

  const userRoleCodes = getUserRoleCodes(user);

  // Check user roles
  const isSuperAdmin = userRoleCodes.some(code => 
    code.includes('super_admin') || code.includes('superadmin')
  );
  const isHR = userRoleCodes.some(code => 
    code.includes('hr') || code.includes('موارد')
  );
  const isAdmin = userRoleCodes.some(code => 
    code.includes('admin') || code.includes('إدارة')
  );
  const isInstructor = userRoleCodes.some(code => 
    code.includes('instructor') || code.includes('معلم')
  );
  const isDocumentOwner = document?.ownerId === user?.dbId || document?.submitterId === user?.dbId;
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      window.document.addEventListener('click', handleClick);
      return () => window.document.removeEventListener('click', handleClick);
    }
  }, [contextMenu]);

  // Export diagram as image
  const handleExport = useCallback(() => {
    if (reactFlowInstance.current) {
      reactFlowInstance.current.fitView({ padding: 0.2 });
      setTimeout(async () => {
        const element = window.document.querySelector('.react-flow');
        if (element) {
          try {
            const canvas = await html2canvas(element, {
              backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
              scale: 2 // Higher quality
            });
            const url = canvas.toDataURL('image/png');
            const link = window.document.createElement('a');
            link.href = url;
            link.download = `workflow-diagram-${document?.id || 'export'}.png`;
            link.click();
          } catch (error) {
            console.error('Export failed:', error);
          }
        }
      }, 100);
    }
  }, [document?.id, theme]);

  // Handle node right-click
  const onNodeContextMenu = useCallback((event, node) => {
    event.preventDefault();
    setSelectedNode(node);
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      type: 'node',
      node
    });
  }, []);

  // Handle background right-click
  const onPaneContextMenu = useCallback((event) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      type: 'background'
    });
  }, []);

  // Handle context menu actions
  const handleContextMenuAction = useCallback((action) => {
    setContextMenu(null);
    
    if (contextMenu?.type === 'node' && selectedNode) {
      switch (action) {
        case 'approve':
          if (onApprove) {
            onApprove();
            // Force refresh after action to ensure diagram updates
            if (onRefresh) setTimeout(() => onRefresh(), 100);
          }
          break;
        case 'return':
          if (onReturn) {
            onReturn();
            // Force refresh after action to ensure diagram updates
            if (onRefresh) setTimeout(() => onRefresh(), 100);
          }
          break;
        case 'submit':
          if (onSubmit) {
            onSubmit();
            // Force refresh after action to ensure diagram updates
            if (onRefresh) setTimeout(() => onRefresh(), 100);
          }
          break;
        case 'sendToNext':
          if (onSendToNext) {
            onSendToNext();
            // Force refresh after action to ensure diagram updates
            if (onRefresh) setTimeout(() => onRefresh(), 100);
          }
          break;
        case 'delete':
          if (onDelete) {
            onDelete();
            // Force refresh after action to ensure diagram updates
            if (onRefresh) setTimeout(() => onRefresh(), 100);
          }
          break;
        case 'viewDetails':
          // TODO: Open modal with stage details
          break;
      }
    } else if (contextMenu?.type === 'background') {
      switch (action) {
        case 'reject':
          if (onReject) {
            onReject();
            // Force refresh after action to ensure diagram updates
            if (onRefresh) setTimeout(() => onRefresh(), 100);
          }
          break;
        case 'refresh':
          if (onRefresh) onRefresh();
          break;
        case 'export':
          handleExport();
          break;
      }
    }
  }, [contextMenu, selectedNode, onApprove, onReturn, onReject, onSubmit, onDelete, onRefresh, handleExport]);

  // Check if action should be disabled based on document status, node state, and user role
  const isActionDisabled = useCallback((action, node) => {
    const isTerminal = status === 'APPROVED' || status === 'REJECTED';
    
    if (contextMenu?.type === 'node' && node) {
      // Node actions
      if (action === 'approve') {
        // Only HR or Admin can approve, and only on current stage (hr_review or admin_review)
        const canApprove = isHR || isAdmin || isSuperAdmin;
        const isReviewStage = node.data.stageId === 'hr_review' || node.data.stageId === 'admin_review';
        return !canApprove || !node.data.isCurrent || !isReviewStage || isTerminal;
      }
      if (action === 'return') {
        // Any participant can return from current stage
        return !node.data.isCurrent || isTerminal;
      }
      if (action === 'submit') {
        // Only document owner can submit from draft
        // Allow submit from draft even if document was returned to draft
        return !isDocumentOwner || node.data.stageId !== 'draft' || isTerminal;
      }
      if (action === 'sendToNext') {
        // Only document owner can send to next step from submitted
        return !isDocumentOwner || node.data.stageId !== 'submitted' || status !== 'SUBMITTED' || isTerminal;
      }
      if (action === 'delete') {
        // Only document owner can withdraw from draft
        return !isDocumentOwner || node.data.stageId !== 'draft' || isTerminal;
      }
    } else if (contextMenu?.type === 'background') {
      // Background actions
      if (action === 'reject') {
        // Only HR or Admin can reject, and not in terminal state
        const canReject = isHR || isAdmin || isSuperAdmin;
        return !canReject || isTerminal;
      }
    }
    return false;
  }, [contextMenu, status, isHR, isAdmin, isSuperAdmin, isDocumentOwner]);

  // Check if context menu has any available actions
  const hasAvailableActions = useCallback(() => {
    if (contextMenu?.type === 'node' && selectedNode) {
      const hasApprove = !isActionDisabled('approve', selectedNode) && (isHR || isAdmin || isSuperAdmin);
      const hasReturn = !isActionDisabled('return', selectedNode);
      const hasSubmit = !isActionDisabled('submit', selectedNode) && isDocumentOwner && status === 'DRAFT';
      const hasDelete = !isActionDisabled('delete', selectedNode) && isDocumentOwner;
      return hasApprove || hasReturn || hasSubmit || hasDelete;
    } else if (contextMenu?.type === 'background') {
      const hasReject = !isActionDisabled('reject', null) && (isHR || isAdmin || isSuperAdmin);
      const hasRefresh = true; // Refresh is always available
      const hasExport = true; // Export is always available
      return hasReject || hasRefresh || hasExport;
    }
    return false;
  }, [contextMenu, selectedNode, isActionDisabled, isHR, isAdmin, isSuperAdmin, isDocumentOwner, status]);

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
  const workflowRules = WORKFLOW_RULES[workflowType] || WORKFLOW_RULES.GENERAL_HR;
  const workflowStages = WORKFLOW_STAGES[workflowType] || WORKFLOW_STAGES.GENERAL_HR;

  // Determine current stage index (must be before progressPercentage)
  const currentStageIndex = useMemo(() => {
    // Directly match the current status to the stage
    return workflowStages.findIndex(stage => stage.status === status);
  }, [workflowStages, status]);

  // Calculate progress percentage
  const progressPercentage = useMemo(() => {
    if (currentStageIndex === -1) return 0;
    // If status is APPROVED or REJECTED, show 100% as it's a terminal state
    if (status === 'APPROVED' || status === 'REJECTED') return 100;
    return Math.round((currentStageIndex / (workflowStages.length - 1)) * 100);
  }, [currentStageIndex, workflowStages.length, status]);

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
    let nodeWidth = 180;
    let nodeHeight = 110;
    let ranksep = 100;
    let nodesep = 100;

    // Adjust based on layout mode
    if (layoutMode === 'compact') {
      nodeWidth = 150;
      nodeHeight = 95;
      ranksep = 50;
      nodesep = 50;
    } else if (layoutMode === 'hierarchical') {
      nodeWidth = 200;
      nodeHeight = 130;
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
    const nodeHeight = 100;

    // Get status history for dates and actors
    const statusHistory = document?.statusHistory || [];

    const generatedNodes = workflowStages.map((stage, index) => {

      // Determine node style based on status
      let backgroundColor = '#f9fafb';
      let borderColor = '#9ca3af';
      let textColor = '#111827';

      // Special case: submitted stage should be green when document is in review or beyond
      const isSubmittedCompleted = stage.status === 'SUBMITTED' && 
        (status === 'UNDER_HR_REVIEW' || status === 'UNDER_ADMIN_REVIEW' || status === 'APPROVED' || status === 'REJECTED');

      if (isSubmittedCompleted || index < currentStageIndex) {
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
      // The comment is stored in the history entry where we transitioned TO this stage
      const historyEntry = statusHistory.find(h => h.toStatus === stage.status);
      const nextEntry = statusHistory[statusHistory.findIndex(h => h.fromStatus === stage.status) + 1];
      
      // For draft stage, use document owner and creation date if no history entry
      let actorName = historyEntry?.actor?.name || historyEntry?.actor?.firstName || '-';
      let entryDate = historyEntry?.createdAt ? new Date(historyEntry.createdAt).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';
      let actorRole = historyEntry?.actor?.role || workflowRules[stage.id]?.roles[lang];
      
      if (stage.id === 'draft' && !historyEntry && document) {
        actorName = document.submitter?.name || document.submitter?.firstName || '-';
        entryDate = document.createdAt ? new Date(document.createdAt).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';
        actorRole = document.submitter?.role || workflowRules[stage.id]?.roles[lang];
      }
      
      const duration = calculateDuration(historyEntry, nextEntry);
      const comment = historyEntry?.reason || '';
      const description = workflowRules[stage.id]?.description[lang] || '';

      console.log('[WorkflowDiagram] Node data for stage:', stage.id, 'comment:', comment);

      // Get status-specific icon and color from workflow inbox filter definitions
      const getStatusIcon = (stageId) => {
        const statusMap = {
          'draft': { icon: 'file_text', color: '#6b7280' },
          'submitted': { icon: 'send', color: '#3b82f6' },
          'submit': { icon: 'send', color: '#3b82f6' },
          'hr_review': { icon: 'alert_triangle', color: '#8b5cf6' },
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
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {getRoleIcon(actorRole)}
                    {getThemedIcon('ui', statusIcon.icon, 16, statusIcon.color)}
                    <span className="font-bold text-xs" style={{ color: borderColor, whiteSpace: 'nowrap' }}>{stage.label[lang]}</span>
                  </div>
                  {duration && (
                    <span className="text-xs font-medium px-1 py-0.5 rounded" style={{ background: '#e0f2fe', color: '#0369a1' }}>
                      {duration}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-0.5 mt-auto">
                <div className="text-xs font-semibold" style={{ color: '#111827' }}>
                  {actorName}
                </div>
                <div className="text-xs" style={{ color: '#6b7280' }}>
                  {entryDate}
                </div>
                {comment && (
                  <div className="text-xs italic mt-0.5" style={{ color: '#6b7280', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={comment}>
                    {comment}
                  </div>
                )}
              </div>
            </div>
          ),
          comment,
          stage,
          stageId: stage.id,
          isCurrent: index === currentStageIndex,
          isCompleted: index < currentStageIndex
        },
        style: {
          backgroundColor,
          borderColor,
          color: textColor,
          borderWidth: 3,
          borderRadius: 12,
          padding: 12,
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
          // Skip edges to REJECTED node since reject can be done at any time
          if (targetStage.id === 'rejected') {
            return;
          }
          
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

        {/* View mode toggle and fullscreen */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'flow' ? 'timeline' : 'flow')}
            style={{
              padding: '0.5rem',
              background: 'var(--panel, white)',
              border: '1px solid var(--border, #e5e7eb)',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              color: 'var(--text, #111827)'
            }}
            title={viewMode === 'flow' ? t('workflow.viewTimeline', 'View as Timeline') : t('workflow.viewFlow', 'View as Flow')}
          >
            {viewMode === 'flow' ? <List size={16} /> : <GitBranch size={16} />}
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            style={{
              padding: '0.5rem',
              background: 'var(--panel, white)',
              border: '1px solid var(--border, #e5e7eb)',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              color: 'var(--text, #111827)'
            }}
            title={isFullscreen ? t('common.exitFullscreen', 'Exit Fullscreen') : t('common.fullscreen', 'Fullscreen')}
          >
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>
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
            onNodeContextMenu={onNodeContextMenu}
            onPaneContextMenu={onPaneContextMenu}
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
              const comment = historyEntry?.reason || '';
              const isCompleted = index < currentStageIndex;
              const isCurrent = index === currentStageIndex;
              
              return (
                <div key={stage.id} className="relative mb-4" style={{ [lang === 'ar' ? 'paddingRight' : 'paddingLeft']: '2rem' }}>
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
                    boxShadow: isCurrent ? '0 0 0 4px rgba(59, 130, 246, 0.1)' : 'none',
                    marginBottom: '0.5rem'
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
                          {comment}
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
                            <Tooltip content={comment} placement="top">
                              <div className="text-sm" style={{ color: '#374151', cursor: 'help' }}>
                                <div className="mt-1 p-2 rounded" style={{ background: '#f9fafb', fontStyle: 'italic', color: '#6b7280' }}>
                                  "{comment.substring(0, 50)}{comment.length > 50 ? '...' : ''}"
                                </div>
                              </div>
                            </Tooltip>
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
      
      {/* Context Menu */}
      {contextMenu && hasAvailableActions() && (
        <div
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            zIndex: 1000,
            background: 'var(--panel, white)',
            border: '1px solid var(--border, #e5e7eb)',
            borderRadius: '0.5rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            minWidth: '180px',
            padding: '0.5rem 0'
          }}
        >
          {contextMenu.type === 'node' && selectedNode ? (
            <>
              {console.log('[WorkflowDiagram] Context menu opened for node:', selectedNode.data.stageId, 'comment:', selectedNode.data.comment)}
              {/* Show transition comment if exists */}
              {selectedNode.data.comment && (
                <>
                  <div style={{
                    padding: '0.5rem 1rem',
                    borderBottom: '1px solid var(--border, #e5e7eb)',
                    marginBottom: '0.5rem',
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary, #6b7280)',
                    fontStyle: 'italic'
                  }}>
                    {selectedNode.data.comment}
                  </div>
                </>
              )}
              {/* Node context menu - stage-specific actions */}
              {selectedNode.data.isCurrent && selectedNode.data.stageId !== 'draft' && selectedNode.data.stageId !== 'submitted' && (isHR || isAdmin || isSuperAdmin) && (
                <>
                  <button
                    onClick={() => handleContextMenuAction('approve')}
                    disabled={isActionDisabled('approve', selectedNode)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      background: 'none',
                      border: 'none',
                      cursor: isActionDisabled('approve', selectedNode) ? 'not-allowed' : 'pointer',
                      color: isActionDisabled('approve', selectedNode) ? '#9ca3af' : '#111827',
                      opacity: isActionDisabled('approve', selectedNode) ? 0.5 : 1
                    }}
                  >
                    <Check size={16} color={isActionDisabled('approve', selectedNode) ? '#9ca3af' : '#10b981'} />
                    {t('workflow.approve', 'Approve')}
                  </button>
                </>
              )}
              {selectedNode.data.stageId === 'submitted' && isDocumentOwner && status === 'SUBMITTED' && (
                <button
                  onClick={() => handleContextMenuAction('sendToNext')}
                  disabled={isActionDisabled('sendToNext', selectedNode)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'none',
                    border: 'none',
                    cursor: isActionDisabled('sendToNext', selectedNode) ? 'not-allowed' : 'pointer',
                    color: isActionDisabled('sendToNext', selectedNode) ? '#9ca3af' : '#111827',
                    opacity: isActionDisabled('sendToNext', selectedNode) ? 0.5 : 1
                  }}
                >
                  <ArrowRight size={16} color={isActionDisabled('sendToNext', selectedNode) ? '#9ca3af' : '#3b82f6'} />
                  {t('workflow.sendToNext', 'Send to Next Step')}
                </button>
              )}
              {selectedNode.data.isCurrent && selectedNode.data.stageId !== 'draft' && (
                <button
                  onClick={() => handleContextMenuAction('return')}
                  disabled={isActionDisabled('return', selectedNode)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'none',
                    border: 'none',
                    cursor: isActionDisabled('return', selectedNode) ? 'not-allowed' : 'pointer',
                    color: isActionDisabled('return', selectedNode) ? '#9ca3af' : '#111827',
                    opacity: isActionDisabled('return', selectedNode) ? 0.5 : 1
                  }}
                >
                  <ArrowLeft size={16} color={isActionDisabled('return', selectedNode) ? '#9ca3af' : '#f59e0b'} />
                  {t('workflow.return', 'Return to Previous')}
                </button>
              )}
              {selectedNode.data.stageId === 'draft' && isDocumentOwner && status === 'DRAFT' && (
                <>
                  <button
                    onClick={() => handleContextMenuAction('submit')}
                    disabled={isActionDisabled('submit', selectedNode)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      background: 'none',
                      border: 'none',
                      cursor: isActionDisabled('submit', selectedNode) ? 'not-allowed' : 'pointer',
                      color: isActionDisabled('submit', selectedNode) ? '#9ca3af' : '#111827',
                      opacity: isActionDisabled('submit', selectedNode) ? 0.5 : 1
                    }}
                  >
                    <Send size={16} color={isActionDisabled('submit', selectedNode) ? '#9ca3af' : '#3b82f6'} />
                    {t('workflow.submit', 'Submit')}
                  </button>
                </>
              )}
            </>
          ) : (
            <>
              {/* Background context menu - document-level actions */}
              {(isHR || isAdmin || isSuperAdmin) && (
                <button
                  onClick={() => handleContextMenuAction('reject')}
                  disabled={isActionDisabled('reject', null)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'none',
                    border: 'none',
                    cursor: isActionDisabled('reject', null) ? 'not-allowed' : 'pointer',
                    color: isActionDisabled('reject', null) ? '#9ca3af' : '#dc2626',
                    opacity: isActionDisabled('reject', null) ? 0.5 : 1
                  }}
                >
                  <XCircle size={16} />
                  {t('workflow.reject', 'Reject')}
                </button>
              )}
              <button
                onClick={() => handleContextMenuAction('refresh')}
                style={{
                  width: '100%',
                  padding: '0.5rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#111827'
                }}
              >
                <RotateCcw size={16} />
                {t('workflow.refresh', 'Refresh')}
              </button>
              <button
                onClick={() => handleContextMenuAction('export')}
                style={{
                  width: '100%',
                  padding: '0.5rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#111827'
                }}
              >
                <Download size={16} />
                {t('workflow.export', 'Export')}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const WorkflowDiagramMemo = React.memo(WorkflowDiagram);

export default WorkflowDiagramMemo;
