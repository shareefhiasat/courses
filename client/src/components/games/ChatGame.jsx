import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, CheckCircle, XCircle } from 'lucide-react';
import { useLang } from '../../contexts/LangContext';

const ChatGame = ({ questions, settings, onComplete }) => {
    const { t, lang } = useLang();
    const [messages, setMessages] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [isTyping, setIsTyping] = useState(false);
    const [userInput, setUserInput] = useState('');
    const [gameOver, setGameOver] = useState(false);
    const messagesEndRef = useRef(null);

    const currentQuestion = questions[currentQuestionIndex];

    useEffect(() => {
        if (questions.length > 0 && messages.length === 0) {
            // Start the game with a greeting and the first question
            addBotMessage(t('chatQuizIntro', "Hi! I'm your quiz bot. Let's start!"));
            setTimeout(() => askQuestion(0), 1000);
        }
    }, [questions]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const addBotMessage = (text, type = 'text', options = null) => {
        setIsTyping(true);
        setTimeout(() => {
            setIsTyping(false);
            setMessages(prev => [...prev, {
                id: Date.now(),
                sender: 'bot',
                text,
                type,
                options,
                timestamp: new Date()
            }]);
        }, 800); // Simulate typing delay
    };

    const addUserMessage = (text) => {
        setMessages(prev => [...prev, {
            id: Date.now(),
            sender: 'user',
            text,
            timestamp: new Date()
        }]);
    };

    const askQuestion = (index) => {
        if (index >= questions.length) {
            finishGame();
            return;
        }
        const q = questions[index];
        addBotMessage(q.question, 'question', q.options);
    };

    const handleAnswer = (answerText, optionId) => {
        if (gameOver) return;

        addUserMessage(answerText);

        const q = questions[currentQuestionIndex];
        let isCorrect = false;

        // Check correctness
        if (optionId) {
            const selectedOption = q.options.find(o => o.id === optionId);
            isCorrect = selectedOption?.correct;
        } else {
            const correctOption = q.options.find(o => o.correct);
            isCorrect = correctOption?.text.toLowerCase() === answerText.toLowerCase();
        }

        if (isCorrect) {
            setScore(prev => prev + (q.points || 1));
            setTimeout(() => addBotMessage(t('correctMsg', "Correct! 🎉"), 'feedback'), 500);
        } else {
            const correctOption = q.options.find(o => o.correct);
            const correctText = correctOption ? correctOption.text : 'Unknown';
            setTimeout(() => addBotMessage(`${t('wrongMsg', "Incorrect.")} 😔 ${settings?.showCorrectAnswers ? `${t('answerWas', 'The answer was')}: ${correctText}` : ''}`, 'feedback'), 500);
        }

        setTimeout(() => {
            const nextIndex = currentQuestionIndex + 1;
            setCurrentQuestionIndex(nextIndex);
            askQuestion(nextIndex);
        }, 2000);
    };

    const finishGame = () => {
        setGameOver(true);

        setTimeout(() => {
            addBotMessage(`${t('gameOver', "Game Over!")} ${t('youScored', 'You scored')} ${score} ${t('outOf', 'out of')} ${questions.reduce((acc, q) => acc + (q.points || 1), 0)}.`);
            setTimeout(() => {
                onComplete?.({ score: score, totalQuestions: questions.length });
            }, 2000);
        }, 1000);
    };

    return (
        <div className="flex flex-col h-[600px] max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-4 shadow-sm z-10">
                <div className="w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
                    <Bot size={28} />
                </div>
                <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">{t('quizBot', 'Quiz Bot')}</h3>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{t('online', 'Online')}</p>
                    </div>
                </div>
                <div className="ml-auto bg-slate-100 dark:bg-slate-800 px-4 py-1.5 rounded-full text-sm font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {t('score', 'Score')}: {score}
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 dark:bg-slate-950" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                    >
                        <div
                            className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${msg.sender === 'user'
                                ? 'bg-violet-600 text-white rounded-tr-none'
                                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-tl-none'
                                }`}
                        >
                            <p className="text-base leading-relaxed">{msg.text}</p>

                            {/* Options Buttons */}
                            {msg.type === 'question' && msg.options && (
                                <div className="mt-4 grid gap-2">
                                    {msg.options.map((opt) => (
                                        <button
                                            key={opt.id}
                                            disabled={currentQuestionIndex > questions.findIndex(q => q.question === msg.text) || gameOver}
                                            onClick={() => handleAnswer(opt.text, opt.id)}
                                            className="w-full text-left px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:border-violet-200 dark:hover:border-violet-700 transition-all text-sm font-medium border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-slate-50 disabled:hover:border-slate-200"
                                        >
                                            {opt.text}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <span className={`text-[10px] mt-2 block text-right ${msg.sender === 'user' ? 'text-violet-200' : 'text-slate-400'}`}>
                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                ))}

                {isTyping && (
                    <div className="flex justify-start animate-in fade-in duration-300">
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl rounded-tl-none border border-slate-200 dark:border-slate-700 shadow-sm flex gap-1.5 items-center">
                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
        </div>
    );
};

export default ChatGame;
