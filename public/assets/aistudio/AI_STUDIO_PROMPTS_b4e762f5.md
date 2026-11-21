# Learn With TG: Google AI Studio prompts

Use these one at a time, in order. Wait for each step to work before sending the next.
Attach the Learn With TG logo PNG to Prompt 1. Optionally attach the HTML files from the
`learn-with-tg-vercel.zip` as a visual reference.

---

## Prompt 1: Setup, design system, layout, homepage

Build a new website called LEARN WITH TG. Tagline: "Learn Smart, Grow Every Day."
It is a 100% free exam preparation platform for students in India, especially West Bengal.

Tech: React, TypeScript, Vite, Tailwind CSS, React Router, Lucide React icons, Recharts.
Use only local sample data for now. No Firebase yet. Label every demo item as "Demo" or "Sample".

Brand: use the attached logo in the header, footer and favicon. Do not replace it.
Colors: Navy #102544, Yellow #FACC15, White #FFFFFF, Light background #F8FAFC,
Text #0F172A, Secondary text #64748B. Support light and dark mode.

Build:
1. Responsive header: logo, menu (Home, Exams, Mock Tests, Quizzes, Study Materials,
   Courses, Current Affairs, Job Updates, Typing Practice, About), search, language
   selector (English, Bengali, Hindi), theme toggle, notification bell, Login button,
   mobile drawer.
2. Footer.
3. Homepage: announcement bar, hero ("Your Complete Destination for Exam Preparation" /
   "Learn smarter, practice better and prepare confidently with free mock tests, quizzes,
   study materials and educational resources." / buttons "Start Learning" and
   "Explore Mock Tests"), exam search, exam category cards (SSC, Railway, Banking, UPSC,
   State PSC, Police, Defence, Teaching, West Bengal Govt Exams, Computer Knowledge),
   popular mock tests, daily GK question, leaderboard preview, government job updates
   (marked as sample), why Learn With TG, FAQ.

Keep translations in a separate i18n folder (en, bn, hi). Do not hardcode text in components.
Mobile first. Add loading, empty and error states. Reusable components only.

## Prompt 2: Quizzes and mock tests

Add quiz and mock test pages: listing with filters (Daily Quiz, Mock Test, Sectional Test,
Previous-Year Paper), instructions page, exam interface (timer, question palette with
answered / not answered / marked / not visited colors, mark for review, clear response,
section tabs, submit confirmation, auto-submit on time up), result page (score, correct,
incorrect, unanswered, accuracy, time taken, section-wise analysis), answer review with
explanations, and a custom practice test builder. Use 10 demo questions in General
Knowledge and Computer Knowledge. Negative marking 0.25 on mock tests.

## Prompt 3: Study materials, courses, typing

Add: Study Materials (search, subject filters, bookmark, demo download), Courses (list,
detail page, lesson checklist, progress bar, video player layout), Typing Practice in
English, Bengali and Hindi (60 second timer, WPM, CPM, accuracy, correct and incorrect
characters, attempt history).

## Prompt 4: Updates, planner, exams, notifications

Add: Current Affairs (daily, weekly, monthly, search, category filter), Job Updates (tabs:
Vacancies, Admit Cards, Results, Answer Keys, Exam Dates; sample data clearly labelled),
Leaderboard (daily, weekly, monthly, privacy-safe names), Study Planner (exam countdown,
daily targets, subject progress), Exam detail pages (syllabus checklist, roadmap, stages,
links to free resources), Notification centre (read/unread, filters, mark all read).

## Prompt 5: Dashboard and account pages

Add a student dashboard (saved materials, lesson progress, typing history, quiz and mock
test stats, charts with Recharts, study streak, achievements) and account pages: Login,
Registration, Forgot password, Reset password, Profile, Settings. Use form validation.
Show clearly that sign-in is demo only until Firebase is connected.

## Prompt 6: Admin panel (frontend only)

Add /admin with a sidebar: Dashboard, Students, Exams, Subjects, Categories, Question Bank,
Quizzes, Mock Tests, Study Materials, Courses, Current Affairs, Job Updates, Typing
Passages, Banners, Homepage Builder, Notifications, Reports, Website Settings,
Activity Logs. Every list needs search, pagination, add, edit, delete with confirmation,
publish/unpublish. Banner manager with live preview. Homepage builder with reorder,
hide/show and rename sections.

## Prompt 7: Language support

Make English, Bengali and Hindi work across the whole site using the i18n files. The
language selector must change every page, not just the homepage.

---

## Later (after the frontend is approved)

Only start these after you review everything above.

- Firebase Authentication and student profiles
- Firestore database and security rules
- Real quiz and mock test scoring on the server
- Admin login with roles (Student, Content Manager, Admin, Super Admin)
- PDF and course uploads in Firebase Storage
- Notifications, SEO, final testing

## Tips

- Send one prompt at a time and test in the preview before the next one.
- If something breaks, paste the exact error message and ask AI Studio to fix it.
- Keep your Firebase keys and any API keys out of the code. Use environment variables.
- When the frontend is ready, export or sync to GitHub, then import the repository in Vercel.
