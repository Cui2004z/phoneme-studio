# Test results

Checked on 13 September 2026.

| Check | Result |
| --- | --- |
| ESLint and production build | Passed |
| Fresh database migration and seed | Passed |
| API tests on the development server | 11 passed |
| API tests on the standalone production server | 11 passed |
| Production pages and a client JavaScript asset | Returned 200 |
| Repeat seed | Existing content preserved |
| Docker build and startup | Passed |
| Container health endpoint | 200 OK |
| Container API tests | 11 passed |
| Database persistence after container restart | Passed |

[GitHub Actions run](https://github.com/Cui2004z/phoneme-studio/actions/runs/34748244170)

The API tests cover CRUD, input validation, duplicate records, multi-character phonemes, saved HTML output and protected relationships. Docker checks ran on a GitHub Actions Ubuntu runner.

Browser interaction testing was not completed because the test environment blocked access to the local app. The checks above do not replace a manual browser walkthrough.
