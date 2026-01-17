import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { useTheme } from '../contexts/ThemeContext';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, orderBy, limit, startAt, endAt } from 'firebase/firestore';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  QrCode, 
  Calendar,
  Clock,
  Activity,
  Download,
  Filter,
  RefreshCw,
  Award,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { Button, Card, CardBody, Loading, Select } from '../components/ui';
import { formatDateTime } from '../utils/date';
import './QRAnalyticsPage.css';

const QRAnalyticsPage = () => {
  const { user, isAdmin, isInstructor } = useAuth();
  const { t, isRTL } = useLang();
  const { isDark } = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    totalScans: 0,
    uniqueStudents: 0,
    todayScans: 0,
    weeklyScans: 0,
    monthlyScans: 0,
    topStudents: [],
    scanTrends: [],
    recentScans: []
  });
  
  const [filters, setFilters] = useState({
    dateRange: '7days', // 7days, 30days, 90days, all
    classId: '',
    actionType: 'all' // all, profile_scan, manual_search, attendance_marked
  });
  
  const [classes, setClasses] = useState([]);
  const [exportData, setExportData] = useState(null);

  // Load instructor's classes
  useEffect(() => {
    if (!user?.uid) return;
    loadClasses();
  }, [user]);

  const loadClasses = async () => {
    try {
      const classesSnap = await getDocs(collection(db, 'classes'));
      const classData = classesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const filteredClasses = isAdmin 
        ? classData 
        : classData.filter(cls => cls.instructorId === user.uid || cls.createdBy === user.uid);
      
      setClasses(filteredClasses);
    } catch (error) {
      console.error('Failed to load classes:', error);
    }
  };

  // Load analytics data
  useEffect(() => {
    if (!user?.uid) return;
    loadAnalytics();
  }, [user, filters]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Calculate date range
      const now = new Date();
      let startDate = new Date();
      
      switch (filters.dateRange) {
        case '7days':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30days':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90days':
          startDate.setDate(now.getDate() - 90);
          break;
        case 'all':
          startDate = new Date(2020, 0, 1); // Far back date
          break;
        default:
          startDate.setDate(now.getDate() - 7);
      }
      
      // Load QR scan records
      const scansRef = collection(db, 'qrScans');
      let scansQuery = query(
        scansRef,
        where('scannedAt', '>=', startDate),
        orderBy('scannedAt', 'desc')
      );
      
      if (filters.classId) {
        scansQuery = query(scansQuery, where('classId', '==', filters.classId));
      }
      
      if (filters.actionType !== 'all') {
        scansQuery = query(scansQuery, where('actionType', '==', filters.actionType));
      }
      
      const scansSnap = await getDocs(scansQuery);
      const scans = scansSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Calculate analytics
      const uniqueStudentIds = [...new Set(scans.map(scan => scan.studentId))];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayScans = scans.filter(scan => {
        const scanDate = new Date(scan.scannedAt);
        scanDate.setHours(0, 0, 0, 0);
        return scanDate.getTime() === today.getTime();
      });
      
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      const weeklyScans = scans.filter(scan => new Date(scan.scannedAt) >= weekAgo);
      
      const monthAgo = new Date();
      monthAgo.setDate(now.getDate() - 30);
      const monthlyScans = scans.filter(scan => new Date(scan.scannedAt) >= monthAgo);
      
      // Top students (by scan count)
      const studentScanCounts = {};
      scans.forEach(scan => {
        studentScanCounts[scan.studentId] = (studentScanCounts[scan.studentId] || 0) + 1;
      });
      
      const topStudents = Object.entries(studentScanCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([studentId, count]) => ({ studentId, count }));
      
      // Load student details for top students
      const topStudentIds = topStudents.map(s => s.studentId);
      let topStudentDetails = [];
      
      if (topStudentIds.length > 0) {
        const usersRef = collection(db, 'users');
        const usersQuery = query(
          usersRef,
          where('uid', 'in', topStudentIds)
        );
        const usersSnap = await getDocs(usersQuery);
        const users = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        topStudentDetails = topStudents.map(student => {
          const userDetails = users.find(u => u.uid === student.studentId);
          return {
            ...student,
            displayName: userDetails?.displayName || userDetails?.email || 'Unknown',
            email: userDetails?.email || 'Unknown'
          };
        });
      }
      
      // Generate trend data (last 7 days)
      const trends = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(now.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(date);
        nextDate.setDate(date.getDate() + 1);
        
        const dayScans = scans.filter(scan => {
          const scanDate = new Date(scan.scannedAt);
          return scanDate >= date && scanDate < nextDate;
        });
        
        trends.push({
          date: date.toISOString().split('T')[0],
          scans: dayScans.length,
          students: [...new Set(dayScans.map(s => s.studentId))].length
        });
      }
      
      setAnalytics({
        totalScans: scans.length,
        uniqueStudents: uniqueStudentIds.length,
        todayScans: todayScans.length,
        weeklyScans: weeklyScans.length,
        monthlyScans: monthlyScans.length,
        topStudents: topStudentDetails,
        scanTrends: trends,
        recentScans: scans.slice(0, 20)
      });
      
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Export data
  const handleExport = () => {
    const csvContent = [
      ['Date', 'Student', 'Email', 'Action Type', 'Class ID'],
      ...analytics.recentScans.map(scan => [
        formatDateTime(scan.scannedAt),
        scan.student?.displayName || 'Unknown',
        scan.student?.email || 'Unknown',
        scan.actionType,
        scan.classId || 'N/A'
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Check access
  if (!isAdmin && !isInstructor) {
    return (
      <div className="access-denied">
        <AlertTriangle size={48} />
        <h2>Access Denied</h2>
        <p>You don't have permission to view QR analytics.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="analytics-page">
        <div className="loading-container">
          <Loading variant="fullscreen" message="Loading analytics..." />
        </div>
      </div>
    );
  }

  return (
    <div className="qr-analytics-page">
      <div className="analytics-header">
        <div className="header-title">
          <div className="rotating-logo">
            <BarChart3 size={24} />
          </div>
          <h1>QR Scanner Analytics</h1>
        </div>
        
        <div className="header-actions">
          <div className="filters">
            <Select
              value={filters.dateRange}
              onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
              options={[
                { value: '7days', label: 'Last 7 Days' },
                { value: '30days', label: 'Last 30 Days' },
                { value: '90days', label: 'Last 90 Days' },
                { value: 'all', label: 'All Time' }
              ]}
            />
            
            <Select
              value={filters.classId}
              onChange={(e) => setFilters({...filters, classId: e.target.value})}
              options={[
                { value: '', label: 'All Classes' },
                ...classes.map(cls => ({
                  value: cls.id,
                  label: cls.name || cls.code
                }))
              ]}
            />
            
            <Select
              value={filters.actionType}
              onChange={(e) => setFilters({...filters, actionType: e.target.value})}
              options={[
                { value: 'all', label: 'All Actions' },
                { value: 'profile_scan', label: 'Profile Scans' },
                { value: 'manual_search', label: 'Manual Searches' },
                { value: 'attendance_marked', label: 'Attendance Marked' }
              ]}
            />
          </div>
          
          <Button onClick={handleExport} variant="outline">
            <Download size={16} />
            Export CSV
          </Button>
          
          <Button onClick={loadAnalytics} variant="outline">
            <RefreshCw size={16} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="analytics-grid">
        {/* KPI Cards */}
        <Card className="kpi-card">
          <CardBody>
            <div className="kpi-content">
              <div className="kpi-icon">
                <QrCode size={24} />
              </div>
              <div className="kpi-data">
                <div className="kpi-value">{analytics.totalScans}</div>
                <div className="kpi-label">Total Scans</div>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="kpi-card">
          <CardBody>
            <div className="kpi-content">
              <div className="kpi-icon">
                <Users size={24} />
              </div>
              <div className="kpi-data">
                <div className="kpi-value">{analytics.uniqueStudents}</div>
                <div className="kpi-label">Unique Students</div>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="kpi-card">
          <CardBody>
            <div className="kpi-content">
              <div className="kpi-icon">
                <Calendar size={24} />
              </div>
              <div className="kpi-data">
                <div className="kpi-value">{analytics.todayScans}</div>
                <div className="kpi-label">Today's Scans</div>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="kpi-card">
          <CardBody>
            <div className="kpi-content">
              <div className="kpi-icon">
                <TrendingUp size={24} />
              </div>
              <div className="kpi-data">
                <div className="kpi-value">{analytics.weeklyScans}</div>
                <div className="kpi-label">Weekly Scans</div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="analytics-content">
        {/* Scan Trends Chart */}
        <Card className="trends-card">
          <CardBody>
            <h3>
              <Activity size={20} />
              Scan Trends (7 Days)
            </h3>
            <div className="trends-chart">
              {analytics.scanTrends.map((trend, index) => (
                <div key={trend.date} className="trend-bar">
                  <div className="trend-date">
                    {new Date(trend.date).toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className="trend-bar-container">
                    <div 
                      className="trend-bar-fill" 
                      style={{ 
                        height: `${Math.max(trend.scans * 10, 5)}px`,
                        backgroundColor: 'var(--brand, #4f46e5)'
                      }}
                    />
                    <div className="trend-count">{trend.scans}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Top Students */}
        <Card className="top-students-card">
          <CardBody>
            <h3>
              <Award size={20} />
              Top Students
            </h3>
            <div className="top-students-list">
              {analytics.topStudents.length > 0 ? (
                analytics.topStudents.map((student, index) => (
                  <div key={student.studentId} className="top-student-item">
                    <div className="student-rank">#{index + 1}</div>
                    <div className="student-info">
                      <div className="student-name">{student.displayName}</div>
                      <div className="student-email">{student.email}</div>
                    </div>
                    <div className="student-scans">{student.count} scans</div>
                  </div>
                ))
              ) : (
                <div className="no-data">
                  <CheckCircle size={48} />
                  <p>No scan data available</p>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Recent Scans */}
        <Card className="recent-scans-card">
          <CardBody>
            <h3>
              <Clock size={20} />
              Recent Scans
            </h3>
            <div className="recent-scans-list">
              {analytics.recentScans.length > 0 ? (
                analytics.recentScans.map(scan => (
                  <div key={scan.id} className="recent-scan-item">
                    <div className="scan-info">
                      <div className="scan-student">
                        {scan.student?.displayName || 'Unknown Student'}
                      </div>
                      <div className="scan-email">
                        {scan.student?.email || 'Unknown'}
                      </div>
                    </div>
                    <div className="scan-details">
                      <div className="scan-action">{scan.actionType}</div>
                      <div className="scan-time">
                        {formatDateTime(scan.scannedAt)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-data">
                  <CheckCircle size={48} />
                  <p>No recent scans</p>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default QRAnalyticsPage;
