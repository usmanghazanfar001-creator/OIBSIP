# Task 4 — Login Authentication System

A frontend-only registration and login system with a protected dashboard, built with HTML5, CSS3, vanilla JavaScript and localStorage (Option A).

## Flow

Register → validation → login → dashboard → protected route → logout

## Features

**Registration** (`register.html`)
- Username or email field, password field, confirm-password field and Register button
- Password must be at least 8 characters and contain at least 1 number
- Username: 3–30 characters (letters, numbers, `.`, `-`, `_`); emails must be valid
- Duplicate check (case-insensitive) with a clear error if the account already exists
- Empty submissions are rejected

**Login** (`index.html`)
- Username or email field, password field and Login button
- Credentials are validated against the saved account
- A wrong password and an unknown account show the same message, so it never reveals which field is wrong
- Empty submissions are rejected

**Protected dashboard** (`dashboard.html`)
- Only logged-in users can see it; opening it directly redirects to the login page
- Logout button clears the session and redirects to login
- Session lasts 30 minutes, then the user is sent back to login
- Logging out in one tab logs out the others too

**Password security**
- Passwords are never stored as plain text
- Each password is hashed with SHA-256 (Web Crypto API) combined with a random per-user salt

## Files

| File | Purpose |
|------|---------|
| `index.html` | Login page |
| `register.html` | Registration page |
| `dashboard.html` | Protected page |
| `auth.css` | Shared styling |
| `auth.js` | Validation, hashing, sessions and route protection |

## How to run

Keep all five files in the same folder and open `index.html`. Register an account first, then log in.

The hashing uses the browser's Web Crypto API, which works from `localhost`, `https` and normally when a file is opened directly. If a page ever says secure hashing is unavailable, serve the folder locally, for example with `python -m http.server`, and open `http://localhost:8000`.

## How it stores data

| localStorage key | Contents |
|------------------|----------|
| `auth_users_v2` | Accounts: username/email, salt, SHA-256 hash, creation date |
| `auth_session` | Current session: user, random token, expiry time |

Logout removes only `auth_session`, so registered accounts remain.

## Limitations

This is a learning project. Because there is no server, all checks run in the browser and anyone with developer tools can read or change localStorage. Real systems should verify credentials on a server and use a slow password hash such as bcrypt.
