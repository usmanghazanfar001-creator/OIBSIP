(function () {
  'use strict';

  const resultEl = document.getElementById('result');
  const expressionEl = document.getElementById('expression');
  const keysEl = document.getElementById('keys');

  const MAX_DIGITS = 15;
  const DIV_ZERO_MSG = 'Error: Cannot divide by 0';

  // State
  let tokens = [];            // alternating: number, operator, number, ...
  let current = '0';          // number string currently being typed
  let awaitingOperand = false; // true right after an operator is pressed
  let justEvaluated = false;  // true right after "="
  let errorMsg = '';          // non-empty when in error state

  /* ---------- Calculation logic (no eval) ---------- */

  function compute(a, op, b) {
    if (op === '+') return a + b;
    if (op === '−') return a - b;
    if (op === '×') return a * b;
    if (op === '÷') return b === 0 ? null : a / b; // null signals division by zero
    return b;
  }

  // Respects precedence: × and ÷ first, then + and −.
  // Returns a number, or null on division by zero.
  function evaluate(list) {
    const pass1 = [list[0]];
    for (let i = 1; i < list.length; i += 2) {
      const op = list[i];
      const next = list[i + 1];
      if (op === '×' || op === '÷') {
        const left = pass1.pop();
        const value = compute(left, op, next);
        if (value === null) return null;
        pass1.push(value);
      } else {
        pass1.push(op, next);
      }
    }

    let total = pass1[0];
    for (let i = 1; i < pass1.length; i += 2) {
      total = compute(total, pass1[i], pass1[i + 1]);
    }
    return total;
  }

  function formatNumber(n) {
    if (!isFinite(n)) return 'Error';
    // Trim floating-point noise (0.1 + 0.2 -> 0.3)
    return String(parseFloat(n.toPrecision(12)));
  }

  /* ---------- Display ---------- */

  function render() {
    if (errorMsg) {
      resultEl.textContent = errorMsg;
      resultEl.classList.add('error');
    } else {
      resultEl.textContent = current;
      resultEl.classList.remove('error');
    }
    expressionEl.textContent = tokens.join(' ');
  }

  function resetAll() {
    tokens = [];
    current = '0';
    awaitingOperand = false;
    justEvaluated = false;
    errorMsg = '';
  }

  /* ---------- Actions ---------- */

  function inputDigit(d) {
    if (errorMsg || justEvaluated) resetAll();
    if (awaitingOperand) {
      current = '0';
      awaitingOperand = false;
    }
    if (current.replace(/[-.]/g, '').length >= MAX_DIGITS) return;
    current = current === '0' ? d : current + d;
  }

  function inputDecimal() {
    if (errorMsg || justEvaluated) resetAll();
    if (awaitingOperand) {
      current = '0';
      awaitingOperand = false;
    }
    if (!current.includes('.')) current += '.';
  }

  function inputOperator(op) {
    if (errorMsg) return;

    if (justEvaluated) {
      // Continue calculating from the previous result
      tokens = [Number(current), op];
      justEvaluated = false;
      awaitingOperand = true;
      return;
    }

    if (awaitingOperand) {
      // Operator pressed twice: replace the previous one
      tokens[tokens.length - 1] = op;
      return;
    }

    tokens.push(Number(current), op);
    awaitingOperand = true;
  }

  function equals() {
    if (errorMsg || justEvaluated) return;
    if (tokens.length === 0) return;

    const list = tokens.slice();
    if (awaitingOperand) {
      list.pop(); // drop dangling operator, e.g. "5 +" =
    } else {
      list.push(Number(current));
    }

    const value = evaluate(list);
    if (value === null) {
      errorMsg = DIV_ZERO_MSG;
      tokens = [];
      awaitingOperand = false;
      justEvaluated = false;
      return;
    }

    expressionEl.textContent = list.join(' ') + ' =';
    current = formatNumber(value);
    tokens = [];
    awaitingOperand = false;
    justEvaluated = true;
    resultEl.textContent = current;
    resultEl.classList.remove('error');
    // keep the "... =" expression visible
    renderKeepExpression = true;
  }

  function backspace() {
    if (errorMsg || justEvaluated) {
      resetAll();
      return;
    }
    if (awaitingOperand) {
      // Undo the operator and go back to editing the previous number
      tokens.pop();
      current = formatNumber(tokens.pop());
      awaitingOperand = false;
      return;
    }
    current = current.slice(0, -1);
    if (current === '' || current === '-') current = '0';
  }

  let renderKeepExpression = false;

  function handle(action, value) {
    switch (action) {
      case 'digit':     inputDigit(value); break;
      case 'decimal':   inputDecimal(); break;
      case 'operator':  inputOperator(value); break;
      case 'equals':    equals(); break;
      case 'clear':     resetAll(); break;
      case 'backspace': backspace(); break;
    }
    if (renderKeepExpression) {
      renderKeepExpression = false; // equals() already painted the display
    } else {
      render();
    }
  }

  /* ---------- Event listeners ---------- */

  keysEl.addEventListener('click', function (e) {
    const btn = e.target.closest('button');
    if (!btn) return;
    handle(btn.dataset.action, btn.dataset.value);
  });

  const KEY_OPERATORS = { '+': '+', '-': '−', '*': '×', '/': '÷' };

  document.addEventListener('keydown', function (e) {
    const k = e.key;
    if (/^[0-9]$/.test(k)) handle('digit', k);
    else if (k === '.' || k === ',') handle('decimal');
    else if (KEY_OPERATORS[k]) { e.preventDefault(); handle('operator', KEY_OPERATORS[k]); }
    else if (k === 'Enter' || k === '=') { e.preventDefault(); handle('equals'); }
    else if (k === 'Backspace') handle('backspace');
    else if (k === 'Escape' || k === 'Delete' || k.toLowerCase() === 'c') handle('clear');
  });

  render();
})();
