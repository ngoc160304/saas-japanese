# Entity Map — Study JLPT

> Canonical entity and relationship map.
>
> Purpose: Help AI agents understand **what entities exist, who owns them, and how they relate** before implementing features.
>
> This document does NOT define database columns, API contracts, UI, or implementation details.
>
> Detailed database structure belongs to `database/schema.md`.
> Business rules belong to `business-rules.md`.

---

# 1. Entity Overview

```text
Identity
├── User
└── PasswordResetToken

Curriculum
├── JLPTLevel
├── Course
└── Lesson

Learning Content
├── Vocabulary
├── Kanji
└── Grammar

Learning Progress
├── UserCourseEnrollment
├── UserLessonProgress
├── LearningLog
└── LearningStreak

Lesson Assessment
├── Quiz
├── QuizQuestion
├── QuizOption
├── UserQuizAttempt
└── UserQuizAttemptAnswer

JLPT Examination
├── JLPTExam
├── JLPTExamSession
├── JLPTExamPart
├── JLPTExamQuestion
├── JLPTExamAnswer
├── UserJLPTAttempt
└── UserJLPTAttemptAnswer

Personal Learning
├── FlashcardFolder
├── FlashcardDeck
└── FlashcardContent

Commerce
├── Document
├── DocumentCategory
├── DocumentSet
├── Cart
├── CartItem
├── Order
├── OrderItem
├── Payment
├── ShippingAddress
└── Shipment

Shared
└── Media
```

---

# 2. Identity Entities

## User

```text
Table: users
Entity: User
Role: Aggregate Root
```

Relationships:

```text
User 1 ── N PasswordResetToken
User 1 ── N UserCourseEnrollment
User 1 ── N UserLessonProgress
User 1 ── N LearningLog
User 1 ── 1 LearningStreak
User 1 ── N UserQuizAttempt
User 1 ── N UserJLPTAttempt
User 1 ── N FlashcardFolder
User 1 ── 1 Cart
User 1 ── N Order
User 1 ── N ShippingAddress
User 1 ── N Media
```

User roles:

```text
student
admin
```

---

## PasswordResetToken

```text
Table: password_reset_tokens
Entity: PasswordResetToken
```

Relationship:

```text
User 1 ── N PasswordResetToken
```

Lifecycle is controlled by expiration and usage state.

---

# 3. Curriculum Entities

## JLPTLevel

```text
Table: jlpt_levels
Entity: JLPTLevel
Role: Reference Entity
```

Relationships:

```text
JLPTLevel 1 ── N Course
JLPTLevel 1 ── N JLPTExam
```

---

## Course

```text
Table: courses
Entity: Course
Role: Aggregate Root
```

Relationships:

```text
JLPTLevel N ── 1 Course
Course 1 ── N Lesson
User N ── N Course
           └── UserCourseEnrollment
```

Course is both:

```text
Learning Program
```

and, according to current commerce relationships:

```text
Potential Purchasable Item
```

Do not assume the final commerce model without explicit business confirmation.

---

## Lesson

```text
Table: lessons
Entity: Lesson
Role: Learning Unit
```

Relationships:

```text
Course 1 ── N Lesson

Lesson 1 ── N Vocabulary
Lesson 1 ── N Kanji
Lesson 1 ── N Grammar
Lesson 1 ── N Quiz

User N ── N Lesson
        └── UserLessonProgress
```

Lesson owns the learning sequence but does not necessarily own the lifecycle of Vocabulary, Kanji or Grammar.

---

# 4. Learning Content Entities

## Vocabulary

```text
Table: vocabularies
Entity: Vocabulary
```

Relationship:

```text
Lesson 0..1 ── N Vocabulary
```

Important:

```text
lesson_id = nullable
```

Therefore:

```text
Vocabulary can exist without Lesson.
```

---

## Kanji

```text
Table: kanjis
Entity: Kanji
```

Relationship:

```text
Lesson 0..1 ── N Kanji
```

Important:

```text
lesson_id = nullable
```

Therefore:

```text
Kanji can exist without Lesson.
```

---

