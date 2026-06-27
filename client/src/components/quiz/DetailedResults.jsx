/**
 * Detailed Results Component (Phase 4.2)
 * Show correct/incorrect answers with explanations and performance breakdown
 */

import React, { useState, useMemo } from 'react';
import { getThemedIcon } from '@constants/iconTypes';
import { Card, CardBody, Badge, Button, Chart } from '@ui';
import { useLang } from '@contexts/LangContext';
import styles from './DetailedResults.module.css';


import { info, error, warn, debug } from '@services/utils/logger.js';

const DetailedResults = ({ 
  quiz, 
  submission, 
  classAverage = null, 
  topScore = null,
  onRetryIncorrect,
  onRetakeQuiz 
}) => {
  const { t } = useLang();
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
                  {t('question_label')} {index + 1}
                  {isCorrect ? (
                    getThemedIcon('ui', 'check_circle', 20)
                  ) : (
                    getThemedIcon('ui', 'x_circle', 20)
                  )}
                </div>
                <div className={styles.questionMeta}>
                  <Badge variant={isCorrect ? 'success' : 'danger'}>
                    {question.points || 1} {isCorrect ? t('earned') : t('missed')}
                  </Badge>
                  <span className={styles.time}>
                    {getThemedIcon('ui', 'clock', 14)} {timeSpent}s
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
                      {isCorrectOption && getThemedIcon('ui', 'check_circle', 16)}
                      {isStudentAnswer && !isCorrectOption && getThemedIcon('ui', 'x_circle', 16)}
                    </div>
                  );
                })}
              </div>

              {question.explanation && (
                <div className={styles.explanation}>
                  <strong>{t('explanation_label')}</strong>
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
            <h3>{t('by_topic')}</h3>
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
            <h3>{t('by_question_type')}</h3>
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
            <h3>{t('by_difficulty')}</h3>
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
                {getThemedIcon('ui', 'refresh_cw', 20)}
                {t('retry_incorrect_questions')}
              </h3>
              <p>{t('you_got_wrong_practice').replace('{count}', stats.incorrectQuestions.length)}</p>
              <Button
                onClick={() => onRetryIncorrect?.(stats.incorrectQuestions)}
                variant="primary"
              >
                {t('practice_incorrect_questions')}
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
              {getThemedIcon('ui', 'target', 32)}
              <div>
                <div className={styles.statLabel}>{t('your_score')}</div>
                <div className={styles.statValue}>{stats.percentage.toFixed(1)}%</div>
              </div>
            </div>
          </CardBody>
        </Card>

        {classAverage && (
          <Card>
            <CardBody>
              <div className={styles.scoreStat}>
                {getThemedIcon('ui', 'trending_up', 32)}
                <div>
                  <div className={styles.statLabel}>{t('class_average')}</div>
                  <div className={styles.statValue}>{classAverage.toFixed(1)}%</div>
                  <Badge variant={stats.percentage >= classAverage ? 'success' : 'warning'}>
                    {stats.percentage >= classAverage ? t('above_average') : t('below_average')}
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
                {getThemedIcon('ui', 'award', 32)}
                <div>
                  <div className={styles.statLabel}>{t('top_score')}</div>
                  <div className={styles.statValue}>{topScore.toFixed(1)}%</div>
                  <Badge variant={stats.percentage === topScore ? 'success' : 'info'}>
                    {stats.percentage === topScore ? t('you_got_top_score') : t('away_from_top').replace('{pct}', (topScore - stats.percentage).toFixed(1))}
                  </Badge>
                </div>
              </div>
            </CardBody>
          </Card>
        )}
      </div>

      <Card>
        <CardBody>
          <h3>{t('study_recommendations')}</h3>
          <div className={styles.recommendations}>
            {Object.entries(stats.byTopic)
              .filter(([, data]) => (data.correct / data.total) < 0.7)
              .map(([topic, data]) => (
                <div key={topic} className={styles.recommendation}>
                  <strong>{topic}</strong>
                  <p>{t('you_got_correct_in_topic').replace('{correct}', data.correct).replace('{total}', data.total)}</p>
                </div>
              ))}
            {Object.entries(stats.byTopic).every(([, data]) => (data.correct / data.total) >= 0.7) && (
              <p>{t('great_job_all_topics')} 🎉</p>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );

  return (
    <div className={styles.detailedResults}>
      <div className={styles.header}>
        <h2>{t('quiz_results')}: {quiz.title}</h2>
        <Button onClick={onRetakeQuiz} variant="outline">
          {getThemedIcon('ui', 'refresh_cw', 16)} {t('retake_quiz')}
        </Button>
      </div>

      <div className={styles.tabs}>
        <button
          onClick={() => setActiveTab('questions')}
          className={`${styles.tab} ${activeTab === 'questions' ? styles.active : ''}`}
        >
          {t('questions_tab')}
        </button>
        <button
          onClick={() => setActiveTab('performance')}
          className={`${styles.tab} ${activeTab === 'performance' ? styles.active : ''}`}
        >
          {t('performance_tab')}
        </button>
        <button
          onClick={() => setActiveTab('comparison')}
          className={`${styles.tab} ${activeTab === 'comparison' ? styles.active : ''}`}
        >
          {t('comparison_tab')}
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
