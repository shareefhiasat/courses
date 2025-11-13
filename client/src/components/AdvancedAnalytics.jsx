import React, { useState, useEffect, useMemo, useRef } from 'react';
import { collection, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import BarChart from './charts/BarChart';
import LineChart from './charts/LineChart';
import PieChart from './charts/PieChart';
import AreaChart from './charts/AreaChart';
import { Plus, X, Download, Filter, BarChart3, LineChart as LineIcon, PieChart as PieIcon, TrendingUp, Save, Trash2, GripVertical } from 'lucide-react';
import GridLayout, { WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';

const ResponsiveGrid = WidthProvider(GridLayout);

// Measure available width/height and pass to a render-prop child
function ChartSizer({ children }) {
  const ref = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0].contentRect;
      setSize({ width: cr.width, height: cr.height });
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ flex: 1, minHeight: 0, width: '100%', height: '100%' }}>
      {typeof children === 'function' ? children(size) : null}
    </div>
  );
}

/**
 * Advanced Analytics with Drag-Drop Chart Builder
 * ClickUp-style dynamic dashboard
 */
export default function AdvancedAnalytics() {
  const { t } = useLang();
  const { user, isAdmin } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [permErrors, setPermErrors] = useState({});
  const [rawData, setRawData] = useState({
    activities: [],
    submissions: [],
    users: [],
    classes: [],
    attendance: [],
    activityLogs: [],
    enrollments: []
  });
  const [globalFilters, setGlobalFilters] = useState({ classId: '', term: '', year: '' });
  
  const [widgets, setWidgets] = useState([]);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingWidget, setEditingWidget] = useState(null);
  const [editLayout, setEditLayout] = useState(false);
  const [autoRefreshMs, setAutoRefreshMs] = useState(0);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(Date.now());
  const [nowTick, setNowTick] = useState(Date.now());
  const [widgetLoading, setWidgetLoading] = useState({});
  const [widgetUpdatedAt, setWidgetUpdatedAt] = useState({});
  const [recentlyRefreshed, setRecentlyRefreshed] = useState({});
  const [toasts, setToasts] = useState([]);
  
  // Widget builder state
  const [widgetConfig, setWidgetConfig] = useState({
    title: '',
    chartType: 'bar',
    dataSource: 'submissions',
    groupBy: 'status',
    aggregation: 'count',
    filters: [],
    dateRange: 'all',
    customDateFrom: '',
    customDateTo: '',
    comparisonMode: false,
    comparisonPeriod: 'previous'
  });
  
  const [drillDownData, setDrillDownData] = useState(null);
  const [showDrillDown, setShowDrillDown] = useState(false);

  useEffect(() => {
    loadAllData();
    loadSavedWidgets();
  }, []);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefreshMs) return;
    const id = setInterval(() => loadAllData(), autoRefreshMs);
    return () => clearInterval(id);
  }, [autoRefreshMs]);

  // Progress ticker for auto refresh bar
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const errors = {};
      const next = { activities: [], submissions: [], users: [], classes: [], attendance: [], activityLogs: [], enrollments: [] };

      const safeLoad = async (key, loader) => {
        try {
          const snap = await loader();
          next[key] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch (e) {
          const code = e && (e.code || e.message || '').toString();
          if (code.includes('permission-denied')) errors[key] = 'permission-denied';
          console.warn(`Analytics: failed to load ${key}:`, e);
        }
      };

      await Promise.all([
        safeLoad('activities', () => getDocs(collection(db, 'activities'))),
        safeLoad('submissions', () => getDocs(collection(db, 'submissions'))),
        safeLoad('users', () => getDocs(collection(db, 'users'))),
        safeLoad('classes', () => getDocs(collection(db, 'classes'))),
        safeLoad('attendance', () => getDocs(collection(db, 'attendanceSessions'))),
        safeLoad('activityLogs', () => getDocs(query(collection(db, 'activityLogs'), orderBy('when', 'desc')))),
        safeLoad('enrollments', () => getDocs(collection(db, 'enrollments')))
      ]);

      setRawData(next);
      setPermErrors(errors);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setLoading(false);
      setLastUpdatedAt(Date.now());
    }
  };

  const pushToast = (msg) => {
    const id = Math.random().toString(36).slice(2, 8);
    setToasts((t)=> [...t, { id, msg }]);
    setTimeout(()=> setToasts((t)=> t.filter(x=>x.id!==id)), 2500);
  };

  const refreshWidget = async (id) => {
    setWidgetLoading((m)=> ({ ...m, [id]: true }));
    await loadAllData();
    setWidgetLoading((m)=> ({ ...m, [id]: false }));
    setWidgetUpdatedAt((m)=> ({ ...m, [id]: Date.now() }));
    setRecentlyRefreshed((m)=> ({ ...m, [id]: true }));
    setTimeout(()=> setRecentlyRefreshed((m)=> ({ ...m, [id]: false })), 1200);
    pushToast('Data up to date');
  };

  const loadSavedWidgets = () => {
    try {
      const saved = localStorage.getItem('analytics_widgets');
      if (saved) {
        setWidgets(JSON.parse(saved));
      } else {
        // Default widgets
        setWidgets([
          { id: 'w1', title: 'Submissions by Status', chartType: 'pie', dataSource: 'submissions', groupBy: 'status', aggregation: 'count' },
          { id: 'w2', title: 'Activity Types', chartType: 'bar', dataSource: 'activities', groupBy: 'type', aggregation: 'count' },
          { id: 'w3', title: 'User Activity Trend', chartType: 'line', dataSource: 'activityLogs', groupBy: 'date', aggregation: 'count', dateRange: 'last30' }
        ]);
      }
    } catch (e) {
      console.warn('Failed to load saved widgets:', e);
    }
  };

  const saveWidgets = () => {
    try {
      localStorage.setItem('analytics_widgets', JSON.stringify(widgets));
    } catch (e) {
      console.warn('Failed to save widgets:', e);
    }
  };

  const setWidgetsAndSave = (next) => {
    setWidgets(next);
    try { localStorage.setItem('analytics_widgets', JSON.stringify(next)); } catch {}
  };

  const processWidgetData = (widget, comparisonOffset = 0) => {
    const { dataSource, groupBy, aggregation, filters = [], dateRange, comparisonMode, comparisonPeriod } = widget;
    let dataset = rawData[dataSource] || [];

    // Apply global filters first (if present on items)
    if (globalFilters.classId) dataset = dataset.filter(i => (i.classId || i.class || i.class_id) === globalFilters.classId);
    if (globalFilters.term) dataset = dataset.filter(i => (i.term || i.sessionTerm) === globalFilters.term);
    if (globalFilters.year) dataset = dataset.filter(i => String(i.year || i.academicYear) === String(globalFilters.year));
    if (globalFilters.semester) dataset = dataset.filter(i => (i.semester || i.sessionSemester) === globalFilters.semester);

    // Apply filters
    filters.forEach(filter => {
      if (filter.field && filter.operator && filter.value !== undefined) {
        dataset = dataset.filter(item => {
          const fieldValue = item[filter.field];
          switch (filter.operator) {
            case 'equals': return fieldValue === filter.value;
            case 'contains': return String(fieldValue).toLowerCase().includes(String(filter.value).toLowerCase());
            case 'greater': return fieldValue > filter.value;
            case 'less': return fieldValue < filter.value;
            default: return true;
          }
        });
      }
    });

    // Apply date range with comparison offset
    if (dateRange && dateRange !== 'all') {
      const now = Date.now();
      const ranges = {
        today: 24 * 60 * 60 * 1000,
        last7: 7 * 24 * 60 * 60 * 1000,
        last30: 30 * 24 * 60 * 60 * 1000,
        last90: 90 * 24 * 60 * 60 * 1000
      };
      const rangeMs = ranges[dateRange] || 0;
      const cutoff = now - rangeMs - (comparisonOffset * rangeMs);
      const upperBound = comparisonOffset > 0 ? now - (comparisonOffset * rangeMs) : now;
      
      dataset = dataset.filter(item => {
        const timestamp = item.when?.seconds ? item.when.seconds * 1000 : 
                         item.createdAt?.seconds ? item.createdAt.seconds * 1000 :
                         item.submittedAt?.seconds ? item.submittedAt.seconds * 1000 : 0;
        return timestamp >= cutoff && timestamp < upperBound;
      });
    }

    // Group and aggregate
    const grouped = {};
    
    if (groupBy === 'date') {
      // Time series grouping
      dataset.forEach(item => {
        const timestamp = item.when?.seconds ? item.when.seconds * 1000 : 
                         item.createdAt?.seconds ? item.createdAt.seconds * 1000 :
                         item.submittedAt?.seconds ? item.submittedAt.seconds * 1000 : 0;
        if (timestamp) {
          const date = new Date(timestamp).toLocaleDateString('en-GB');
          grouped[date] = (grouped[date] || 0) + 1;
        }
      });
    } else {
      // Field grouping
      dataset.forEach(item => {
        const key = item[groupBy] || 'Unknown';
        const value = parseFloat(item.score || item.value || item.grade || 0);
        
        if (aggregation === 'count') {
          grouped[key] = (grouped[key] || 0) + 1;
        } else if (aggregation === 'sum') {
          grouped[key] = (grouped[key] || 0) + value;
        } else if (aggregation === 'avg') {
          if (!grouped[key]) grouped[key] = { sum: 0, count: 0 };
          grouped[key].sum += value;
          grouped[key].count += 1;
        } else if (aggregation === 'min') {
          grouped[key] = grouped[key] === undefined ? value : Math.min(grouped[key], value);
        } else if (aggregation === 'max') {
          grouped[key] = grouped[key] === undefined ? value : Math.max(grouped[key], value);
        } else if (aggregation === 'median') {
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(value);
        }
      });
    }

    // Convert to chart data
    let chartData = Object.entries(grouped).map(([label, value]) => {
      let finalValue = value;
      if (aggregation === 'avg') {
        finalValue = value.sum / value.count;
      } else if (aggregation === 'median') {
        const sorted = value.sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        finalValue = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
      }
      return { label, value: finalValue };
    });

    // Sort by value descending
    chartData.sort((a, b) => b.value - a.value);

    return chartData;
  };

  const addWidget = () => {
    const newWidget = {
      id: 'w' + Date.now(),
      w: 6,
      ...widgetConfig
    };
    setWidgetsAndSave([...widgets, newWidget]);
    setShowBuilder(false);
    resetBuilder();
  };

  const updateWidget = () => {
    setWidgetsAndSave(widgets.map(w => w.id === editingWidget.id ? { ...editingWidget, ...widgetConfig } : w));
    setShowBuilder(false);
    setEditingWidget(null);
    resetBuilder();
  };

  const deleteWidget = (id) => {
    setWidgetsAndSave(widgets.filter(w => w.id !== id));
  };

  // React-grid-layout handler
  const onLayoutChange = (newLayout) => {
    if (!editLayout) return; // Only update when in edit mode
    
    // Map layout back to widgets with updated positions and sizes
    const updatedWidgets = widgets.map(widget => {
      const layoutItem = newLayout.find(l => l.i === widget.id);
      if (layoutItem) {
        return {
          ...widget,
          x: layoutItem.x,
          y: layoutItem.y,
          w: layoutItem.w,
          h: layoutItem.h
        };
      }
      return widget;
    });
    
    setWidgetsAndSave(updatedWidgets);
  };

  const resetBuilder = () => {
    setWidgetConfig({
      title: '',
      chartType: 'bar',
      dataSource: 'submissions',
      groupBy: 'status',
      aggregation: 'count',
      filters: [],
      dateRange: 'all'
    });
  };

  const exportData = () => {
    const csv = widgets.map(w => {
      const data = processWidgetData(w);
      return `\n${w.title}\n${data.map(d => `${d.label},${d.value}`).join('\n')}`;
    }).join('\n\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleChartClick = (widget, dataPoint) => {
    // Drill down into the clicked segment
    const { dataSource, groupBy } = widget;
    const filtered = rawData[dataSource].filter(item => (item[groupBy] || 'Unknown') === dataPoint.label);
    setDrillDownData({ widget, dataPoint, items: filtered });
    setShowDrillDown(true);
  };

  const renderChart = (widget, size) => {
    const data = processWidgetData(widget);
    let comparisonData = null;
    if (widget.comparisonMode) {
      comparisonData = processWidgetData(widget, 1);
    }
    const props = { 
      data, 
      width: Math.max(100, Math.floor(size?.width || 0)), 
      height: Math.max(140, Math.floor(size?.height || 0)), 
      showGrid: true,
      onPointClick: (dp) => handleChartClick(widget, dp)
    };

    switch (widget.chartType) {
      case 'bar': return <BarChart {...props} />;
      case 'line': return <LineChart {...props} />;
      case 'pie': {
        const pieSize = Math.max(140, Math.floor(Math.min(size?.width || 0, size?.height || 0)) - 16);
        return <PieChart data={data} size={pieSize} donut />;
      }
      case 'area': return <AreaChart {...props} />;
      default: return <BarChart {...props} />;
    }
  };

  if (loading && widgets.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p>{t('loading') || 'Loading analytics...'}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Custom Styles for React Grid Layout */}
      <style>{`
        .react-grid-item {
          transition: all 200ms ease;
          transition-property: left, top, width, height;
        }
        
        .react-grid-item.cssTransforms {
          transition-property: transform, width, height;
        }
        
        .react-grid-item.resizing {
          transition: none;
          z-index: 100;
          will-change: width, height;
        }
        
        .react-grid-item.react-draggable-dragging {
          transition: none;
          z-index: 100;
          will-change: transform;
        }
        
        .react-grid-item.dropping {
          visibility: hidden;
        }
        
        .react-grid-item.react-grid-placeholder {
          background: rgba(139, 92, 246, 0.2);
          opacity: 0.8;
          transition-duration: 100ms;
          z-index: 2;
          border-radius: 16px;
          border: 2px dashed #8b5cf6;
        }
        
        .react-resizable-handle {
          position: absolute;
          width: 20px;
          height: 20px;
          background-color: #8b5cf6;
          border-radius: 50%;
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        
        .react-grid-item:hover .react-resizable-handle {
          opacity: 0.8;
        }
        
        .react-resizable-handle:hover {
          opacity: 1 !important;
          transform: scale(1.2);
        }
        
        .react-resizable-handle-se {
          bottom: 8px;
          right: 8px;
          cursor: se-resize;
        }
        
        .react-resizable-handle-sw {
          bottom: 8px;
          left: 8px;
          cursor: sw-resize;
        }
        
        .react-resizable-handle-ne {
          top: 8px;
          right: 8px;
          cursor: ne-resize;
        }
        
        .react-resizable-handle-nw {
          top: 8px;
          left: 8px;
          cursor: nw-resize;
        }
        
        .drag-handle:active {
          cursor: grabbing !important;
        }
        
        .layout {
          position: relative;
        }
      `}</style>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, color: 'var(--text)' }}>📊 Advanced Analytics</h1>
          <p style={{ margin: '0.5rem 0 0 0', color: 'var(--muted)' }}>Build custom charts and dashboards</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontSize: 12, color: 'var(--muted)' }}>Auto refresh</label>
            <select value={autoRefreshMs}
              onChange={(e)=> setAutoRefreshMs(Number(e.target.value))}
              style={{ padding: '0.4rem 0.6rem', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--input-bg)', color: 'var(--text)' }}>
              <option key="refresh_off" value={0}>Off</option>
              <option key="refresh_1min" value={60000}>1 min</option>
              <option key="refresh_5min" value={300000}>5 min</option>
              <option key="refresh_15min" value={900000}>15 min</option>
              <option key="refresh_30min" value={1800000}>30 min</option>
              <option key="refresh_60min" value={3600000}>60 min</option>
            </select>
          </div>
          {autoRefreshMs > 0 && (
            <div style={{ width: 160, height: 6, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }} title="Next auto refresh">
              <div style={{ height: '100%', width: `${Math.min(100, ((nowTick - lastUpdatedAt) % autoRefreshMs) / autoRefreshMs * 100)}%`, background: '#8b5cf6', transition: 'width 0.25s linear' }} />
            </div>
          )}
          <button onClick={()=>loadAllData()} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.55rem 1rem', background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
            ⟳ Refresh
          </button>
          <button onClick={()=>setEditLayout(v=>!v)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.55rem 1rem', background: editLayout ? '#ef4444' : 'transparent', color: editLayout ? 'white' : 'var(--text)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
            {editLayout ? 'Exit Edit Layout' : 'Edit Layout'}
          </button>
          <button
            onClick={exportData}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.75rem 1.5rem', background: '#10b981', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
          >
            <Download size={18} />
            Export
          </button>
          <button
            onClick={() => setShowBuilder(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.75rem 1.5rem', background: '#667eea', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
          >
            <Plus size={18} />
            Add Widget
          </button>
        </div>
      </div>

      {/* Permissions banners (non-blocking) */}
      {Object.keys(permErrors).length > 0 && (
        <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: 8, border: '1px solid #F59E0B', background: 'rgba(245, 158, 11, 0.1)', color: '#92400e' }}>
          <strong>Some data could not be loaded due to permissions:</strong>
          <div style={{ marginTop: 6, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {Object.entries(permErrors).map(([key]) => (
              <span key={key} style={{ padding: '2px 8px', borderRadius: 999, background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.4)' }}>{key}</span>
            ))}
          </div>
        </div>
      )}

      {/* Global Filters */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: 'var(--text)' }}>Class</label>
          <select value={globalFilters.classId} onChange={(e)=>setGlobalFilters({ ...globalFilters, classId: e.target.value })}
            style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--input-bg)', color: 'var(--text)' }}>
            <option key="cls_all" value="">All Classes</option>
            {rawData.classes.map((c, idx) => {
              const id = c?.id || c?.docId || `idx_${idx}`;
              const name = c?.title || c?.name_en || c?.name || c?.code || c?.className;
              const termStr = c?.term || '';
              const m = /^(Spring|Summer|Fall|Winter)\s*(\d{4})?$/i.exec(termStr || '');
              const termLabel = m ? `${m[1][0].toUpperCase()}${m[1].slice(1).toLowerCase()}${m[2] ? ' ' + m[2] : ''}` : (termStr || '').toString();
              const label = name || termLabel || `Class ${id.substring(0,6)}`;
              return (<option key={`cls_${id}`} value={id}>{label}</option>);
            })}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: 'var(--text)' }}>Term</label>
          <select value={globalFilters.term} onChange={(e)=>setGlobalFilters({ ...globalFilters, term: e.target.value })}
            style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--input-bg)', color: 'var(--text)' }}>
            <option key="term_all" value="">All Terms</option>
            {Array.from(new Set(rawData.classes.map(c => {
              const t = (c?.term || '').toString();
              const m = /^(Spring|Summer|Fall|Winter)/i.exec(t);
              return m ? `${m[1][0].toUpperCase()}${m[1].slice(1).toLowerCase()}` : (t || '');
            }).filter(Boolean))).map((v, i) => (<option key={`term_${v}_${i}`} value={v}>{v}</option>))}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: 'var(--text)' }}>Year</label>
          <select value={globalFilters.year} onChange={(e)=>setGlobalFilters({ ...globalFilters, year: e.target.value })}
            style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--input-bg)', color: 'var(--text)' }}>
            <option key="year_all" value="">All Years</option>
            {Array.from(new Set(rawData.classes.map(c => {
              const explicitYear = c?.year || c?.academicYear;
              if (explicitYear) return explicitYear;
              const t = (c?.term || '').toString();
              const m = /(\d{4})/.exec(t);
              return m ? m[1] : '';
            }).filter(Boolean))).map((v, i) => (<option key={`year_${v}_${i}`} value={v}>{v}</option>))}
          </select>
        </div>
      </div>

      {/* React Grid Layout - Professional Drag & Drop */}
      <ResponsiveGrid
        className="layout"
        layout={widgets.map(w => ({
          i: w.id,
          x: w.x || 0,
          y: w.y || 0,
          w: w.w || 6,
          h: w.h || 4,
          minW: 1,
          minH: 3
        }))}
        cols={12}
        rowHeight={64}
        isDraggable={editLayout}
        isResizable={editLayout}
        onLayoutChange={onLayoutChange}
        draggableHandle=".drag-handle"
        resizeHandles={['se', 'sw', 'ne', 'nw']}
        compactType="vertical"
        preventCollision={false}
      >
        {widgets.map(widget => (
          <div
            key={widget.id}
            style={{ 
              padding: '1.5rem', 
              border: '1px solid var(--border)', 
              borderRadius: 16, 
              background: 'var(--panel)', 
              boxShadow: editLayout ? '0 4px 12px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.04)', 
              transition: 'box-shadow 0.2s ease',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                {editLayout && (
                  <div className="drag-handle" style={{ cursor: 'grab', display: 'flex', alignItems: 'center' }}>
                    <GripVertical size={16} style={{ color: '#8b5cf6' }} />
                  </div>
                )}
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {widget.title}
                  {recentlyRefreshed[widget.id] && (
                    <span style={{ color: '#10b981', fontSize: 14 }}>✓</span>
                  )}
                </h3>
                <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--muted)' }}>
                  Last updated: {new Date(widgetUpdatedAt[widget.id] || lastUpdatedAt).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(',', '')}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  onClick={() => refreshWidget(widget.id)}
                  style={{ padding: '0.35rem', background: 'transparent', border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30 }}
                  title="Refresh"
                >
                  <span className={widgetLoading[widget.id] ? 'animate-spin' : ''}>⟳</span>
                </button>
                <button
                  onClick={() => {
                    setEditingWidget(widget);
                    setWidgetConfig(widget);
                    setShowBuilder(true);
                  }}
                  style={{ padding: '0.35rem', background: 'transparent', border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer', fontSize: '0.85rem' }}
                  title="Edit"
                >
                  ✏️
                </button>
                <button
                  onClick={() => deleteWidget(widget.id)}
                  style={{ padding: '0.35rem', background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', borderRadius: 4, cursor: 'pointer' }}
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
              {(loading || widgetLoading[widget.id]) && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-400 border-t-transparent"></div>
                </div>
              )}
            <ChartSizer>
              {(size)=> (
                <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 0, height: '100%', width: '100%' }}>
                  {renderChart(widget, size)}
                </div>
              )}
            </ChartSizer>
            </div>
          </div>
        ))}
      </ResponsiveGrid>

      {/* Toasts */}
      <div style={{ position: 'fixed', right: 16, bottom: 16, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 10000 }}>
        {toasts.map(t => (
          <div key={t.id} style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', color: '#065f46', fontWeight: 600 }}>
            {t.msg}
          </div>
        ))}
      </div>

      {/* Widget Builder Modal */}
      {showBuilder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={() => { setShowBuilder(false); setEditingWidget(null); resetBuilder(); }}>
          <div style={{ background: 'var(--panel)', color: 'var(--text)', padding: '2rem', borderRadius: 16, minWidth: 600, maxWidth: '90vw', maxHeight: '90vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0, color: 'var(--text)' }}>{editingWidget ? 'Edit Widget' : 'Create New Widget'}</h2>
            
            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Title</label>
                <input
                  type="text"
                  value={widgetConfig.title}
                  onChange={(e) => setWidgetConfig({ ...widgetConfig, title: e.target.value })}
                  placeholder="e.g., Submissions by Status"
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--input-bg)', color: 'var(--text)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Chart Type</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {[
                    { type: 'bar', icon: <BarChart3 size={20} />, label: 'Bar' },
                    { type: 'line', icon: <LineIcon size={20} />, label: 'Line' },
                    { type: 'pie', icon: <PieIcon size={20} />, label: 'Pie' },
                    { type: 'area', icon: <TrendingUp size={20} />, label: 'Area' }
                  ].map(({ type, icon, label }) => (
                    <button
                      key={type}
                      onClick={() => setWidgetConfig({ ...widgetConfig, chartType: type })}
                      style={{
                        padding: '1rem',
                        border: widgetConfig.chartType === type ? '2px solid #667eea' : '1px solid var(--border)',
                        borderRadius: 8,
                        background: widgetConfig.chartType === type ? 'rgba(102,126,234,0.1)' : 'transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <span style={{ color: 'var(--text)' }}>{icon}</span>
                      <span style={{ fontSize: 12, color: 'var(--text)' }}>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Data Source</label>
                <select
                  value={widgetConfig.dataSource}
                  onChange={(e) => setWidgetConfig({ ...widgetConfig, dataSource: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--input-bg)', color: 'var(--text)' }}
                >
                  <option value="submissions">Submissions</option>
                  <option value="activities">Activities</option>
                  <option value="users">Users</option>
                  <option value="classes">Classes</option>
                  <option value="attendance">Attendance</option>
                  <option value="activityLogs">Activity Logs</option>
                  <option value="enrollments">Enrollments</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Group By</label>
                  <select
                    value={widgetConfig.groupBy}
                    onChange={(e) => setWidgetConfig({ ...widgetConfig, groupBy: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--input-bg)', color: 'var(--text)' }}
                  >
                    <option value="status">Status</option>
                    <option value="type">Type</option>
                    <option value="classId">Class</option>
                    <option value="userId">User</option>
                    <option value="date">Date</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Aggregation</label>
                  <select
                    value={widgetConfig.aggregation}
                    onChange={(e) => setWidgetConfig({ ...widgetConfig, aggregation: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--input-bg)', color: 'var(--text)' }}
                  >
                    <option value="count">Count</option>
                    <option value="sum">Sum</option>
                    <option value="avg">Average</option>
                    <option value="min">Minimum</option>
                    <option value="max">Maximum</option>
                    <option value="median">Median</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Date Range</label>
                <select
                  value={widgetConfig.dateRange}
                  onChange={(e) => setWidgetConfig({ ...widgetConfig, dateRange: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--input-bg)', color: 'var(--text)' }}
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="last7">Last 7 Days</option>
                  <option value="last30">Last 30 Days</option>
                  <option value="last90">Last 90 Days</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={widgetConfig.comparisonMode}
                    onChange={(e) => setWidgetConfig({ ...widgetConfig, comparisonMode: e.target.checked })}
                  />
                  Comparison Mode
                </label>
                {widgetConfig.comparisonMode && (
                  <select
                    value={widgetConfig.comparisonPeriod}
                    onChange={(e) => setWidgetConfig({ ...widgetConfig, comparisonPeriod: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--input-bg)', color: 'var(--text)' }}
                  >
                    <option value="previous">vs Previous Period</option>
                    <option value="lastYear">vs Last Year</option>
                  </select>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: '2rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowBuilder(false); setEditingWidget(null); resetBuilder(); }}
                style={{ padding: '0.75rem 1.5rem', background: '#6b7280', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
              >
                Cancel
              </button>
              <button
                onClick={editingWidget ? updateWidget : addWidget}
                style={{ padding: '0.75rem 1.5rem', background: '#667eea', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
              >
                <Save size={18} style={{ display: 'inline', marginRight: 8 }} />
                {editingWidget ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drill-Down Modal */}
      {showDrillDown && drillDownData && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={() => setShowDrillDown(false)}>
          <div style={{ background: 'var(--panel)', color: 'var(--text)', padding: '2rem', borderRadius: 16, minWidth: 700, maxWidth: '90vw', maxHeight: '90vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, color: 'var(--text)' }}>📊 Drill-Down: {drillDownData.dataPoint.label}</h2>
              <button onClick={() => setShowDrillDown(false)} style={{ padding: '0.5rem', background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(102,126,234,0.1)', borderRadius: 8 }}>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)' }}>Showing {drillDownData.items.length} items for <strong>{drillDownData.dataPoint.label}</strong></p>
            </div>

            <div style={{ maxHeight: 400, overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--border)', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem', borderBottom: '2px solid var(--border)' }}>ID</th>
                    <th style={{ padding: '0.75rem', borderBottom: '2px solid var(--border)' }}>Details</th>
                    <th style={{ padding: '0.75rem', borderBottom: '2px solid var(--border)' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {drillDownData.items.slice(0, 50).map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.75rem' }}>{item.id || item.docId || idx + 1}</td>
                      <td style={{ padding: '0.75rem' }}>
                        {item.title || item.name || item.displayName || item.email || JSON.stringify(item).slice(0, 50)}
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: 12, color: 'var(--muted)' }}>
                        {item.when?.seconds ? new Date(item.when.seconds * 1000).toLocaleDateString('en-GB') :
                         item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleDateString('en-GB') :
                         item.submittedAt?.seconds ? new Date(item.submittedAt.seconds * 1000).toLocaleDateString('en-GB') : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {drillDownData.items.length > 50 && (
                <p style={{ textAlign: 'center', marginTop: '1rem', color: 'var(--muted)', fontSize: 14 }}>Showing first 50 of {drillDownData.items.length} items</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
