# Nutrisipe Revamp

Project structured into Backend and Frontend.

## Structure

- `/backend`: API and server-side logic (Node.js + Express + TypeScript + Prisma).
- `/frontend`: User interface (Vue 3 + Vite + TypeScript).

## Setup

See READMEs in respective folders for specific setup instructions.

## Security Notes

### JWT in localStorage Risk
The frontend stores the JWT in `localStorage` for session persistence. 
- **Risk:** `localStorage` is vulnerable to Cross-Site Scripting (XSS) attacks. If an attacker runs malicious JS, they can read the token.
- **Mitigation:** The application uses `DOMPurify` to sanitize inputs and prevent XSS. 
- **Recommendation:** For production deployments, implement a strict Content Security Policy (CSP) on the Nginx/reverse-proxy layer and consider migrating authentication to HttpOnly cookies.
