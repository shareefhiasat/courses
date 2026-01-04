import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useLang } from './LangContext';
import { ABSENCE_TYPES, PENALTY_TYPES } from '../firebase/penalties';

// Participation types with points
const PARTICIPATION_TYPES = [
  { id: 'explain_lesson', label_ar: 'شرح الدرس', label_en: 'Explained Lesson', points: 5 },
  { id: 'gave_project', label_ar: 'قدم مشروع', label_en: 'Gave Project', points: 10 },
  { id: 'gave_paper', label_ar: 'قدم ورقة', label_en: 'Gave Paper', points: 3 },
  { id: 'answered_question', label_ar: 'أجاب على سؤال', label_en: 'Answered Question', points: 2 },
  { id: 'participated_discussion', label_ar: 'شارك في النقاش', label_en: 'Participated in Discussion', points: 3 },
  { id: 'helped_peer', label_ar: 'ساعد زميل', label_en: 'Helped a Peer', points: 4 },
  { id: 'presented', label_ar: 'قدم عرضاً', label_en: 'Gave a Presentation', points: 8 }
];

const HelpContext = createContext();

export const HelpProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentHelp, setCurrentHelp] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSections, setExpandedSections] = useState({});
  const location = useLocation();
  const { t, lang } = useLang();
  
  // Toggle section expansion
  const toggleSection = useCallback((sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  }, []);
  
  // Expand all sections
  const expandAllSections = useCallback((content) => {
    const allExpanded = {};
    Object.keys(content).forEach(route => {
      if (content[route]?.content) {
        content[route].content.forEach((section, index) => {
          allExpanded[`${route}-${index}`] = true;
        });
      }
    });
    setExpandedSections(allExpanded);
  }, []);
  
  // Collapse all sections
  const collapseAllSections = useCallback(() => {
    setExpandedSections({});
  }, []);

  // Memoize the help content to prevent unnecessary re-renders
  const { content: helpContent, defaultHelp, availableResources } = useMemo(() => {
    // Helper function to safely get translated text with fallback
    const tWithFallback = (key, fallback, item = null) => {
      try {
        // First try to get the translated string from the dictionary
        const translated = t(key);
        if (translated !== key) return translated;
        
        // If no translation found and we have an item with language fields
        if (item) {
          // Try to get the appropriate language field
          const langField = `label_${lang}`;
          if (item[langField]) return item[langField];
          
          // Fallback to English if available
          if (lang !== 'en' && item.label_en) return item.label_en;
          
          // Fallback to Arabic if available
          if (lang === 'ar' && item.label_ar) return item.label_ar;
        }
        
        // Return the provided fallback if no other options
        return fallback || key;
      } catch (error) {
        console.warn(`[HelpContext] Translation error for key '${key}':`, error);
        return fallback || key;
      }
    };
    
    // Help content for available resources
    const availableResources = {
      title: t('available_resources') || 'Available Resources',
      items: [
        { text: t('study_materials') || 'Study Materials', description: t('study_materials_desc') || 'Access to lecture notes, presentations, and readings' },
        { text: t('additional_resources') || 'Additional Resources', description: t('additional_resources_desc') || 'Supplementary materials for further learning' },
        { text: t('access_help') || 'Access Help', description: t('access_help_desc') || 'Contact support if you have trouble accessing any resources' }
      ]
    };
    
    // Default help content - show all rules (penalties, participation, behavior)
    const defaultHelp = {
      title: '', // No title for default
      content: [
        {
          title: t('penalty_rules') || 'Penalty Rules',
          items: (PENALTY_TYPES || []).map((penalty) => ({
            text: penalty[`label_${lang}`] || penalty.label_en || penalty.id,
            deduction: penalty?.points 
              ? `-${penalty.points} ${t('points') || 'points'}` 
              : t('no_deduction') || 'No deduction',
            description: penalty[`description_${lang}`] || penalty.description_en || penalty.description || t('no_description_available') || 'No description available'
          }))
        },
        {
          title: t('absence_rules') || 'Absence Rules',
          items: (ABSENCE_TYPES || []).map((absence) => ({
            text: absence[`label_${lang}`] || absence.label_en || absence.id,
            deduction: absence?.deduction 
              ? `-${absence.deduction} ${t('points_per_session') || 'points per session'}` 
              : t('no_deduction') || 'No deduction',
            description: absence[`description_${lang}`] || absence.description_en || absence.description || t('no_description_available') || 'No description available'
          }))
        },
        {
          title: t('participation_rules') || 'Participation Rules',
          items: (PARTICIPATION_TYPES || []).map((participation) => ({
            text: participation[`label_${lang}`] || participation.label_en || participation.id,
            points: `+${participation.points} ${t('points') || 'points'}`,
            description: participation[`description_${lang}`] || participation.description || t('points_awarded') || 'Points awarded for active participation'
          }))
        },
        {
          title: t('behavior_rules') || 'Behavior Types',
          items: [
            { text: t('talk_in_class') || 'Talk in Class', description: t('talk_in_class_desc') || 'Student talking during class without permission' },
            { text: t('sleep') || 'Sleep', description: t('sleep_desc') || 'Student sleeping during class' },
            { text: t('bathroom_requests') || 'Frequent Bathroom Requests', description: t('bathroom_requests_desc') || 'Excessive requests to leave class' },
            { text: t('mobile_in_class') || 'Mobile Phone in Class', description: t('mobile_in_class_desc') || 'Using mobile phone during class' },
            { text: t('disruptive') || 'Disruptive Behavior', description: t('disruptive_desc') || 'Behavior that disrupts the learning environment' },
            { text: t('late_arrival') || 'Late Arrival', description: t('late_arrival_desc') || 'Arriving late to class' },
            { text: t('inappropriate_language') || 'Inappropriate Language', description: t('inappropriate_language_desc') || 'Using inappropriate language' },
            { text: t('other') || 'Other', description: t('other_behavior_desc') || 'Other behavior incidents' }
          ]
        }
      ]
    };
    
    // Create the help content with available resources
    const content = {};
    
    // Dashboard help content
    content['/dashboard'] = {
      title: t('dashboard_help_title') || 'Dashboard Help',
      content: [
        {
          title: t('dashboard_overview') || 'Dashboard Overview',
          items: [
            { 
              text: t('welcome') || 'Welcome',
              description: t('welcome_desc') || 'Welcome to your dashboard'
            },
            {
              text: t('recent_activity') || 'Recent Activity',
              description: t('recent_activity_desc') || 'View your recent actions and updates from your classes.'
            }
          ]
        }
      ]
    };
    
    // HR Penalties help content
    content['/hr-penalties'] = {
      title: '', // No title
      content: [
        {
          title: t('penalty_rules') || 'Penalty Rules',
          items: (PENALTY_TYPES || []).map((penalty) => ({
            text: penalty[`label_${lang}`] || penalty.label_en || penalty.id,
            deduction: penalty?.points 
              ? `-${penalty.points} ${t('points') || 'points'}` 
              : t('no_deduction') || 'No deduction',
            description: penalty[`description_${lang}`] || penalty.description_en || penalty.description || t('no_description_available') || 'No description available'
          }))
        },
        {
          title: t('absence_rules') || 'Absence Rules',
          items: (ABSENCE_TYPES || []).map((absence) => ({
            text: absence[`label_${lang}`] || absence.label_en || absence.id,
            deduction: absence?.deduction 
              ? `-${absence.deduction} ${t('points_per_session') || 'points per session'}` 
              : t('no_deduction') || 'No deduction',
            description: absence[`description_${lang}`] || absence.description_en || absence.description || t('no_description_available') || 'No description available'
          }))
        },
        {
          title: t('participation_rules') || 'Participation Rules',
          items: (PARTICIPATION_TYPES || []).map((participation) => ({
            text: participation[`label_${lang}`] || participation.label_en || participation.id,
            points: `+${participation.points} ${t('points') || 'points'}`,
            description: participation[`description_${lang}`] || participation.description || t('points_awarded') || 'Points awarded for active participation'
          }))
        }
      ]
    };
    
    // Attendance help content
    content['/attendance'] = {
      title: t('attendance_help_title') || 'Attendance Rules',
      content: [
        {
          title: t('attendance_rules') || 'Attendance Rules',
          items: [
            {
              text: t('on_time') || 'On Time',
              description: t('on_time_desc') || 'Student is present and on time'
            },
            {
              text: t('late') || 'Late',
              description: t('late_desc') || 'Student is late to class'
            },
            {
              text: t('absent') || 'Absent',
              description: t('absent_desc') || 'Student is absent from class'
            }
          ]
        }
      ]
    };
    
    // Instructor Behavior help content
    content['/instructor-behavior'] = {
      title: t('behavior_help_title') || 'Behavior Management',
      content: [
        {
          title: t('behavior_rules') || 'Behavior Types',
          items: [
            { text: t('talk_in_class') || 'Talk in Class', description: t('talk_in_class_desc') || 'Student talking during class without permission' },
            { text: t('sleep') || 'Sleep', description: t('sleep_desc') || 'Student sleeping during class' },
            { text: t('bathroom_requests') || 'Frequent Bathroom Requests', description: t('bathroom_requests_desc') || 'Excessive requests to leave class' },
            { text: t('mobile_in_class') || 'Mobile Phone in Class', description: t('mobile_in_class_desc') || 'Using mobile phone during class' },
            { text: t('disruptive') || 'Disruptive Behavior', description: t('disruptive_desc') || 'Behavior that disrupts the learning environment' },
            { text: t('late_arrival') || 'Late Arrival', description: t('late_arrival_desc') || 'Arriving late to class' },
            { text: t('inappropriate_language') || 'Inappropriate Language', description: t('inappropriate_language_desc') || 'Using inappropriate language' },
            { text: t('other') || 'Other', description: t('other_behavior_desc') || 'Other behavior incidents' }
          ]
        }
      ]
    };
    
    // Instructor Participation help content
    content['/instructor-participation'] = {
      title: t('participation_help_title') || 'Participation Management',
      content: [
        {
          title: t('participation_rules') || 'Participation Types',
          items: (PARTICIPATION_TYPES || []).map((participation) => ({
            text: participation[`label_${lang}`] || participation.label_en || participation.id,
            points: participation.points ? `+${participation.points} ${t('points') || 'points'}` : '',
            description: participation[`description_${lang}`] || participation.description || t('points_awarded') || 'Points awarded for active participation'
          }))
        }
      ]
    };
    
    // Student Dashboard help content
    content['/student-dashboard'] = {
      title: t('student_dashboard_help_title') || 'Student Dashboard Help',
      content: [
        {
          title: t('dashboard_cards') || 'Dashboard Cards',
          items: [
            { 
              text: t('enrolled_classes') || 'Enrolled Classes', 
              description: t('tooltip_enrolled_classes') || 'Total number of classes you are currently enrolled in. This includes all active class enrollments.'
            },
            { 
              text: t('tasks_completed') || 'Tasks Completed', 
              description: t('tooltip_tasks_completed') || 'Number of completed tasks out of total assigned tasks. Shows your task completion progress and percentage.'
            },
            { 
              text: t('average_grade') || 'Average Grade', 
              description: t('tooltip_average_grade') || 'Your overall average grade percentage across all graded assignments, quizzes, and exams.'
            },
            { 
              text: t('attendance_rate') || 'Attendance Rate', 
              description: t('tooltip_attendance_rate') || 'Percentage of class sessions you have attended. Shows present sessions out of total sessions.'
            },
            { 
              text: t('participations') || 'Participations', 
              description: t('tooltip_participations') || 'Total number of positive participation points earned through active engagement in class activities.'
            },
            { 
              text: t('penalties') || 'Penalties', 
              description: t('tooltip_penalties') || 'Total number of penalties received. These are negative points for rule violations or misconduct.'
            },
            { 
              text: t('behaviors') || 'Behaviors', 
              description: t('tooltip_behaviors') || 'Total number of behavior incidents recorded. These may affect your participation score.'
            },
            { 
              text: t('net_participation') || 'Net Participation', 
              description: t('tooltip_net_participation') || 'Net participation score calculated as positive participations minus negative behaviors. Shows your overall engagement balance.'
            }
          ]
        }
      ]
    };
    
    // Add available resources to each route's content
    Object.keys(content).forEach(route => {
      if (content[route] && Array.isArray(content[route].content)) {
        content[route].content = [...content[route].content, availableResources];
      }
    });
    
    return { content, defaultHelp, availableResources };
  }, [t, lang]);
  

  // Get help content for the current route
  const getHelpForRoute = useCallback((pathname) => {
    if (!pathname) return defaultHelp;
    
    console.log(`[HelpContext] Getting help content for path: ${pathname}`);
    
    // Special handling for known routes
    let route = Object.keys(helpContent).find(key => pathname.startsWith(key));
    
    // If no direct match, try to find a parent route
    if (!route && pathname.includes('/hr-')) {
      route = '/hr-penalties'; // Default to HR Penalties for HR-related routes
    }
    
    const help = route ? helpContent[route] : defaultHelp;
    
    // Ensure we always have a valid help object with all required fields
    const safeHelp = {
      title: help?.title || defaultHelp.title,
      content: Array.isArray(help?.content) ? help.content : defaultHelp.content
    };
    
    console.log(`[HelpContext] Returning help for route: ${route || 'default'}`, safeHelp);
    return safeHelp;
  }, [helpContent, defaultHelp]);

  // Update help content when location changes
  useEffect(() => {
    if (location && location.pathname) {
      const help = getHelpForRoute(location.pathname);
      console.log(`[HelpContext] Updating help content for route: ${location.pathname}`);
      setCurrentHelp(help);
    }
  }, [location, getHelpForRoute]);

  // Handle help button click
  const openHelp = useCallback(() => {
    console.log('[HelpContext] Opening help drawer');
    setIsOpen(true);
  }, []);

  // Close help drawer
  const closeHelp = useCallback(() => {
    console.log('[HelpContext] Closing help drawer');
    setIsOpen(false);
  }, []);

  // Listen for help events
  useEffect(() => {
    const handleHelpEvent = (e) => {
      console.log('[HelpContext] Received app:help event with detail:', e.detail);
      const route = e.detail?.route || location.pathname;
      console.log(`[HelpContext] Processing help request for route: ${route}`);
      const help = getHelpForRoute(route);
      if (help) {
        console.log('[HelpContext] Setting current help content:', help);
        setCurrentHelp(help);
        setIsOpen(true);
        console.log('[HelpContext] Help drawer should now be open');
      } else {
        console.warn('[HelpContext] No help content found for route:', route);
      }
    };

    console.log('[HelpContext] Adding app:help event listener');
    window.addEventListener('app:help', handleHelpEvent);
    
    return () => {
      console.log('[HelpContext] Cleaning up app:help event listener');
      window.removeEventListener('app:help', handleHelpEvent);
    };
  }, [location.pathname, getHelpForRoute]);

  // Listen for help toggle events separately to avoid dependency issues
  useEffect(() => {
    const handleHelpToggle = (e) => {
      console.log('[HelpContext] Received app:help:toggle event');
      setIsOpen(prev => {
        if (prev) {
          // If open, close it
          console.log('[HelpContext] Help drawer is open, closing it');
          return false;
        } else {
          // If closed, open it with current route help
          const route = e.detail?.route || location.pathname;
          console.log(`[HelpContext] Help drawer is closed, opening for route: ${route}`);
          const help = getHelpForRoute(route);
          if (help) {
            setCurrentHelp(help);
          }
          return true;
        }
      });
    };

    console.log('[HelpContext] Adding app:help:toggle event listener');
    window.addEventListener('app:help:toggle', handleHelpToggle);
    
    return () => {
      console.log('[HelpContext] Cleaning up app:help:toggle event listener');
      window.removeEventListener('app:help:toggle', handleHelpToggle);
    };
  }, [location.pathname, getHelpForRoute]);

  return (
    <HelpContext.Provider value={{ isOpen, currentHelp, openHelp, closeHelp }}>
      {children}
    </HelpContext.Provider>
  );
};

export const useHelp = () => {
  const context = useContext(HelpContext);
  if (!context) {
    throw new Error('useHelp must be used within a HelpProvider');
  }
  return context;
};

export default HelpContext;
