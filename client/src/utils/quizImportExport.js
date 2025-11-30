/**
 * Quiz Import/Export Utilities (Phase 3.6)
 */

import Papa from 'papaparse';
import { QUESTION_TYPES } from './questionTypes';

/**
 * Export quiz to CSV
 */
export function exportToCSV(quiz) {
  const rows = [
    ['Question', 'Type', 'Points', 'Option 1', 'Option 2', 'Option 3', 'Option 4', 'Correct Answer(s)', 'Explanation', 'Tags']
  ];
  
  quiz.questions.forEach(q => {
    const options = q.options || [];
    const correctAnswers = options
      .filter(opt => opt.correct)
      .map(opt => opt.text)
      .join('; ');
    
    rows.push([
      q.question,
      q.type,
      q.points || 1,
      options[0]?.text || '',
      options[1]?.text || '',
      options[2]?.text || '',
      options[3]?.text || '',
      correctAnswers,
      q.explanation || '',
      q.tags?.join('; ') || ''
    ]);
  });
  
  const csv = Papa.unparse(rows);
  downloadFile(csv, `${quiz.title || 'quiz'}.csv`, 'text/csv');
  
  return { success: true };
}

/**
 * Import quiz from CSV
 */
export function importFromCSV(csvText) {
  try {
    const parsed = Papa.parse(csvText, { header: true });
    const questions = [];
    
    parsed.data.forEach((row, index) => {
      if (!row.Question) return;
      
      const options = [
        row['Option 1'],
        row['Option 2'],
        row['Option 3'],
        row['Option 4']
      ]
        .filter(opt => opt && opt.trim())
        .map((text, i) => ({
          id: `opt_${index}_${i}`,
          text,
          correct: row['Correct Answer(s)']?.includes(text)
        }));
      
      questions.push({
        id: `q_${index}`,
        question: row.Question,
        type: row.Type || QUESTION_TYPES.SINGLE_CHOICE,
        points: parseInt(row.Points) || 1,
        options,
        explanation: row.Explanation || '',
        tags: row.Tags ? row.Tags.split(';').map(t => t.trim()) : []
      });
    });
    
    return { success: true, data: questions };
  } catch (error) {
    console.error('Error importing CSV:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Export quiz to JSON
 */
export function exportToJSON(quiz) {
  const json = JSON.stringify(quiz, null, 2);
  downloadFile(json, `${quiz.title || 'quiz'}.json`, 'application/json');
  return { success: true };
}

/**
 * Import quiz from JSON
 */
export function importFromJSON(jsonText) {
  try {
    const quiz = JSON.parse(jsonText);
    return { success: true, data: quiz };
  } catch (error) {
    console.error('Error importing JSON:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Export to QTI format (IMS Question & Test Interoperability)
 */
export function exportToQTI(quiz) {
  const xml = generateQTIXML(quiz);
  downloadFile(xml, `${quiz.title || 'quiz'}.xml`, 'application/xml');
  return { success: true };
}

/**
 * Generate QTI XML
 */
function generateQTIXML(quiz) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<questestinterop>\n';
  xml += `  <assessment title="${escapeXML(quiz.title)}">\n`;
  
  quiz.questions.forEach((q, index) => {
    xml += `    <item ident="q_${index}" title="${escapeXML(q.question)}">\n`;
    xml += `      <presentation>\n`;
    xml += `        <material>\n`;
    xml += `          <mattext texttype="text/plain">${escapeXML(q.question)}</mattext>\n`;
    xml += `        </material>\n`;
    xml += `        <response_lid ident="response_${index}" rcardinality="Single">\n`;
    xml += `          <render_choice>\n`;
    
    q.options?.forEach((opt, optIndex) => {
      xml += `            <response_label ident="opt_${optIndex}">\n`;
      xml += `              <material>\n`;
      xml += `                <mattext texttype="text/plain">${escapeXML(opt.text)}</mattext>\n`;
      xml += `              </material>\n`;
      xml += `            </response_label>\n`;
    });
    
    xml += `          </render_choice>\n`;
    xml += `        </response_lid>\n`;
    xml += `      </presentation>\n`;
    
    // Add correct answers
    const correctOpts = q.options?.filter(opt => opt.correct) || [];
    xml += `      <resprocessing>\n`;
    correctOpts.forEach((opt, optIndex) => {
      xml += `        <respcondition>\n`;
      xml += `          <conditionvar>\n`;
      xml += `            <varequal respident="response_${index}">${q.options.indexOf(opt)}</varequal>\n`;
      xml += `          </conditionvar>\n`;
      xml += `          <setvar action="Set" varname="SCORE">${q.points || 1}</setvar>\n`;
      xml += `        </respcondition>\n`;
    });
    xml += `      </resprocessing>\n`;
    
    xml += `    </item>\n`;
  });
  
  xml += `  </assessment>\n`;
  xml += `</questestinterop>\n`;
  
  return xml;
}

/**
 * Import from Google Forms (requires exported JSON format)
 */
export function importFromGoogleForms(googleFormsData) {
  try {
    const questions = googleFormsData.items.map((item, index) => {
      const question = {
        id: `gf_${index}`,
        question: item.title,
        type: mapGoogleFormsType(item.questionItem?.question?.choiceQuestion?.type),
        points: item.questionItem?.question?.grading?.pointValue || 1,
        options: [],
        explanation: item.description || ''
      };
      
      const choices = item.questionItem?.question?.choiceQuestion?.options || [];
      question.options = choices.map((choice, i) => ({
        id: `opt_${index}_${i}`,
        text: choice.value,
        correct: choice.isCorrect || false
      }));
      
      return question;
    });
    
    return { success: true, data: questions };
  } catch (error) {
    console.error('Error importing from Google Forms:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Map Google Forms question types to our types
 */
function mapGoogleFormsType(gfType) {
  const typeMap = {
    'RADIO': QUESTION_TYPES.SINGLE_CHOICE,
    'CHECKBOX': QUESTION_TYPES.MULTIPLE_CHOICE,
    'DROP_DOWN': QUESTION_TYPES.SINGLE_CHOICE,
    'SHORT_ANSWER': QUESTION_TYPES.SHORT_ANSWER,
    'PARAGRAPH': QUESTION_TYPES.ESSAY
  };
  return typeMap[gfType] || QUESTION_TYPES.SINGLE_CHOICE;
}

/**
 * Bulk import questions from Excel
 */
export async function importFromExcel(file) {
  try {
    // This would require xlsx library in production
    // For now, convert to CSV first
    return { 
      success: false, 
      error: 'Excel import requires xlsx library. Please convert to CSV first.' 
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Download file helper
 */
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Escape XML special characters
 */
function escapeXML(str) {
  return (str || '').replace(/[<>&'"]/g, (char) => {
    const entities = {
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      "'": '&apos;',
      '"': '&quot;'
    };
    return entities[char];
  });
}

/**
 * Quiz template library
 */
export const QUIZ_TEMPLATES = [
  {
    id: 'multiple-choice',
    name: 'Multiple Choice Quiz',
    description: 'Standard multiple choice quiz with 4 options',
    icon: '📝',
    template: {
      settings: {
        timeLimit: 30,
        passingScore: 70,
        showAnswers: true,
        allowRetake: false
      }
    }
  },
  {
    id: 'true-false',
    name: 'True/False Quiz',
    description: 'Quick true or false assessment',
    icon: '✓✗',
    template: {
      settings: {
        timeLimit: 15,
        passingScore: 80,
        showAnswers: true,
        allowRetake: true
      }
    }
  },
  {
    id: 'mixed-assessment',
    name: 'Mixed Assessment',
    description: 'Combination of multiple question types',
    icon: '🎯',
    template: {
      settings: {
        timeLimit: 45,
        passingScore: 75,
        showAnswers: false,
        allowRetake: false
      }
    }
  },
  {
    id: 'practice-quiz',
    name: 'Practice Quiz',
    description: 'Unlimited attempts with instant feedback',
    icon: '📚',
    template: {
      settings: {
        timeLimit: 0,
        passingScore: 0,
        showAnswers: true,
        allowRetake: true,
        maxAttempts: -1,
        instantFeedback: true
      }
    }
  }
];