## Grammar

```text
Table: grammars
Entity: Grammar
```

Relationship:

```text
Lesson 0..1 ── N Grammar
```

Therefore:

```text
Grammar can exist without Lesson.
```

---

# 5. Learning Progress Entities

## UserCourseEnrollment

```text
Table: user_course_enrollments
Entity: UserCourseEnrollment
```

Relationship:

```text
User 1 ── N Enrollment
Course 1 ── N Enrollment
```

Conceptually:

```text
User N ── N Course
```

through:

```text
UserCourseEnrollment
```

Unique:

```text
(user_id, course_id)
```

---

## UserLessonProgress

```text
Table: user_lesson_progress
Entity: UserLessonProgress
```

Relationship:

```text
User 1 ── N LessonProgress
Lesson 1 ── N LessonProgress
```

Conceptually:

```text
User N ── N Lesson
```

through:

```text
UserLessonProgress
```

Unique:

```text
(user_id, lesson_id)
```

---

## LearningLog

```text
Table: learning_logs
Entity: LearningLog
```

Relationship:

```text
User 1 ── N LearningLog
```

Represents learning activity/history.

---

## LearningStreak

```text
Table: learning_streaks
Entity: LearningStreak
```

Relationship:

```text
User 1 ── 1 LearningStreak
```

Represents:

```text
current streak
longest streak
last study date
```

---

# 6. Lesson Assessment Entities

## Quiz

```text
Table: quizzes
Entity: Quiz
Role: Aggregate Root
```

Relationship:

```text
Lesson 1 ── N Quiz
Quiz 1 ── N QuizQuestion
User 1 ── N UserQuizAttempt
```

---

## QuizQuestion

```text
Table: quiz_questions
Entity: QuizQuestion
```

Relationship:

```text
Quiz 1 ── N QuizQuestion
QuizQuestion 1 ── N QuizOption
```

Question types:

```text
single_choice
multiple_choice
fill_blank
```

---

## QuizOption

```text
Table: quiz_options
Entity: QuizOption
```

Relationship:

```text
QuizQuestion 1 ── N QuizOption
```

Option belongs exclusively to its Question.

---

## UserQuizAttempt

```text
Table: user_quiz_attempts
Entity: UserQuizAttempt
Role: Aggregate Root
```

Relationships:

```text
User 1 ── N UserQuizAttempt
Quiz 1 ── N UserQuizAttempt

UserQuizAttempt 1 ── N UserQuizAttemptAnswer
```

Attempt represents one execution of a Quiz by a User.

---

## UserQuizAttemptAnswer

```text
Table: user_quiz_attempt_answers
Entity: UserQuizAttemptAnswer
```

Relationships:

```text
UserQuizAttempt 1 ── N AttemptAnswer
QuizQuestion 1 ── N AttemptAnswer
QuizOption 0..1 ── N AttemptAnswer
```

Unique:

```text
(attempt_id, quiz_question_id)
```

---

# 7. JLPT Examination Entities

## JLPTExam

```text
Table: jlpt_exams
Entity: JLPTExam
Role: Aggregate Root
```

Relationships:

```text
JLPTLevel 1 ── N JLPTExam
JLPTExam 1 ── N JLPTExamSession
User 1 ── N UserJLPTAttempt
```

---

## JLPTExamSession

```text
Table: jlpt_exam_sessions
Entity: JLPTExamSession
```

Relationship:

```text
JLPTExam 1 ── N JLPTExamSession
JLPTExamSession 1 ── N JLPTExamPart
```

Examples:

```text
language_knowledge
reading
listening
```

---

## JLPTExamPart

```text
Table: jlpt_exam_parts
Entity: JLPTExamPart
```

Relationship:

```text
JLPTExamSession 1 ── N JLPTExamPart
JLPTExamPart 1 ── N JLPTExamQuestion
```

---

## JLPTExamQuestion

```text
Table: jlpt_exam_questions
Entity: JLPTExamQuestion
```

Relationship:

```text
JLPTExamPart 1 ── N JLPTExamQuestion
JLPTExamQuestion 1 ── N JLPTExamAnswer
```

