# Verification record

Checked on 13 September 2026.

| Check | Result |
| --- | --- |
| ESLint | Passed |
| Next.js production build and TypeScript | Passed |
| Fresh Prisma migration and seed | Passed: 3 lists, 105 word entries, 43 phonemes and 2 activities |
| HTTP integration suite against development server | Passed: 11 tests |
| HTTP integration suite against standalone production server | Passed: 11 tests |
| Production pages and client JavaScript asset | Passed: all 7 pages and a referenced client asset returned 200 |
| Re-running seed after use | Passed: existing content preserved |
| Browser interaction check | Blocked by the verification environment's browser network policy; no visual or end-to-end browser result is claimed |
| Docker build, container APIs and restart persistence | Automated in `.github/workflows/verify.yml`; see the repository Actions result |

The integration tests cover create/read/update/delete operations, unknown and malformed phonemes, multi-character token boundaries, duplicate conflicts, saved settings, current stored hints in downloads, both game payloads, script-delimiter escaping, relationship-protected deletion and rollback of invalid word edits. They send a browser-style Origin header on same-origin requests and verify foreign-origin rejection.

A Docker runtime is not installed in the local verification workspace. The included GitHub Actions job performs the container-specific checks on an Ubuntu runner. Personal face/ID narration and the classroom browser demonstration must be recorded by the student using the separate walkthrough guide.
