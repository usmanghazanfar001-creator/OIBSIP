# Task 1 — Calculator

A browser calculator built with HTML5, CSS3 and vanilla JavaScript.

## Features

- Display showing the running expression and the current input/result
- Number buttons 0–9 and a decimal point
- Operators: addition `+`, subtraction `−`, multiplication `×`, division `÷`
- Equals `=`, Clear `C` and Backspace `⌫`
- Operator chaining that follows normal maths rules, so `5 + 3 × 2 = 11`
- Division-by-zero protection with the message "Error: Cannot divide by 0"
- Keyboard support: digits, `+ - * /`, `.`, Enter, Backspace, Esc
- Floating-point clean-up, so `0.1 + 0.2` shows `0.3`

## Technical requirements met

- Button layout uses CSS Grid
- All clicks are handled with JavaScript event listeners (no inline `onclick`)
- No `eval()`: the calculation is done with variables, loops and conditions

## Files

| File | Purpose |
|------|---------|
| `index.html` | Page structure and buttons |
| `style.css` | Styling and the CSS Grid layout |
| `script.js` | Calculator logic and event listeners |

## How to run

Keep the three files in the same folder and open `index.html` in any modern browser. No installation or internet connection is needed.

## How the calculation works

Numbers and operators are stored in a list. When you press `=`, the calculator first resolves every `×` and `÷` from left to right, then every `+` and `−`. If a division by zero is found, it stops and shows an error instead of a result.