---

## JLPTExamAnswer

```text
Table: jlpt_exam_answers
Entity: JLPTExamAnswer
```

Relationship:

```text
JLPTExamQuestion 1 ── N JLPTExamAnswer
```

Represents predefined answer choices.

---

## UserJLPTAttempt

```text
Table: user_jlpt_attempts
Entity: UserJLPTAttempt
Role: Aggregate Root
```

Relationships:

```text
User 1 ── N UserJLPTAttempt
JLPTExam 1 ── N UserJLPTAttempt

UserJLPTAttempt 1 ── N UserJLPTAttemptAnswer
```

Represents one execution of a JLPT Exam.

---

## UserJLPTAttemptAnswer

```text
Table: user_jlpt_attempt_answers
Entity: UserJLPTAttemptAnswer
```

Relationships:

```text
UserJLPTAttempt 1 ── N AttemptAnswer
JLPTExamQuestion 1 ── N AttemptAnswer
JLPTExamAnswer 0..1 ── N AttemptAnswer
```

Unique:

```text
(attempt_id, jlpt_exam_question_id)
```

---

# 8. Flashcard Entities

## FlashcardFolder

```text
Table: flashcard_folders
Entity: FlashcardFolder
Role: Aggregate Root
```

Relationship:

```text
User 1 ── N FlashcardFolder
FlashcardFolder 1 ── N FlashcardDeck
```

Folder is owned by User.

---

## FlashcardDeck

```text
Table: flashcard_titles
Entity: FlashcardDeck
```

Relationship:

```text
FlashcardFolder 1 ── N FlashcardDeck
FlashcardDeck 1 ── N FlashcardContent
```

---

## FlashcardContent

```text
Table: flashcard_contents
Entity: FlashcardContent
```

Relationship:

```text
FlashcardDeck 1 ── N FlashcardContent
```

Flashcard content is user-owned through its Folder/Deck hierarchy.

---

# 9. Commerce Entities

## Document

```text
Table: documents
Entity: Document
```

Relationships:

```text
DocumentCategory 1 ── N Document
DocumentSet 0..1 ── N Document
```

Document is a catalog entity.

Important:

```text
Document != Course
```

---

## DocumentCategory

```text
Table: document_categories
Entity: DocumentCategory
```

Relationship:

```text
DocumentCategory 1 ── N Document
```

---

## DocumentSet

```text
Table: document_sets
Entity: DocumentSet
```

Represents a group/bundle of documents.

```text
DocumentSet 1 ── N Document
```

DocumentSet is a catalog concept, not a Course.

---

## Cart

```text
Table: carts
Entity: Cart
Role: Aggregate Root
```

Relationship:

```text
User 1 ── 1 Cart
Cart 1 ── N CartItem
```

---

## CartItem

```text
Table: cart_items
Entity: CartItem
```

Current schema relationship:

```text
CartItem N ── 1 Course
```

Important:

> Current database models CartItem against Course. Do not silently replace this with Document.

---

## Order

```text
Table: orders
Entity: Order
Role: Aggregate Root
```

Relationships:

```text
User 1 ── N Order
Order 1 ── N OrderItem
Order 1 ── N Payment
Order 1 ── N Shipment
```

---

## OrderItem

```text
Table: order_items
Entity: OrderItem
```

Current schema relationship:

```text
OrderItem N ── 1 Course
```

Contains historical purchase information such as unit price.

Important:

```text
OrderItem != Enrollment
```

---

## Payment

```text
Table: payments
Entity: Payment
```

Relationship:

```text
Order 1 ── N Payment
```

Payment records transaction state.

---

## ShippingAddress

```text
Table: shipping_addresses
Entity: ShippingAddress
```

Relationship:

```text
User 1 ── N ShippingAddress
```

---

## Shipment

```text
Table: shipments
Entity: Shipment
```

Relationship:

```text
Order 1 ── N Shipment
```

Shipment represents physical fulfillment.

---

# 10. Shared Entity

## Media

```text
Table: media
Entity: Media
```

Referenced by multiple domains:

