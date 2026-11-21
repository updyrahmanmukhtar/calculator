const expressionDisplay = document.querySelector('#expression');
const resultDisplay = document.querySelector('#result');
const keypad = document.querySelector('.keypad');
const historyPanel = document.querySelector('#history-panel');
const historyList = document.querySelector('#history-list');
const historyEmpty = document.querySelector('#history-empty');
const historyToggle = document.querySelector('#history-toggle');

let currentValue = '0';
let storedValue = null;
let pendingOperator = null;
let shouldResetDisplay = false;
let expression = '';
const calculations = [];

function formatNumber(value) {
  if (!Number.isFinite(value)) return 'Error';
  const rounded = Number.parseFloat(value.toPrecision(11));
  return String(rounded);
}

function updateDisplay() {
  resultDisplay.textContent = currentValue;
  expressionDisplay.textContent = expression || '\u00a0';
  keypad.querySelectorAll('[data-operator]').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.operator === pendingOperator && !shouldResetDisplay);
  });
}

function inputDigit(digit) {
  if (currentValue === 'Error' || shouldResetDisplay) {
    currentValue = digit;
    shouldResetDisplay = false;
  } else if (currentValue.replace('-', '').replace('.', '').length < 12) {
    currentValue = currentValue === '0' ? digit : currentValue + digit;
  }
}

function inputDecimal() {
  if (currentValue === 'Error' || shouldResetDisplay) {
    currentValue = '0.';
    shouldResetDisplay = false;
  } else if (!currentValue.includes('.')) {
    currentValue += '.';
  }
}

function calculate(left, right, operator) {
  switch (operator) {
    case '+': return left + right;
    case '−': return left - right;
    case '×': return left * right;
    case '÷': return right === 0 ? NaN : left / right;
    default: return right;
  }
}

function chooseOperator(operator) {
  const inputValue = Number(currentValue);
  if (!Number.isFinite(inputValue)) return;

  if (pendingOperator && !shouldResetDisplay) {
    const result = calculate(storedValue, inputValue, pendingOperator);
    currentValue = formatNumber(result);
    storedValue = Number(currentValue);
  } else {
    storedValue = inputValue;
  }

  pendingOperator = operator;
  expression = `${formatNumber(storedValue)} ${operator}`;
  shouldResetDisplay = true;
}

function addHistory(formula, answer) {
  calculations.unshift({ formula, answer });
  calculations.splice(8);
  historyList.replaceChildren(...calculations.map(({ formula: itemFormula, answer: itemAnswer }) => {
    const item = document.createElement('li');
    const formulaText = document.createElement('span');
    const answerText = document.createElement('span');
    formulaText.className = 'history-expression';
    answerText.className = 'history-result';
    formulaText.textContent = itemFormula;
    answerText.textContent = itemAnswer;
    item.append(formulaText, answerText);
    return item;
  }));
  historyEmpty.hidden = calculations.length > 0;
}

function equals() {
  if (!pendingOperator || storedValue === null || currentValue === 'Error') return;
  const rightValue = Number(currentValue);
  const formula = `${formatNumber(storedValue)} ${pendingOperator} ${formatNumber(rightValue)}`;
  currentValue = formatNumber(calculate(storedValue, rightValue, pendingOperator));
  expression = `${formula} =`;
  addHistory(formula, currentValue);
  storedValue = null;
  pendingOperator = null;
  shouldResetDisplay = true;
}

function clear() {
  currentValue = '0';
  storedValue = null;
  pendingOperator = null;
  shouldResetDisplay = false;
  expression = '';
}

function performAction(action) {
  if (action === 'clear') clear();
  if (action === 'equals') equals();
  if (action === 'decimal') inputDecimal();
  if (action === 'sign' && currentValue !== '0' && currentValue !== 'Error') {
    currentValue = formatNumber(-Number(currentValue));
  }
  if (action === 'percent' && currentValue !== 'Error') {
    currentValue = formatNumber(Number(currentValue) / 100);
  }
}

keypad.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.dataset.digit !== undefined) inputDigit(button.dataset.digit);
  if (button.dataset.operator) chooseOperator(button.dataset.operator);
  if (button.dataset.action) performAction(button.dataset.action);
  updateDisplay();
});

historyToggle.addEventListener('click', () => {
  const isExpanded = historyToggle.getAttribute('aria-expanded') === 'true';
  historyToggle.setAttribute('aria-expanded', String(!isExpanded));
  historyPanel.hidden = isExpanded;
});

document.querySelector('#clear-history').addEventListener('click', () => {
  calculations.length = 0;
  historyList.replaceChildren();
  historyEmpty.hidden = false;
});

document.addEventListener('keydown', (event) => {
  if (/^[0-9]$/.test(event.key)) inputDigit(event.key);
  else if (event.key === '.') inputDecimal();
  else if (event.key === 'Enter' || event.key === '=') event.preventDefault(), equals();
  else if (event.key === 'Backspace') {
    if (!shouldResetDisplay && currentValue !== 'Error') currentValue = currentValue.length > 1 ? currentValue.slice(0, -1) : '0';
  } else if (event.key === 'Escape') clear();
  else if (event.key === '+') chooseOperator('+');
  else if (event.key === '-') chooseOperator('−');
  else if (event.key === '*') chooseOperator('×');
  else if (event.key === '/') event.preventDefault(), chooseOperator('÷');
  else return;
  updateDisplay();
});

updateDisplay();