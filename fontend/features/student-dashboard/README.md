# Dashboard data sources

The existing dashboard hierarchy is retained with authenticated-user data and honest
unavailable states.

| Field                                             | Source                                                                  |
| ------------------------------------------------- | ----------------------------------------------------------------------- |
| Name, email                                       | Typed auth user from the existing Spring auth session                   |
| Avatar                                            | Initials derived from the authenticated name; no invented profile photo |
| Greeting, date, calendar                          | Browser date/time; calendar does not mark study activity                |
| Enrolled/in-progress/completed courses            | GET /api/v1/student/dashboard                                           |
| Course title, enrollment date, saved progress     | Existing GET /api/v1/courses/my-courses                                 |
| Course level, slug, learner avatars/counts        | Enrollment response does not provide these; omitted from the table      |
| Study minutes/chart, focus sessions/targets       | No persisted activity-duration/focus-session data source; unavailable   |
| Current/best streak, studied calendar days        | No daily activity event history; unavailable                            |
| JLPT level, target, rank, achievements/milestones | No supported user contract; unavailable                                 |
| Notification badge                                | No notification API; no fabricated unread indicator                     |

Spring derives the dashboard user from the authenticated principal, never a client user ID.
The aggregation excludes soft-deleted courses and counts persisted enrollment progress:
not started = 0 with no completion timestamp; in progress = greater than 0 and less than
100 with no completion timestamp; complete = completedAt present or progress at least 100.
Empty enrollment sets legitimately return zero; request failures display unavailable
states and retry actions.

Summary and enrollment queries use user-scoped keys. The summary is under the existing
my-courses key prefix, so enrollment invalidation updates it too. AuthBootstrap already
cancels and clears the query cache when the account changes. No runtime mock imports remain.
