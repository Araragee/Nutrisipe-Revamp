## 2026-06-28 - [Sentinel] Replace insecure Math.random() with crypto
**Vulnerability:** Predictable random numbers using Math.random() for filenames and username generation.
**Learning:** Math.random() should not be used in contexts where uniqueness is important (such as file uploads or usernames) to prevent collision or predictability attacks.
**Prevention:** Always use Node.js's built-in `crypto.randomBytes()` or `crypto.randomUUID()`.
