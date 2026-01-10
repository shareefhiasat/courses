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
    const availableResources = null;
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
    
    // Communication help content - Newsletter
    content['/dashboard?tab=newsletter'] = {
      title: t('newsletter_help_title', 'Newsletter Help'),
      content: [
        {
          title: t('newsletter_overview_title', 'Newsletter Overview'),
          items: [
            {
              text: t('purpose', 'Purpose'),
              description: t('newsletter_purpose', 'Newsletters are used for regular communications with users, typically containing multiple pieces of content, updates, and resources.')
            },
            {
              text: t('key_features', 'Key Features'),
              description: [
                t('newsletter_feature1', '• Send to specific groups or all users'),
                t('newsletter_feature2', '• Rich HTML content support'),
                t('newsletter_feature3', '• Email tracking and analytics'),
                t('newsletter_feature4', '• Scheduled sending options')
              ].join('\n')
            },
            {
              text: t('common_use_cases', 'Common Use Cases'),
              description: [
                t('newsletter_usecase1', '• Monthly program updates'),
                t('newsletter_usecase2', '• Weekly learning digests'),
                t('newsletter_usecase3', '• Event announcements'),
                t('newsletter_usecase4', '• System updates and news')
              ].join('\n')
            }
          ]
        }
      ]
    };

    // Communication help content - Announcements
    content['/dashboard?tab=announcements'] = {
      title: t('announcements_help_title', 'Announcements Help'),
      content: [
        {
          title: t('announcements_overview_title', 'Announcements Overview'),
          items: [
            {
              text: t('purpose', 'Purpose'),
              description: t('help.announcements') || t('announcements_purpose', 'Create and manage platform-wide or targeted announcements. Announcements can be sent as emails and appear as notifications.')
            },
            {
              text: t('summary_cards') || 'Summary Cards',
              description: t('help_announcements_cards') || 'The summary cards at the top show filtered counts. Use the Program/Subject/Class filters to see counts for specific scopes.'
            }
          ]
        },
        {
          title: t('key_features', 'Key Features'),
          items: [
            {
              text: t('targeting') || 'Targeting',
              description: [
                t('announcement_feature1', '• Send urgent notifications to all users or specific groups'),
                t('announcement_feature3', '• Can be targeted to specific user roles or classes')
              ].join('\n')
            },
            {
              text: t('delivery') || 'Delivery Methods',
              description: [
                t('announcement_feature2', '• Appear as popup notifications'),
                t('announcement_feature4', '• Optional email notifications')
              ].join('\n')
            }
          ]
        },
        {
          title: t('fields') || 'Fields',
          items: [
            { text: t('announcement_title') || 'Title', description: t('help_announcement_title') || 'Brief, attention-grabbing title for the announcement. Required field.' },
            { text: t('announcement_content_english') || 'Content (English)', description: t('help_announcement_content_en') || 'Main announcement text in English. Required field.' },
            { text: t('announcement_content_arabic') || 'Content (Arabic)', description: t('help_announcement_content_ar') || 'Arabic translation of the announcement. Optional but recommended for bilingual communication.' },
            { text: t('program') || 'Program', description: t('help_announcement_program') || 'Optional: Target to a specific program. If selected, only subjects in that program will be available.' },
            { text: t('subject') || 'Subject', description: t('help_announcement_subject') || 'Optional: Target to a specific subject. Requires a program to be selected first.' },
            { text: t('class') || 'Class', description: t('help_announcement_class') || 'Optional: Target to a specific class. Requires a subject to be selected first. If all are empty, announcement is global.' }
          ]
        },
        {
          title: t('common_use_cases', 'Common Use Cases'),
          items: [
            { text: t('urgent_updates') || 'Urgent Updates', description: [
              t('announcement_usecase1', '• Class cancellations or room changes'),
              t('announcement_usecase3', '• Urgent system maintenance alerts'),
              t('announcement_usecase5', '• Emergency notifications')
            ].join('\n') },
            { text: t('reminders') || 'Reminders & Updates', description: [
              t('announcement_usecase2', '• Deadline reminders and extensions'),
              t('announcement_usecase4', '• Important policy or schedule updates')
            ].join('\n') }
          ]
        },
        {
          title: t('best_practices', 'Best Practices'),
          items: [
            { text: t('content_guidelines') || 'Content Guidelines', description: [
              t('announcement_practice1', '• Keep messages short and to the point'),
              t('announcement_practice2', '• Use clear, action-oriented language'),
              t('announcement_practice3', '• Include all necessary details in the announcement')
            ].join('\n') },
            { text: t('usage_tips') || 'Usage Tips', description: [
              t('announcement_practice4', '• Use sparingly to maintain effectiveness'),
              t('announcement_practice5', '• Consider time zones when sending time-sensitive announcements')
            ].join('\n') }
          ]
        },
        {
          title: t('filters') || 'Filtering',
          items: [
            { text: t('summary_cards_filters') || 'Summary Cards Filters', description: t('help_announcements_filter') || 'Use the Program/Subject/Class filters in the summary cards section to filter announcements by scope. The announcement count and grid will update accordingly.' }
          ]
        }
      ]
    };

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

    // Activities Help
    content['/dashboard?tab=activities'] = {
      title: t('activities_management') || 'Activities Management',
      content: [
        {
          title: t('overview') || 'Overview',
          items: [
            { 
              text: t('purpose') || 'Purpose', 
              description: t('help.activities') || 'Manage learning activities like quizzes, homework, and training. You can assign them to specific programs, subjects, or classes.'
            },
            {
              text: t('summary_cards') || 'Summary Cards',
              description: t('help_activities_cards') || 'The summary cards at the top show filtered counts. Use the Program/Subject/Class filters to see counts for specific scopes.'
            }
          ]
        },
        {
          title: t('activity_types') || 'Activity Types',
          items: [
            { text: t('quiz') || 'Quiz', description: t('help_activity_quiz') || 'Interactive quizzes with questions and automatic grading. Can be linked to existing quiz templates.' },
            { text: t('homework') || 'Homework', description: t('help_activity_homework') || 'Assignments that students complete and submit for grading.' },
            { text: t('training') || 'Training', description: t('help_activity_training') || 'Practice exercises and learning materials for skill development.' },
            { text: 'Lab & Project', description: t('help_activity_lab') || 'Hands-on projects and laboratory work requiring submission.' }
          ]
        },
        {
          title: t('fields') || 'Fields',
          items: [
            { text: t('activity_id') || 'Activity ID', description: t('help_activity_id') || 'Unique identifier for the activity (e.g., "python-quiz-1"). Required and cannot be changed after creation.' },
            { text: t('title') || 'Title', description: t('help_activity_title') || 'Name of the activity in English (required) and Arabic (optional).' },
            { text: t('description') || 'Description', description: t('help_activity_description') || 'Detailed instructions and information about the activity in both languages.' },
            { text: t('program') || 'Program', description: t('help_activity_program') || 'Optional: Assign to a specific academic program. If selected, only subjects in that program will be available.' },
            { text: t('subject') || 'Subject', description: t('help_activity_subject') || 'Optional: Assign to a specific subject. Requires a program to be selected first.' },
            { text: t('class') || 'Class', description: t('help_activity_class') || 'Optional: Assign to a specific class. Requires a subject to be selected first. Leave empty for general activities visible to all.' },
            { text: t('course') || 'Course', description: t('help_activity_course') || 'Category for organizing activities (e.g., Programming, Computing, Algorithm).' },
            { text: t('type') || 'Type', description: t('help_activity_type') || 'Type of activity: Quiz, Homework, Training, or Lab & Project.' },
            { text: t('difficulty') || 'Difficulty', description: t('help_activity_difficulty') || 'Level of difficulty: Beginner, Intermediate, or Advanced. For quizzes, this can sync from the quiz template.' },
            { text: t('url') || 'URL', description: t('help_activity_url') || 'Link to the activity content. Required for all types except Quiz (which uses quizId).' },
            { text: t('quiz') || 'Quiz', description: t('help_activity_quiz_link') || 'For Quiz type: Link to an existing quiz template. Settings like difficulty and max score can sync from the quiz.' },
            { text: t('due_date') || 'Due Date', description: t('help_activity_duedate') || 'Deadline for students to complete the activity. Optional but recommended.' },
            { text: t('max_score') || 'Max Score', description: t('help_activity_maxscore') || 'Maximum points achievable for this activity. Defaults to 100. For quizzes, can sync from quiz template.' },
            { text: t('image') || 'Image URL', description: t('help_activity_image') || 'Optional image to display with the activity.' }
          ]
        },
        {
          title: t('options') || 'Options & Settings',
          items: [
            { text: t('show_to_students') || 'Show to Students', description: t('help_activity_show') || 'Toggle visibility. When off, students cannot see this activity.' },
            { text: t('allow_retakes') || 'Allow Retakes', description: t('help_activity_retakes') || 'Allow students to retake the activity multiple times. For quizzes, can sync from quiz template.' },
            { text: t('featured') || 'Featured', description: t('help_activity_featured') || 'Highlight this activity as featured on the student dashboard.' },
            { text: t('optional') || 'Optional', description: t('help_activity_optional') || 'Mark as optional. If off, the activity is required.' },
            { text: t('requires_submission') || 'Requires Submission', description: t('help_activity_submission') || 'Students must submit work for this activity to be considered complete.' },
            { text: 'Override Quiz Settings', description: t('help_activity_override') || 'For quiz activities: When enabled, you can override difficulty, max score, and retake settings from the quiz template.' }
          ]
        },
        {
          title: t('notifications') || 'Notifications',
          items: [
            { text: t('send_email_to_students') || 'Send Email to Students', description: t('help_activity_email') || 'Send email notification to students when creating a new activity. Choose language: English, Arabic, or Bilingual.' },
            { text: t('create_announcement') || 'Create Announcement', description: t('help_activity_announcement') || 'Automatically create an announcement for this activity.' }
          ]
        },
        {
          title: t('filters') || 'Filtering',
          items: [
            { text: t('summary_cards_filters') || 'Summary Cards Filters', description: t('help_activities_filter') || 'Use the Program/Subject/Class filters in the summary cards section to filter activities by scope. The activity count and grid will update accordingly.' }
          ]
        }
      ]
    };

    // Resources Help
    content['/dashboard?tab=resources'] = {
      title: t('resources_management') || 'Resources Management',
      content: [
        {
          title: t('overview') || 'Overview',
          items: [
            { 
              text: t('purpose') || 'Purpose', 
              description: t('help.resources') || 'Share supplementary learning materials like documents, videos, and links with your students.'
            },
            {
              text: t('public_vs_targeted') || 'Public vs Targeted Resources',
              description: t('help_resources_scope') || 'Resources can be public (visible to all) or targeted to specific programs, subjects, or classes. Public resources are always included in counts regardless of filters.'
            }
          ]
        },
        {
          title: t('resource_types') || 'Resource Types',
          items: [
            { text: '📄 Document', description: t('help_resource_document') || 'PDFs, Word documents, presentations, and other downloadable files.' },
            { text: '🔗 Link', description: t('help_resource_link') || 'External links to websites, online tools, or learning platforms.' },
            { text: '📺 Video', description: t('help_resource_video') || 'Links to video content on YouTube, Vimeo, or other video platforms.' }
          ]
        },
        {
          title: t('fields') || 'Fields',
          items: [
            { text: t('title') || 'Title', description: t('help_resource_title') || 'Name of the resource in English (required) and Arabic (optional).' },
            { text: t('description') || 'Description', description: t('help_resource_desc') || 'Additional details or instructions about the resource in both languages.' },
            { text: t('type') || 'Type', description: t('help_resource_type') || 'Format of the resource: Document, Link, or Video.' },
            { text: t('url') || 'URL', description: t('help_resource_url') || 'Direct link to the resource content. Required field.' },
            { text: t('program') || 'Program', description: t('help_resource_program') || 'Optional: Target this resource to a specific program. If empty, resource is public. If selected, only subjects in that program will be available.' },
            { text: t('subject') || 'Subject', description: t('help_resource_subject') || 'Optional: Target to a specific subject. Requires a program to be selected first.' },
            { text: t('class') || 'Class', description: t('help_resource_class') || 'Optional: Target to a specific class. Requires a subject to be selected first. If all are empty, resource is public.' },
            { text: t('due_date') || 'Due Date', description: t('help_resource_duedate') || 'Optional deadline for accessing or completing the resource.' }
          ]
        },
        {
          title: t('options') || 'Options',
          items: [
            { text: t('optional_resource') || 'Optional Resource', description: t('help_resource_optional') || 'Mark as optional. If off, the resource is required.' },
            { text: 'Featured Resource', description: t('help_resource_featured') || 'Highlight this resource as featured on the student dashboard.' }
          ]
        },
        {
          title: t('notifications') || 'Notifications',
          items: [
            { text: 'Send Email Notification', description: t('help_resource_email') || 'Send email to relevant users when creating a resource. Public resources notify all users. Targeted resources notify only users in the specified program/subject/class.' },
            { text: 'Create Announcement', description: t('help_resource_announcement') || 'Automatically create an announcement for this resource. Notifications are sent based on resource scope (public vs targeted).' }
          ]
        },
        {
          title: t('filters') || 'Filtering',
          items: [
            { text: t('summary_cards_filters') || 'Summary Cards Filters', description: t('help_resources_filter') || 'Use the Program/Subject/Class filters in the summary cards section to filter resources. Public resources (with no program/subject/class) are always included.' }
          ]
        }
      ]
    };

    // Users Help
    content['/dashboard?tab=users'] = {
      title: t('users_management') || 'Users Management',
      content: [
        {
          title: t('overview') || 'Overview',
          items: [{ text: t('purpose') || 'Purpose', description: t('help_users_purpose') || 'View and manage registered users, update their roles, or impersonate students.' }]
        },
        {
          title: t('actions') || 'Actions',
          items: [
            { text: t('edit_user') || 'Edit User', description: t('help_user_edit') || 'Update user details like display name, real name, and role.' },
            { text: t('impersonate') || 'Impersonate', description: t('help_user_impersonate') || 'View the platform as if you were this student (Student role only).' },
            { text: t('reset_password') || 'Reset Password', description: t('help_user_reset') || 'Send a password reset email to the user.' },
            { text: t('disable_enable') || 'Disable/Enable', description: t('help_user_disable') || 'Temporarily disable a user account or re-enable it.' }
          ]
        }
      ]
    };

    // Allowlist Help
    content['/dashboard?tab=allowlist'] = {
      title: t('allowlist_management') || 'Allowlist Management',
      content: [
        {
          title: t('overview') || 'Overview',
          items: [{ text: t('purpose') || 'Purpose', description: t('help_allowlist_purpose') || 'Control who can register on the platform by managing allowed email addresses.' }]
        },
        {
          title: t('lists') || 'Lists',
          items: [
            { text: t('student_emails') || 'Student Emails', description: t('help_allowlist_student') || 'Emails allowed to register as Students.' },
            { text: t('admin_emails') || 'Admin Emails', description: t('help_allowlist_admin') || 'Emails allowed to register as Admins (with dashboard access).' }
          ]
        }
      ]
    };

    // Programs Help
    content['/dashboard?tab=programs'] = {
      title: t('programs_management') || 'Programs Management',
      content: [
        {
          title: t('overview') || 'Overview',
          items: [{ text: t('purpose') || 'Purpose', description: t('help_programs_purpose') || 'Define top-level academic programs that group related subjects together.' }]
        },
        {
          title: t('fields') || 'Fields',
          items: [
            { text: t('program_id') || 'Program ID', description: t('help_program_id') || 'Unique identifier for the program.' },
            { text: t('name') || 'Name', description: t('help_program_name') || 'Name of the program in English and Arabic.' },
            { text: t('code') || 'Code', description: t('help_program_code') || 'Short code for the program (e.g., CS, ENG).' }
          ]
        }
      ]
    };

    // Subjects Help
    content['/dashboard?tab=subjects'] = {
      title: t('subjects_management') || 'Subjects Management',
      content: [
        {
          title: t('overview') || 'Overview',
          items: [{ text: t('purpose') || 'Purpose', description: t('help_subjects_purpose') || 'Manage subjects within programs. Subjects are containers for classes and activities.' }]
        },
        {
          title: t('fields') || 'Fields',
          items: [
            { text: t('subject_id') || 'Subject ID', description: t('help_subject_id') || 'Unique identifier for the subject.' },
            { text: t('program') || 'Program', description: t('help_subject_program') || 'The program this subject belongs to.' },
            { text: t('name') || 'Name', description: t('help_subject_name') || 'Name of the subject in English and Arabic.' },
            { text: t('code') || 'Code', description: t('help_subject_code') || 'Course code (e.g., CS101).' }
          ]
        }
      ]
    };

    // Classes Help
    content['/dashboard?tab=classes'] = {
      title: t('classes_management') || 'Classes Management',
      content: [
        {
          title: t('overview') || 'Overview',
          items: [{ text: t('purpose') || 'Purpose', description: t('help_classes_purpose') || 'Create and manage specific class instances for subjects, assigned to instructors and terms.' }]
        },
        {
          title: t('fields') || 'Fields',
          items: [
            { text: t('class_name') || 'Class Name', description: t('help_class_name') || 'Descriptive name for the class.' },
            { text: t('subject') || 'Subject', description: t('help_class_subject') || 'The subject this class teaches.' },
            { text: t('term') || 'Term', description: t('help_class_term') || 'Academic term (e.g., Fall 2024).' },
            { text: t('instructor') || 'Instructor', description: t('help_class_instructor') || 'The primary instructor for this class.' }
          ]
        }
      ]
    };

    // Enrollments Help
    content['/dashboard?tab=enrollments'] = {
      title: t('enrollments_management') || 'Enrollments Management',
      content: [
        {
          title: t('overview') || 'Overview',
          items: [{ text: t('purpose') || 'Purpose', description: t('help_enrollments_purpose') || 'Manage student enrollments in specific classes. Students must be enrolled to see class-specific content.' }]
        },
        {
          title: t('actions') || 'Actions',
          items: [
            { text: t('add_enrollment') || 'Add Enrollment', description: t('help_enrollment_add') || 'Manually enroll a student in a class.' },
            { text: t('filter') || 'Filter', description: t('help_enrollment_filter') || 'Filter enrollments by Program, Subject, or Class.' },
            { text: t('delete') || 'Delete', description: t('help_enrollment_delete') || 'Remove a student from a class.' }
          ]
        }
      ]
    };

    // Manage Enrollments Help
    content['/dashboard?tab=manage-enrollments'] = {
      title: t('manage_enrollments') || 'Manage Enrollments',
      content: [
        {
          title: t('overview') || 'Overview',
          items: [{ text: t('purpose') || 'Purpose', description: t('help_manage_enrollments_purpose') || 'Advanced enrollment management and bulk operations.' }]
        },
        {
          title: t('features') || 'Features',
          items: [
            { text: t('bulk_enroll') || 'Bulk Enroll', description: t('help_bulk_enroll') || 'Enroll multiple students at once.' },
            { text: t('csv_import') || 'CSV Import', description: t('help_csv_import') || 'Import enrollments from a CSV file.' }
          ]
        }
      ]
    };

    // Marks Help
    content['/dashboard?tab=marks'] = {
      title: t('mark_entry') || 'Mark Entry',
      content: [
        {
          title: t('overview') || 'Overview',
          items: [{ text: t('purpose') || 'Purpose', description: t('help_marks_purpose') || 'Enter and manage student marks for various activities and assessments.' }]
        },
        {
          title: t('usage') || 'Usage',
          items: [
            { text: t('select_class') || 'Select Class', description: t('help_marks_select') || 'Choose the class to enter marks for.' },
            { text: t('enter_grades') || 'Enter Grades', description: t('help_marks_enter') || 'Input grades for students in the selected class.' }
          ]
        }
      ]
    };

    // Class Schedule Help
    content['/dashboard?tab=class-schedule'] = {
      title: t('class_schedules') || 'Class Schedule',
      content: [
        {
          title: t('overview') || 'Overview',
          items: [{ text: t('purpose') || 'Purpose', description: t('help_schedule_purpose') || 'View and manage the weekly schedule for all active classes.' }]
        },
        {
          title: t('features') || 'Features',
          items: [
            { text: t('weekly_view') || 'Weekly View', description: t('help_schedule_view') || 'See class timings across the week.' },
            { text: t('manage_slots') || 'Manage Slots', description: t('help_schedule_manage') || 'Add or edit class time slots.' }
          ]
        }
      ]
    };

    // SMTP Help
    content['/dashboard?tab=smtp'] = {
      title: t('smtp_configuration') || 'SMTP Configuration',
      content: [
        {
          title: t('overview') || 'Overview',
          items: [{ text: t('purpose') || 'Purpose', description: t('help_smtp_purpose') || 'Configure the outgoing email server (SMTP) settings for system notifications and newsletters.' }]
        },
        {
          title: t('fields') || 'Fields',
          items: [
            { text: t('host') || 'Host', description: t('help_smtp_host') || 'SMTP server address (e.g., smtp.gmail.com).' },
            { text: t('port') || 'Port', description: t('help_smtp_port') || 'SMTP port (usually 587 or 465).' },
            { text: t('user') || 'User', description: t('help_smtp_user') || 'Email address used for authentication.' },
            { text: t('password') || 'Password', description: t('help_smtp_pass') || 'App password or email password.' }
          ]
        }
      ]
    };

    // Email Templates Help
    content['/dashboard?tab=emailTemplates'] = {
      title: t('email_templates') || 'Email Templates',
      content: [
        {
          title: t('overview') || 'Overview',
          items: [{ text: t('purpose') || 'Purpose', description: t('help_templates_purpose') || 'Manage email templates for various system notifications.' }]
        },
        {
          title: t('usage') || 'Usage',
          items: [
            { text: t('edit_template') || 'Edit Template', description: t('help_template_edit') || 'Customize the content and design of email notifications.' },
            { text: t('variables') || 'Variables', description: t('help_template_vars') || 'Use dynamic variables like {{name}} to personalize emails.' }
          ]
        }
      ]
    };

    // Email Logs Help
    content['/dashboard?tab=emailLogs'] = {
      title: t('email_logs') || 'Email Logs',
      content: [
        {
          title: t('overview') || 'Overview',
          items: [{ text: t('purpose') || 'Purpose', description: t('help_logs_purpose') || 'View a complete history of all emails sent by the system.' }]
        },
        {
          title: t('details') || 'Details',
          items: [
            { text: t('status') || 'Status', description: t('help_logs_status') || 'Check if emails were sent successfully or failed.' },
            { text: t('recipient') || 'Recipient', description: t('help_logs_recipient') || 'See who received the email.' }
          ]
        }
      ]
    };

    // Scheduled Reports Help
    content['/dashboard?tab=scheduled-reports'] = {
      title: t('scheduled_reports') || 'Scheduled Reports',
      content: [
        {
          title: t('overview') || 'Overview',
          items: [{ text: t('purpose') || 'Purpose', description: t('help_reports_purpose') || 'Configure and view automated reports sent to stakeholders.' }]
        },
        {
          title: t('features') || 'Features',
          items: [
            { text: t('frequency') || 'Frequency', description: t('help_reports_freq') || 'Set how often reports are generated (e.g., Weekly, Monthly).' },
            { text: t('recipients') || 'Recipients', description: t('help_reports_recipients') || 'Define who receives the reports.' }
          ]
        }
      ]
    };

    // Categories Help
    content['/dashboard?tab=categories'] = {
      title: t('categories_management') || 'Categories Management',
      content: [
        {
          title: t('overview') || 'Overview',
          items: [{ text: t('purpose') || 'Purpose', description: t('help_categories_purpose') || 'Manage content categories that drive the activity organization and home page tabs.' }]
        },
        {
          title: t('fields') || 'Fields',
          items: [
            { text: t('id') || 'ID', description: t('help_category_id') || 'Unique identifier for the category (e.g., "programming").' },
            { text: t('name') || 'Name', description: t('help_category_name') || 'Display name in English and Arabic.' },
            { text: t('order') || 'Order', description: t('help_category_order') || 'Sort order for display.' }
          ]
        }
      ]
    };

    // Submissions Help
    content['/dashboard?tab=submissions'] = {
      title: t('submissions_management') || 'Submissions Management',
      content: [
        {
          title: t('overview') || 'Overview',
          items: [{ text: t('purpose') || 'Purpose', description: t('help_submissions_purpose') || 'View and grade student submissions for activities, quizzes, and assignments. Filter by activity, student, status, or score.' }]
        },
        {
          title: t('filters') || 'Filters',
          items: [
            { text: t('activity') || 'Activity', description: t('help_submissions_activity') || 'Filter submissions by specific activity or quiz.' },
            { text: t('student') || 'Student', description: t('help_submissions_student') || 'View submissions from a specific student.' },
            { text: t('status') || 'Status', description: t('help_submissions_status') || 'Filter by submission status: Pending, Graded, or Late.' },
            { text: t('score') || 'Score', description: t('help_submissions_score') || 'Filter by whether submissions have been graded or not.' }
          ]
        },
        {
          title: t('actions') || 'Actions',
          items: [
            { text: t('grade') || 'Grade', description: t('help_submissions_grade') || 'Assign a score to a student submission.' },
            { text: t('view_files') || 'View Files', description: t('help_submissions_view') || 'Download or view submitted files.' }
          ]
        }
      ]
    };

    // Login Activity Help
    content['/dashboard?tab=login'] = {
      title: t('login_activity') || 'Login Activity',
      content: [
        {
          title: t('overview') || 'Overview',
          items: [{ text: t('purpose') || 'Purpose', description: t('help_login_purpose') || 'View detailed activity logs of user logins and system interactions.' }]
        },
        {
          title: t('filters') || 'Filters',
          items: [
            { text: t('activity_type') || 'Activity Type', description: t('help_login_type') || 'Filter by type of activity (e.g., Login, Quiz Started).' },
            { text: t('user') || 'User', description: t('help_login_user') || 'Filter logs for a specific user.' },
            { text: t('date_range') || 'Date Range', description: t('help_login_date') || 'View logs within a specific time period.' }
          ]
        }
      ]
    };
    
    // Add available resources to each route's content if available
    if (availableResources) {
      Object.keys(content).forEach(route => {
        if (content[route] && Array.isArray(content[route].content)) {
          content[route].content = [...content[route].content, availableResources];
        }
      });
    }
    
    return { content, defaultHelp, availableResources: availableResources || { title: '', items: [] } };
  }, [t, lang]);
  

  // Get help content for the current route
  const getHelpForRoute = useCallback((pathname, search = '', hash = '') => {
    if (!pathname) return defaultHelp; // Always return default if no pathname

    console.log(`[HelpContext] Getting help content for path: ${pathname}${search}${hash}`);

    let help = null;
    const searchParams = new URLSearchParams(search);
    const tabFromUrl = searchParams.get('tab');
    
    // Also check hash for tab navigation (e.g., #programs, #subjects)
    const hashToTabMap = {
      '#programs': 'programs',
      '#subjects': 'subjects',
      '#classes': 'classes',
      '#enrollments': 'manage-enrollments',
      '#marks': 'marks',
      '#class-schedule': 'class-schedule'
    };
    const tabFromHash = hashToTabMap[hash];

    if (pathname === '/dashboard' && (tabFromUrl || tabFromHash)) {
      // Case 1: Specific dashboard tab help
      const tab = tabFromUrl || tabFromHash;
      const helpKey = `/dashboard?tab=${tab}`;
      console.log(`[HelpContext] getHelpForRoute - Case 1: helpKey = ${helpKey}`);
      help = helpContent[helpKey];
      console.log(`[HelpContext] getHelpForRoute - Case 1: helpContent[helpKey] =`, help);
      if (!help) {
        console.warn(`[HelpContext] No specific help content found for dashboard tab: ${tab}`);
      }
    } else if (pathname === '/dashboard') {
      // Case 2: General dashboard help (no specific tab)
      help = helpContent['/dashboard'];
      console.log(`[HelpContext] getHelpForRoute - Case 2: helpContent['/dashboard'] =`, help);
    } else {
      // Case 3: Other specific routes
      help = helpContent[pathname];
      // Additional logic for parent routes like /hr-penalties if needed
      if (!help && pathname.includes('/hr-')) {
        help = helpContent['/hr-penalties'];
      }
    }
    console.log(`[HelpContext] getHelpForRoute - Before final fallback: help =`, help);

    // Case 4: Fallback to defaultHelp if no specific help content found
    help = help || defaultHelp; // Use defaultHelp directly if 'help' is still null/undefined

    // Ensure we always have a valid help object with all required fields
    const safeHelp = {
      title: help?.title || defaultHelp.title,
      content: Array.isArray(help?.content) ? help.content : defaultHelp.content
    };

    console.log(`[HelpContext] Returning help for path: ${pathname}${search}${hash}`, safeHelp);
    return safeHelp;
  }, [helpContent, defaultHelp]);

  // Update help content when location changes
  useEffect(() => {
    if (location?.pathname) {
      const help = getHelpForRoute(location.pathname, location.search, location.hash);
      console.log(`[HelpContext] Updating help content for route: ${location.pathname}${location.search}${location.hash}`);
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
      const search = e.detail?.search || location.search;
      console.log(`[HelpContext] Processing help request for route: ${route}${search}`);
      
      // Force a re-render by setting a small delay
      setTimeout(() => {
        const hash = e.detail?.hash || location.hash || '';
        const help = getHelpForRoute(route, search, hash);
        console.log('[HelpContext] Help content from getHelpForRoute:', help);
        
        if (help) {
          console.log('[HelpContext] Setting current help content:', help);
          setCurrentHelp(help);
          setIsOpen(true);
          console.log('[HelpContext] Help drawer should now be open');
        } else {
          console.warn('[HelpContext] No help content found, using default');
          setCurrentHelp(defaultHelp);
          setIsOpen(true);
        }
      }, 50);
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
          const search = e.detail?.search || location.search;
          const hash = e.detail?.hash || location.hash || '';
          console.log(`[HelpContext] Help drawer is closed, opening for route: ${route}${search}${hash}`);
          const help = getHelpForRoute(route, search, hash);
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
