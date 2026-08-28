## 2023-10-27 - Hardcoded Upload Temp Dir and Unsanitized Extension
**Vulnerability:** The `uploads/temp` directory was hardcoded in `backend/src/middleware/upload.ts` without ensuring it existed, leading to a potential DoS/error when the directory is missing. Additionally, file extensions were not sanitized in uploaded files.
**Learning:** Hardcoded paths that bypass the central config (`env.UPLOAD_DIR`) and assume runtime environment conditions can cause crashes. Relying solely on `path.extname` for uploaded file extensions without stripping invalid/unexpected characters leaves a small vector for injection.
**Prevention:** Always dynamically resolve temp paths, ensure they exist synchronously on module load or server startup, and strictly sanitize any components derived from user input (like file extensions).

## 2024-05-24 - Replaced Weak PRNG
**Vulnerability:** Weak PRNGs like `Math.random()` were used to generate temporary file names in `upload.ts` and usernames in `authService.ts`. While `Math.random()` isn't highly predictable in standard JavaScript engines, it is not cryptographically secure and might lead to race conditions, file overrides or username collisions in extreme conditions.
**Learning:** In a security-sensitive context like uploads or credentials generation, relying on non-cryptographic random numbers can lead to predictable patterns which attackers might exploit to target specific values or overwrite resources.
**Prevention:** Use Node.js's built-in `crypto` module (`crypto.randomBytes`, `crypto.randomInt`, etc.) for generating secure, unpredictable random tokens or identifiers.
