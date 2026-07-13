# REST API

All responses use `{ "code": 0, "message": "ok", "data": ... }`. Protected
requests use `Authorization: Bearer <token>`. Pagination uses `page` and `size`.

| Method | Path | Role | Purpose |
|---|---|---|---|
| POST | `/api/register` | Public | Register a white-hat account |
| POST | `/api/login` | Public | Authenticate and return JWT |
| GET | `/api/dashboard/stats` | Public | Platform metrics and trends |
| GET | `/api/tasks` | Public | Search published tasks |
| GET | `/api/tasks/{id}` | Public | Task details |
| POST | `/api/task/create` | COMPANY | Create a task |
| POST | `/api/task/apply` | WHITEHAT | Apply to a task |
| GET | `/api/task/mine` | Authenticated | My joined/managed tasks |
| POST | `/api/report/daily` | WHITEHAT | Submit one daily report |
| GET | `/api/report/task/{taskId}` | COMPANY, ADMIN | View task reports |
| POST | `/api/vulnerability/create` | WHITEHAT | Submit vulnerability |
| GET | `/api/vulnerability/list` | Authenticated | Role-filtered reports |
| PUT | `/api/vulnerability/{id}/review` | COMPANY, ADMIN | Confirm/reject report |
| GET | `/api/user/profile` | Authenticated | Current profile |
| GET | `/api/user/rank` | Public | Score leaderboard |
| GET | `/api/forum/posts` | Public | List community posts |
| POST | `/api/forum/posts` | Authenticated | Publish post |
| POST | `/api/forum/posts/{id}/comments` | Authenticated | Comment |
| GET | `/api/admin/overview` | ADMIN | Governance overview |

### Key request examples

```json
POST /api/task/apply
{ "taskId": 1, "message": "Experienced with web penetration testing" }
```

```json
PUT /api/vulnerability/12/review
{ "status": "CONFIRMED", "reviewComment": "Reproduced", "severity": "HIGH" }
```

Confirmed vulnerabilities award LOW 10, MEDIUM 50, HIGH 200 and CRITICAL 500
points exactly once in the same database transaction.
