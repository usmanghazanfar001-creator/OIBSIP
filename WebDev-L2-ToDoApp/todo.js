(function () {
  'use strict';

  const STORAGE_KEY = 'todo-app-tasks';

  const form = document.getElementById('task-form');
  const input = document.getElementById('task-input');
  const errorEl = document.getElementById('form-error');
  const pendingList = document.getElementById('pending-list');
  const completedList = document.getElementById('completed-list');
  const pendingCount = document.getElementById('pending-count');
  const completedCount = document.getElementById('completed-count');

  let tasks = load();
  let editingId = null;

  /* ---------- Storage (bonus) ---------- */

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return Array.isArray(saved) ? saved : [];
    } catch (e) {
      return [];
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) { /* storage unavailable: app still works for this visit */ }
  }

  /* ---------- Helpers ---------- */

  function formatTime(ts) {
    return new Date(ts).toLocaleString([], {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  }

  function makeButton(label, action, extraClass) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn ' + extraClass;
    b.dataset.action = action;
    b.textContent = label;
    return b;
  }

  function buildTask(task) {
    const li = document.createElement('li');
    li.className = 'task' + (task.done ? ' done' : '');
    li.dataset.id = task.id;

    const body = document.createElement('div');
    body.className = 'task-body';
    const actions = document.createElement('div');
    actions.className = 'actions';

    if (editingId === task.id) {
      const edit = document.createElement('input');
      edit.type = 'text';
      edit.className = 'edit-input';
      edit.value = task.text;
      edit.maxLength = 120;
      edit.setAttribute('aria-label', 'Edit task');
      body.appendChild(edit);
      actions.appendChild(makeButton('Save', 'save', 'btn-done'));
      actions.appendChild(makeButton('Cancel', 'cancel', ''));
    } else {
      const text = document.createElement('span');
      text.className = 'task-text';
      text.textContent = task.text; // textContent keeps user input safe

      const time = document.createElement('span');
      time.className = 'task-time';
      time.textContent = task.done
        ? 'Completed ' + formatTime(task.completedAt)
        : 'Added ' + formatTime(task.createdAt);

      body.appendChild(text);
      body.appendChild(time);

      if (task.done) {
        actions.appendChild(makeButton('Undo', 'toggle', ''));
      } else {
        actions.appendChild(makeButton('Complete', 'toggle', 'btn-done'));
      }
      actions.appendChild(makeButton('Edit', 'edit', 'btn-edit'));
      actions.appendChild(makeButton('Delete', 'delete', 'btn-delete'));
    }

    li.appendChild(body);
    li.appendChild(actions);
    return li;
  }

  function emptyMessage(text) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = text;
    return li;
  }

  /* ---------- Rendering ---------- */

  function render() {
    pendingList.replaceChildren();
    completedList.replaceChildren();

    const pending = tasks.filter(function (t) { return !t.done; });
    const done = tasks.filter(function (t) { return t.done; });

    pending.forEach(function (t) { pendingList.appendChild(buildTask(t)); });
    done.forEach(function (t) { completedList.appendChild(buildTask(t)); });

    if (pending.length === 0) {
      pendingList.appendChild(emptyMessage('🎉 All caught up! Add a task above to get started.'));
    }
    if (done.length === 0) {
      completedList.appendChild(emptyMessage('Nothing completed yet. Finish a task and it will show up here.'));
    }

    pendingCount.textContent = pending.length + ' pending';
    completedCount.textContent = done.length + ' completed';

    const editField = document.querySelector('.edit-input');
    if (editField) {
      editField.focus();
      editField.setSelectionRange(editField.value.length, editField.value.length);
    }
  }

  /* ---------- Actions ---------- */

  function addTask(text) {
    tasks.unshift({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      text: text,
      done: false,
      createdAt: Date.now(),
      completedAt: null
    });
  }

  function findTask(id) {
    return tasks.find(function (t) { return t.id === id; });
  }

  function saveEdit(li) {
    const field = li.querySelector('.edit-input');
    const value = field.value.trim();
    if (!value) {
      field.focus();
      return;
    }
    findTask(li.dataset.id).text = value;
    editingId = null;
  }

  /* ---------- Event listeners ---------- */

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const value = input.value.trim();
    if (!value) {
      errorEl.textContent = 'Please type a task first.';
      input.focus();
      return;
    }
    errorEl.textContent = '';
    addTask(value);
    input.value = '';
    input.focus();
    save();
    render();
  });

  input.addEventListener('input', function () { errorEl.textContent = ''; });

  function onListClick(e) {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const li = btn.closest('.task');
    const task = findTask(li.dataset.id);
    if (!task) return;

    switch (btn.dataset.action) {
      case 'toggle':
        task.done = !task.done;
        task.completedAt = task.done ? Date.now() : null;
        break;
      case 'edit':
        editingId = task.id;
        break;
      case 'save':
        saveEdit(li);
        break;
      case 'cancel':
        editingId = null;
        break;
      case 'delete':
        tasks = tasks.filter(function (t) { return t.id !== task.id; });
        if (editingId === task.id) editingId = null;
        break;
    }
    save();
    render();
  }

  function onListKeydown(e) {
    if (!e.target.classList.contains('edit-input')) return;
    if (e.key === 'Enter') {
      saveEdit(e.target.closest('.task'));
      save();
      render();
    } else if (e.key === 'Escape') {
      editingId = null;
      render();
    }
  }

  [pendingList, completedList].forEach(function (list) {
    list.addEventListener('click', onListClick);
    list.addEventListener('keydown', onListKeydown);
  });

  render();
})();
