/**
 * Detailed Results Component (Phase 4.2)
 * Show correct/incorrect answers with explanations and performance breakdown
 */

import React, { useState, useMemo } from 'react';
import { CheckCircle, XCircle, Clock, Award, TrendingUp, Target, RefreshCw } from 'lucide-react';
import { Card, CardBody, Badge, Button, Chart } from '../ui';
import styles from './DetailedResults.module.css';

const DetailedResults = ({ 
  quiz, 
  submission, 
  classAverage = null, 
  topScore = null,
  onRetryIncorrect,
  onRetakeQuiz 
}) => {
  const [activeTab, setActiveTab] = useState('questions'); // 'questions' | 'performance' | 'comparison'

  // Calculate detailed statistics
  const stats = useMemo(() => {
    if (!quiz || !submission) return null;

    const byTopic = {};
    const byType = {};
    const byDifficulty = {};
    const incorrectQuestions = [];

    quiz.questions.forEach((q, index) => {
      const studentAnswer = submission.answers?.[q.id];
      const isCorrect = studentAnswer?.isCorrect || false;
      const timeSpent = studentAnswer?.timeSpent || 0;

      // Group by topic
      const topic = q.topic || 'General';
      if (!byTopic[topic]) {
        byTopic[topic] = { correct: 0, total: 0, timeSpent: 0 };
      }
      byTopic[topic].total++;
      byTopic[topic].timeSpent += timeSpent;
      if (isCorrect) byTopic[topic].correct++;

      // Group by type
      const type = q.type || 'multiple_choice';
      if (!byType[type]) {
        byType[type] = { correct: 0, total: 0 };
      }
      byType[type].total++;
      if (isCorrect) byType[type].correct++;

      // Group by difficulty
      const difficulty = q.difficulty || 'medium';
      if (!byDifficulty[difficulty]) {
        byDifficulty[difficulty] = { correct: 0, total: 0 };
      }
      byDifficulty[difficulty].total++;
      if (isCorrect) byDifficulty[difficulty].correct++;

      // Track incorrect questions
      if (!isCorrect) {
        incorrectQuestions.push({ ...q, questionIndex: index, timeSpent });
      }
    });

    return {
      byTopic,
      byType,
      byDifficulty,
      incorrectQuestions,
      totalCorrect: submission.score || 0,
      totalQuestions: quiz.questions.length,
      percentage: submission.percentage || 0,
      timeSpent: submission.timeSpent || 0
    };
  }, [quiz, submission]);

  if (!stats) return null;

  const renderQuestionsTab = () => (
    <div className={styles.questionsTab}>
      {quiz.questions.map((question, index) => {
        const studentAnswer = submission.answers?.[question.id];
        const isCorrect = studentAnswer?.isCorrect || false;
        const timeSpent = studentAnswer?.timeSpent || 0;

        return (
          <Card key={question.id} className={styles.questionCard}>
            <CardBody>
              <div className={styles.questionHeader}>
                <div className={styles.questionNumber}>
                  Question {index + 1}
                  {isCorrect ? (
                    <CheckCircle size={20} className={styles.correct} />
                  ) : (
                    <XCircle size={20} className={styles.incorrect} />
                  )}
                </div>
                <div className={styles.questionMeta}>
                  <Badge variant={isCorrect ? 'success' : 'danger'}>
                    {question.points || 1} {isCorrect ? 'earned' : 'missed'}
                  </Badge>
                  <span className={styles.time}>
                    <Clock size={14} /> {timeSpent}s
                  </span>
                </div>
              </div>

              <div 
                className={styles.questionText}
                dangerouslySetInnerHTML={{ __html: question.question }}
              />

              {question.image && (
                <img src={question.image} alt="Question" className={styles.questionImage} />
              )}

              <div className={styles.options}>
                {question.options?.map((option) => {
                  const isStudentAnswer = Array.isArray(studentAnswer?.answer)
                    ? studentAnswer.answer.includes(option.id)
                    : studentAnswer?.answer === option.id;
                  
                  const isCorrectOption = option.correct;
                  
                  let optionClass = styles.option;
                  if (isStudentAnswer && isCorrectOption) {
                    optionClass += ` ${styles.correctAnswer}`;
                  } else if (isStudentAnswer && !isCorrectOption) {
                    optionClass += ` ${styles.wrongAnswer}`;
                  } else if (isCorrectOption) {
                    optionClass += ` ${styles.correctOption}`;
                  }

                  return (
                    <div key={option.id} className={optionClass}>
                      <div 
                        className={styles.optionText}
                        dangerouslySetInnerHTML={{ __html: option.text }}
                      />
                      {isCorrectOption && <CheckCircle size={16} />}
                      {isStudentAnswer && !isCorrectOption && <XCircle size={16} />}
                    </div>
                  );
                })}
              </div>

              {question.explanation && (
                <div className={styles.explanation}>
                  <strong>Explanation:</strong>
                  <div dangerouslySetInnerHTML={{ __html: question.explanation }} />
                </div>
              )}
            </CardBody>
          </Card>
        );
      })}
    </div>
  );

  const renderPerformanceTab = () => (
    <div className={styles.performanceTab}>
      <div className={styles.statsGrid}>
        <Card>
          <CardBody>
            <h3>By Topic</h3>
            <Chart
              type="bar"
              data={Object.entries(stats.byTopic).map(([topic, data]) => ({
                name: topic,
                score: (data.correct / data.total) * 100
              }))}
              xKey="name"
              yKeys={['score']}
              height={200}
            />
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h3>By Question Type</h3>
            <div className={styles.typeBreakdown}>
              {Object.entries(stats.byType).map(([type, data]) => (
                <div key={type} className={styles.typeItem}>
                  <span>{type.replace('_', ' ').toUpperCase()}</span>
                  <Badge variant={data.correct / data.total >= 0.7 ? 'success' : 'warning'}>
                    {data.correct}/{data.total}
                  </Badge>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h3>By Difficulty</h3>
            <div className={styles.difficultyBreakdown}>
              {Object.entries(stats.byDifficulty).map(([difficulty, data]) => {
                const percentage = (data.correct / data.total) * 100;
                return (
                  <div key={difficulty} className={styles.difficultyItem}>
                    <div className={styles.difficultyLabel}>
                      <span>{difficulty.toUpperCase()}</span>
                      <span>{percentage.toFixed(0)}%</span>
                    </div>
                    <div className={styles.progressBar}>
                      <div 
                        className={styles.progressFill} 
                        style={{ 
                          width: `${percentage}%`,
                          background: percentage >= 70 ? '#10b981' : percentage >= 50 ? '#f59e0b' : '#ef4444'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      </div>

      {stats.incorrectQuestions.length > 0 && (
        <Card>
          <CardBody>
            <div className={styles.retrySection}>
              <h3>
                <RefreshCw size={20} />
                Retry Incorrect Questions
              </h3>
              <p>You got {stats.incorrectQuestions.length} questions wrong. Practice these to improve!</p>
              <Button
                onClick={() => onRetryIncorrect?.(stats.incorrectQuestions)}
                variant="primary"
              >
                Practice Incorrect Questions
              </Button>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );

  const renderComparisonTab = () => (
    <div className={styles.comparisonTab}>
      <div className={styles.comparisonGrid}>
        <Card>
          <CardBody>
            <div className={styles.scoreStat}>
              <Target size={32} />
              <div>
                <div className={styles.statLabel}>Your Score</div>
                <div className={styles.statValue}>{stats.percentage.toFixed(1)}%</div>
              </div>
            </div>
          </CardBody>
        </Card>

        {classAverage && (
          <Card>
            <CardBody>
              <div className={styles.scoreStat}>
                <TrendingUp size={32} />
                <div>
                  <div className={styles.statLabel}>Class Average</div>
                  <div className={styles.statValue}>{classAverage.toFixed(1)}%</div>
                  <Badge variant={stats.percentage >= classAverage ? 'success' : 'warning'}>
                    {stats.percentage >= classAverage ? 'Above Average' : 'Below Average'}
                  </Badge>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {topScore && (
          <Card>
            <CardBody>
              <div className={styles.scoreStat}>
                <Award size={32} />
                <div>
                  <div className={styles.statLabel}>Top Score</div>
                  <div className={styles.statValue}>{topScore.toFixed(1)}%</div>
                  <Badge variant={stats.percentage === topScore ? 'success' : 'info'}>
                    {stats.percentage === topScore ? 'You got the top score!' : `${(topScore - stats.percentage).toFixed(1)}% away`}
                  </Badge>
                </div>
              </div>
            </CardBody>
          </Card>
        )}
      </div>

      <Card>
        <CardBody>
          <h3>Study Recommendations</h3>
          <div className={styles.recommendations}>
            {Object.entries(stats.byTopic)
              .filter(([, data]) => (data.correct / data.total) < 0.7)
              .map(([topic, data]) => (
                <div key={topic} className={styles.recommendation}>
                  <strong>{topic}</strong>
                  <p>You got {data.correct}/{data.total} questions correct in this topic. Consider reviewing this material.</p>
                </div>
              ))}
            {Object.entries(stats.byTopic).every(([, data]) => (data.correct / data.total) >= 0.7) && (
              <p>Great job! You're performing well across all topics. 🎉</p>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );

  return (
    <div className={styles.detailedResults}>
      <div className={styles.header}>
        <h2>Quiz Results: {quiz.title}</h2>
        <Button onClick={onRetakeQuiz} variant="outline">
          <RefreshCw size={16} /> Retake Quiz
        </Button>
      </div>

      <div className={styles.tabs}>
        <button
          onClick={() => setActiveTab('questions')}
          className={`${styles.tab} ${activeTab === 'questions' ? styles.active : ''}`}
        >
          Questions
        </button>
        <button
          onClick={() => setActiveTab('performance')}
          className={`${styles.tab} ${activeTab === 'performance' ? styles.active : ''}`}
        >
          Performance
        </button>
        <button
          onClick={() => setActiveTab('comparison')}
          className={`${styles.tab} ${activeTab === 'comparison' ? styles.active : ''}`}
        >
          Comparison
        </button>
      </div>

      <div className={styles.tabContent}>
        {activeTab === 'questions' && renderQuestionsTab()}
        {activeTab === 'performance' && renderPerformanceTab()}
        {activeTab === 'comparison' && renderComparisonTab()}
      </div>
    </div>
  );
};

export default DetailedResults;
