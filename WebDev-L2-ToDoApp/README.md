# Task 3 — To-Do Web App

A task manager where you can add, complete, edit and delete tasks. Built with HTML5, CSS3 and vanilla JavaScript.

## Features

- Input field and **Add Task** button (pressing Enter also works)
- New tasks appear immediately in **Pending Tasks**
- **Complete** button moves a task to **Completed Tasks**; **Undo** moves it back
- **Edit** button on every task: change the text, then Save (or Enter) or Cancel (or Esc)
- **Delete** button on every task
- Live counters: "X pending" and "Y completed"
- Friendly empty-state message in each list when it has no tasks
- Empty or blank tasks are rejected with a short message

## Bonus features included

- Timestamp showing when each task was added or completed
- localStorage persistence, so tasks stay after a page refresh

## Files

| File | Purpose |
|------|---------|
| `todo.html` | Page structure |
| `todo.css` | Styling and responsive layout |
| `todo.js` | App logic, rendering and storage |

## How to run

Keep the three files in the same folder and open `todo.html` in any modern browser. No installation or internet connection is needed.

## Notes

- Tasks are stored in the browser's localStorage under the key `todo-app-tasks`. Clearing site data removes them.
- Task text is inserted with `textContent`, so anything typed in is shown as plain text and cannot inject HTML.
