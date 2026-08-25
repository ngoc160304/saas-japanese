# Domain Map — Study JLPT

> Canonical business map for AI agents.
> This document defines **domain boundaries and relationships**, not UI, API, or implementation details.

---

## 1. Actors

```text
Student
Admin = User with admin role
```

---

## 2. Core Domains

```text
Identity
Curriculum
Learning Content
Learning Progress
Assessment
JLPT Examination
Flashcard
Commerce
Media
```

---

## 3. Domain Map

```text
USER
│
├── Curriculum
│   └── Course
│       └── Lesson
│           ├── Vocabulary
│           ├── Kanji
│           ├── Grammar
│           └── Quiz
│               └── Quiz Attempt
│
├── Learning Progress
│   ├── Course Enrollment
│   ├── Lesson Progress
│   ├── Learning Log
│   └── Learning Streak
│
├── JLPT Examination
│   └── JLPT Exam
│       └── Session
│           └── Part
│               └── Question
│                   └── Answer
│
├── Flashcard
│   └── Folder
│       └── Deck
│           └── Content
│
└── Commerce
    ├── Cart
    └── Order
        ├── Order Item
        ├── Payment
        └── Shipment
```

---

## 4. Identity

```text
users
password_reset_tokens
```

User roles:

```text
student
admin
```

Rules:

* Email is unique.
* Role determines authorization.
* Admin is not a separate entity.

---

## 5. Curriculum

### JLPT Level

```text
jlpt_levels
```

```text
JLPT Level 1 ── N Course
JLPT Level 1 ── N JLPT Exam
```

Levels:

```text
N5 / N4 / N3 / N2 / N1
```

### Course

```text
courses
```

```text
Course 1 ── N Lesson
```

Course belongs to one JLPT Level.

### Lesson

```text
lessons
```

Lesson belongs to one Course.

Lesson can contain:

```text
Vocabulary
Kanji
Grammar
Quiz
```

---

## 6. Learning Content

```text
vocabularies
kanjis
grammars
```

Relationship:

```text
Lesson 1 ── N Vocabulary
Lesson 1 ── N Kanji
Lesson 1 ── N Grammar
```

Important:

> Vocabulary, Kanji and Grammar may exist independently from Lesson because their lesson relationship is optional.

---

## 7. Learning Progress

### Enrollment

```text
user_course_enrollments
```

```text
User N ── N Course
        └── Enrollment
```

Unique:

```text
(user_id, course_id)
```

### Lesson Progress

```text
user_lesson_progress
```

```text
User N ── N Lesson
        └── Progress
```

Unique:

```text
(user_id, lesson_id)
```

Typical states:

```text
not_started
in_progress
completed
```

Course progress is derived from lesson progress.

### Learning Activity

```text
learning_logs
learning_streaks
```

Used for learning history, statistics and streaks.

---

## 8. Lesson Assessment

```text
quizzes
quiz_questions
quiz_options
user_quiz_attempts
user_quiz_attempt_answers
```

Hierarchy:

```text
Lesson
└── Quiz
    └── Question
        └── Option
```

Attempt:

```text
User
└── Quiz Attempt
    └── Attempt Answer
```

Important:

```text
Quiz != JLPT Exam
Quiz Attempt != JLPT Attempt
```

---

## 9. JLPT Examination

```text
jlpt_exams
jlpt_exam_sessions
jlpt_exam_parts
jlpt_exam_questions
jlpt_exam_answers
user_jlpt_attempts
user_jlpt_attempt_answers
```

Hierarchy:

```text
JLPT Level
└── Exam
    └── Session
        └── Part
            └── Question
                └── Answer
```

Attempt:

```text
User
└── JLPT Attempt
    └── Attempt Answer
```

---

## 10. Flashcard

```text
flashcard_folders
flashcard_titles
flashcard_contents
```

Hierarchy:

```text
User
└── Folder
    └── Deck
        └── Content
```

Flashcards are user-owned data.

---

## 11. Commerce

Catalog:

```text
documents
document_categories
document_sets
```

Cart:

```text
carts
cart_items
```

Order:

```text
orders
order_items
payments
shipping_addresses
shipments
```

Conceptual flow:

```text
Product
 ↓
Cart
 ↓
Order
 ↓
Payment
 ↓
Fulfillment
 ↓
Shipment / Digital Access
```

### Important ambiguity

Current database Cart/Order items reference `Course`, while a separate Document catalog exists.

Therefore:

> Do NOT assume whether Course, Document, or both are purchasable without an explicit business decision.

Also:

```text
Purchase != Enrollment
```

A successful purchase may create enrollment, but this must be an explicit business rule.

---

## 12. Media

```text
media
```

Shared resource used by:

```text
Course
Lesson
Quiz
JLPT Exam
Question
Flashcard
Document
```

Media is not owned exclusively by one domain.

Optional media references may be `NULL`.

---

## 13. Ownership

### System/Admin Owned

```text
JLPT Levels
Courses
Lessons
Vocabulary
Kanji
Grammar
Quizzes
JLPT Exams
Documents
Categories
Document Sets
Media
```

### Student Owned

```text
Enrollments
Lesson Progress
Quiz Attempts
JLPT Attempts
Learning Logs
Learning Streak
Flashcards
Cart
Orders
Shipping Addresses
Favorites
```

Authorization must respect ownership.

---

## 14. Critical Rules

1. Preserve database relationships and FK semantics.
2. Do not merge Quiz and JLPT Exam.
3. Do not merge Enrollment and Purchase.
4. Do not assume Document and Course are the same product.
5. Vocabulary/Kanji/Grammar can exist independently from Lesson.
6. Media is shared infrastructure.
7. Course progress should derive from lesson progress.
8. Do not create new entities without a business requirement.
9. Do not invent business rules.
10. Domain boundaries do not imply microservices.

---

## 15. Architecture Boundary

Conceptual modules:

```text
identity
curriculum
learning
assessment
examination
flashcard
commerce
media
```

These modules may exist inside one backend.

```text
Domain ≠ Database Table
Domain ≠ UI Page
Domain ≠ Microservice
```

UI and API should represent these domain concepts rather than redefine them.

---

## 16. Agent Rule

Before implementing a feature:

```text
1. Identify the domain.
2. Identify affected entities.
3. Check ownership.
4. Check existing relationships.
5. Check business rules.
6. Do not invent missing behavior.
```

For detailed database structure, read:

```text
database/schema.md
```

For detailed business rules, read:

```text
business-rules.md
```

This file is the **high-level domain source of truth**.
