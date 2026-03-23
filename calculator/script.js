let expression = '';
let hasResult = false;
const MAX_DECIMAL_PLACES = 10;

const expressionEl = document.getElementById('expression');
const resultEl = document.getElementById('result');

// Safe math expression parser (no eval / Function constructor)
// Supports: +  -  *  /  %  and decimal numbers
function parseExpression(expr) {
  let pos = 0;

  function parseNumber() {
    let start = pos;
    if (expr[pos] === '-') pos++;
    while (pos < expr.length && /[0-9.]/.test(expr[pos])) pos++;
    if (pos === start || (pos === start + 1 && expr[start] === '-')) {
      throw new Error('Invalid expression');
    }
    return parseFloat(expr.slice(start, pos));
  }

  function parseTerm() {
    let left = parseNumber();
    while (pos < expr.length && /[*/%]/.test(expr[pos])) {
      const op = expr[pos++];
      const right = parseNumber();
      if (op === '*') left *= right;
      else if (op === '/') {
        if (right === 0) throw new Error('Cannot divide by zero');
        left /= right;
      } else {
        if (right === 0) throw new Error('Cannot divide by zero');
        left %= right;
      }
    }
    return left;
  }

  function parseSum() {
    let left = parseTerm();
    while (pos < expr.length && /[+\-]/.test(expr[pos])) {
      const op = expr[pos++];
      // Handle negative number after operator
      const right = parseTerm();
      if (op === '+') left += right;
      else left -= right;
    }
    return left;
  }

  const result = parseSum();
  if (pos !== expr.length) throw new Error('Invalid expression');
  return result;
}

function appendChar(char) {
  const operators = ['+', '-', '*', '/', '%'];

  // If a result was just calculated, start fresh on digit/dot, or continue with operator
  if (hasResult) {
    if (operators.includes(char)) {
      // Continue calculation from the result
      expression = resultEl.textContent;
    } else {
      // Start a new expression
      expression = '';
    }
    hasResult = false;
  }

  const lastChar = expression.slice(-1);

  // Prevent multiple consecutive operators
  if (operators.includes(char) && operators.includes(lastChar)) {
    expression = expression.slice(0, -1);
  }

  // Prevent leading operator (except minus for negative numbers)
  if (expression === '' && operators.includes(char) && char !== '-') {
    return;
  }

  // Prevent multiple decimal points in the same number
  if (char === '.') {
    const parts = expression.split(/[+\-*/%]/);
    const lastPart = parts[parts.length - 1];
    if (lastPart.includes('.')) return;
  }

  expression += char;
  updateDisplay();
}

function updateDisplay() {
  // Replace operator symbols for display
  const displayExpr = expression
    .replace(/\*/g, '×')
    .replace(/\//g, '÷');
  expressionEl.textContent = displayExpr;
  resultEl.classList.remove('error');
}

function calculate() {
  if (expression === '') return;

  try {
    const rawResult = parseExpression(expression);

    const displayExpr = expression
      .replace(/\*/g, '×')
      .replace(/\//g, '÷');
    expressionEl.textContent = displayExpr + ' =';

    const formatted = parseFloat(rawResult.toFixed(MAX_DECIMAL_PLACES)).toString();
    resultEl.textContent = formatted;
    resultEl.classList.remove('error');
    expression = formatted;
    hasResult = true;
  } catch (e) {
    resultEl.textContent = 'Error';
    resultEl.classList.add('error');
    expression = '';
    hasResult = false;
  }
}

function clearAll() {
  expression = '';
  hasResult = false;
  expressionEl.textContent = '';
  resultEl.textContent = '0';
  resultEl.classList.remove('error');
}

function clearEntry() {
  if (hasResult) {
    clearAll();
    return;
  }
  expression = expression.slice(0, -1);
  updateDisplay();
  if (expression === '') {
    resultEl.textContent = '0';
  } else {
    // Show current expression as live result preview
    try {
      const last = expression.slice(-1);
      if (['+', '-', '*', '/', '%'].includes(last)) return;
      const preview = parseExpression(expression);
      if (isFinite(preview)) {
        resultEl.textContent = parseFloat(preview.toFixed(MAX_DECIMAL_PLACES)).toString();
      }
    } catch (_) {
      // No live preview on incomplete expression
    }
  }
}

// Keyboard support
document.addEventListener('keydown', function (e) {
  if (e.key >= '0' && e.key <= '9') appendChar(e.key);
  else if (e.key === '+') appendChar('+');
  else if (e.key === '-') appendChar('-');
  else if (e.key === '*') appendChar('*');
  else if (e.key === '/') { e.preventDefault(); appendChar('/'); }
  else if (e.key === '%') appendChar('%');
  else if (e.key === '.') appendChar('.');
  else if (e.key === 'Enter' || e.key === '=') calculate();
  else if (e.key === 'Backspace') clearEntry();
  else if (e.key === 'Escape') clearAll();
});