```text
Course
Lesson
Quiz
QuizQuestion
JLPTExam
JLPTExamQuestion
FlashcardContent
Document
```

Relationship is generally optional.

Media is a shared resource, not a child aggregate of these entities.

---

# 11. Relationship Summary

```text
JLPTLevel
├── Course
│   └── Lesson
│       ├── Vocabulary
│       ├── Kanji
│       ├── Grammar
│       └── Quiz
│           └── QuizQuestion
│               └── QuizOption
│
└── JLPTExam
    └── Session
        └── Part
            └── Question
                └── Answer
```

User relationships:

```text
User
├── Enrollment ─────── Course
├── LessonProgress ─── Lesson
├── QuizAttempt ────── Quiz
├── JLPTAttempt ────── JLPTExam
├── LearningLog
├── LearningStreak
├── FlashcardFolder
├── Cart
├── Order
├── ShippingAddress
└── Media
```

Commerce:

```text
Cart
└── CartItem ─── Course

Order
├── OrderItem ─── Course
├── Payment
└── Shipment
```

---

# 12. Critical Entity Rules

1. `User` is the root identity entity.
2. `Admin` is a role, not a separate entity.
3. `Course` belongs to one `JLPTLevel`.
4. `Lesson` belongs to one `Course`.
5. `Vocabulary`, `Kanji`, `Grammar` may exist without `Lesson`.
6. `Quiz` and `JLPTExam` are separate aggregates.
7. `UserQuizAttempt` and `UserJLPTAttempt` are separate entities.
8. `Enrollment` and `OrderItem` represent different business concepts.
9. `Document` and `Course` are different entities.
10. Current Cart/Order schema references `Course`; do not change this assumption without explicit requirement.
11. `Media` is shared and optional.
12. User-owned entities require ownership authorization.
13. Do not create new entities solely because a UI screen needs them.
14. Do not infer new relationships without checking the database schema.
15. Database FK behavior is authoritative for persistence relationships.

---

# 13. Entity Naming Rules

When implementing domain/application code:

```text
users                     → User
jlpt_levels               → JLPTLevel
courses                   → Course
lessons                   → Lesson

vocabularies              → Vocabulary
kanjis                    → Kanji
grammars                  → Grammar

user_course_enrollments   → UserCourseEnrollment
user_lesson_progress      → UserLessonProgress
learning_logs             → LearningLog
learning_streaks          → LearningStreak

quizzes                   → Quiz
quiz_questions            → QuizQuestion
quiz_options              → QuizOption

user_quiz_attempts        → UserQuizAttempt
user_quiz_attempt_answers → UserQuizAttemptAnswer

jlpt_exams                → JLPTExam
jlpt_exam_sessions        → JLPTExamSession
jlpt_exam_parts           → JLPTExamPart
jlpt_exam_questions       → JLPTExamQuestion
jlpt_exam_answers         → JLPTExamAnswer

user_jlpt_attempts        → UserJLPTAttempt
user_jlpt_attempt_answers → UserJLPTAttemptAnswer

flashcard_folders         → FlashcardFolder
flashcard_titles          → FlashcardDeck
flashcard_contents        → FlashcardContent

documents                 → Document
document_categories       → DocumentCategory
document_sets             → DocumentSet

carts                     → Cart
cart_items                → CartItem
orders                    → Order
order_items               → OrderItem
payments                  → Payment
shipping_addresses        → ShippingAddress
shipments                 → Shipment

media                     → Media
```

---

# 14. Agent Usage

Before implementing a feature:

```text
Feature
  ↓
Identify Domain
  ↓
Identify Entities
  ↓
Check Relationships
  ↓
Check Ownership
  ↓
Check Existing Business Rules
  ↓
Implement
```

Never:

```text
UI requirement
    ↓
invent entity
    ↓
invent relationship
    ↓
change database
```

Use:

```text
domain-map.md
    ↓
entity-map.md
    ↓
database/schema.md
    ↓
business-rules.md
```

as the context hierarchy.

`entity-map.md` is the canonical map of **entities and their relationships**.
