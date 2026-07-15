## 2023-10-27 - Hardcoded Upload Temp Dir and Unsanitized Extension
**Vulnerability:** The `uploads/temp` directory was hardcoded in `backend/src/middleware/upload.ts` without ensuring it existed, leading to a potential DoS/error when the directory is missing. Additionally, file extensions were not sanitized in uploaded files.
**Learning:** Hardcoded paths that bypass the central config (`env.UPLOAD_DIR`) and assume runtime environment conditions can cause crashes. Relying solely on `path.extname` for uploaded file extensions without stripping invalid/unexpected characters leaves a small vector for injection.
**Prevention:** Always dynamically resolve temp paths, ensure they exist synchronously on module load or server startup, and strictly sanitize any components derived from user input (like file extensions).

## 2024-05-18 - Soft Delete Banned Users Content
**Vulnerability:** Banning a user only flipped their `isBanned` flag. Their existing posts and comments remained publicly visible on feeds, direct object links, and search queries, which could continue spreading violating content.
**Learning:** Depending exclusively on database queries to filter out banned user content is error-prone, as queries can easily miss the relationship check (e.g., `user: { isBanned: false }`).
**Prevention:** Rather than trying to update all read queries, directly soft-delete (or completely delete) violating content at the time of the ban action (`/users/:id/ban`). This provides a robust, centralized safeguard against exposing problematic user data.
