/**
 * Built-in Calculator Component (Phase 4.1)
 * Scientific calculator for math quizzes
 */

import React, { useState, useEffect } from 'react';
import { X, Delete } from 'lucide-react';
import { Button } from '../ui';
import { ActivityLogger } from '../../firebase/activityLogger';
import styles from './Calculator.module.css';

const Calculator = ({ onClose }) => {
  // Log activity when calculator opens
  useEffect(() => {
    ActivityLogger.calculatorOpened();
  }, []);

  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState(null);
  const [operation, setOperation] = useState(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const inputDigit = (digit) => {
    if (waitingForOperand) {
      setDisplay(String(digit));
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? String(digit) : display + digit);
    }
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
    } else if (display.indexOf('.') === -1) {
      setDisplay(display + '.');
    }
  };

  const clear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  const performOperation = (nextOperation) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      const newValue = calculate(currentValue, inputValue, operation);
      
      setDisplay(String(newValue));
      setPreviousValue(newValue);
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  };

  const calculate = (firstValue, secondValue, operation) => {
    switch (operation) {
      case '+':
        return firstValue + secondValue;
      case '-':
        return firstValue - secondValue;
      case '*':
        return firstValue * secondValue;
      case '/':
        return firstValue / secondValue;
      case '%':
        return firstValue % secondValue;
      default:
        return secondValue;
    }
  };

  const performEquals = () => {
    const inputValue = parseFloat(display);

    if (previousValue !== null && operation) {
      const newValue = calculate(previousValue, inputValue, operation);
      setDisplay(String(newValue));
      setPreviousValue(null);
      setOperation(null);
      setWaitingForOperand(true);
    }
  };

  const performFunction = (func) => {
    const inputValue = parseFloat(display);
    let result;

    switch (func) {
      case 'sqrt':
        result = Math.sqrt(inputValue);
        break;
      case 'square':
        result = inputValue * inputValue;
        break;
      case 'sin':
        result = Math.sin(inputValue);
        break;
      case 'cos':
        result = Math.cos(inputValue);
        break;
      case 'tan':
        result = Math.tan(inputValue);
        break;
      case 'log':
        result = Math.log10(inputValue);
        break;
      case 'ln':
        result = Math.log(inputValue);
        break;
      case 'pi':
        result = Math.PI;
        break;
      case 'e':
        result = Math.E;
        break;
      default:
        result = inputValue;
    }

    setDisplay(String(result));
    setWaitingForOperand(true);
  };

  return (
    <div className={styles.calculator}>
      <div className={styles.header}>
        <h3>Calculator</h3>
        <button onClick={onClose} className={styles.closeBtn}>
          <X size={18} />
        </button>
      </div>

      <div className={styles.display}>{display}</div>

      <div className={styles.buttons}>
        {/* Scientific functions */}
        <button onClick={() => performFunction('sin')} className={styles.function}>sin</button>
        <button onClick={() => performFunction('cos')} className={styles.function}>cos</button>
        <button onClick={() => performFunction('tan')} className={styles.function}>tan</button>
        <button onClick={clear} className={styles.clear}>AC</button>

        <button onClick={() => performFunction('sqrt')} className={styles.function}>√</button>
        <button onClick={() => performFunction('square')} className={styles.function}>x²</button>
        <button onClick={() => performFunction('log')} className={styles.function}>log</button>
        <button onClick={() => performOperation('%')} className={styles.operator}>%</button>

        <button onClick={() => performFunction('pi')} className={styles.function}>π</button>
        <button onClick={() => performFunction('e')} className={styles.function}>e</button>
        <button onClick={() => performFunction('ln')} className={styles.function}>ln</button>
        <button onClick={() => performOperation('/')} className={styles.operator}>÷</button>

        {/* Number pad */}
        <button onClick={() => inputDigit(7)}>7</button>
        <button onClick={() => inputDigit(8)}>8</button>
        <button onClick={() => inputDigit(9)}>9</button>
        <button onClick={() => performOperation('*')} className={styles.operator}>×</button>

        <button onClick={() => inputDigit(4)}>4</button>
        <button onClick={() => inputDigit(5)}>5</button>
        <button onClick={() => inputDigit(6)}>6</button>
        <button onClick={() => performOperation('-')} className={styles.operator}>−</button>

        <button onClick={() => inputDigit(1)}>1</button>
        <button onClick={() => inputDigit(2)}>2</button>
        <button onClick={() => inputDigit(3)}>3</button>
        <button onClick={() => performOperation('+')} className={styles.operator}>+</button>

        <button onClick={() => inputDigit(0)} className={styles.zero}>0</button>
        <button onClick={inputDecimal}>.</button>
        <button onClick={performEquals} className={styles.equals}>=</button>
      </div>
    </div>
  );
};

export default Calculator;
