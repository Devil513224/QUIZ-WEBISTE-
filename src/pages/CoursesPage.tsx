import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, PlayCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DemoLabel } from '../components/CommonUI';

export const CoursesPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const { state, t, toggleLesson } = useApp();
  const [selectedLessonIdx, setSelectedLessonIdx] = useState(0);

  const publishedCourses = state.courses.filter((c) => c.published);

  const getCourseProgress = (courseId: string, lessonCount: number) => {
    if (!lessonCount) return 0;
    const completed = Array.from({ length: lessonCount }).filter((_, idx) =>
      state.completedLessons.includes(`${courseId}-${idx}`)
    ).length;
    return Math.round((completed / lessonCount) * 100);
  };

  const selectedCourse = id ? publishedCourses.find((c) => c.id === id) : null;

  if (selectedCourse) {
    const pct = getCourseProgress(selectedCourse.id, selectedCourse.lessons.length);
    const activeLessonTitle = selectedCourse.lessons[selectedLessonIdx] || selectedCourse.lessons[0];

    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Link
          to="/courses"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 dark:border-[#24385c] dark:bg-[#122443] dark:text-slate-100"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t.hub.allCourses}</span>
        </Link>

        <div className="mt-4">
          <DemoLabel />
          <h1 className="mt-1 font-display text-3xl font-extrabold text-slate-900 dark:text-white">
            {selectedCourse.title}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-[#9fb0c8]">{selectedCourse.description}</p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Video Player Layout */}
          <div className="lg:col-span-7">
            <div className="flex aspect-video flex-col items-center justify-center rounded-2xl bg-[#102544] p-6 text-center text-white">
              <PlayCircle className="h-14 w-14 text-[#facc15]" />
              <div className="mt-3 text-xs font-semibold text-[#facc15]">{t.hub.videoDemoTitle}</div>
              <div className="mt-1 font-display text-xl font-bold">{activeLessonTitle}</div>
              <p className="mt-2 max-w-md text-xs text-[#c7d3e6]">{t.hub.videoDemoSub}</p>
            </div>
          </div>

          {/* Lesson Checklist */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-5 dark:border-[#24385c] dark:bg-[#122443]">
            <div className="flex items-center justify-between text-sm font-bold text-slate-900 dark:text-white">
              <span>{t.hub.lessonsTitle}</span>
              <span className="font-mono-num text-emerald-600 dark:text-emerald-400">
                {t.hub.completePct.replace('{pct}', String(pct))}
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#eef2f8] dark:bg-[#16294b]">
              <div className="h-full bg-emerald-600 transition-[width] duration-200" style={{ width: `${pct}%` }} />
            </div>

            <div className="mt-4 divide-y divide-slate-200 dark:divide-[#24385c]">
              {selectedCourse.lessons.map((lesson, idx) => {
                const key = `${selectedCourse.id}-${idx}`;
                const done = state.completedLessons.includes(key);
                const isActive = selectedLessonIdx === idx;
                return (
                  <div key={key} className="flex items-center justify-between gap-3 py-3">
                    <button
                      type="button"
                      onClick={() => setSelectedLessonIdx(idx)}
                      className={`flex-1 text-left text-sm font-medium ${
                        isActive
                          ? 'text-[#102544] font-bold dark:text-[#facc15]'
                          : 'text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {lesson}
                    </button>
                    <input
                      type="checkbox"
                      aria-label={`Mark ${lesson} complete`}
                      checked={done}
                      onChange={() => toggleLesson(key)}
                      className="h-4 w-4 shrink-0 cursor-pointer rounded accent-emerald-600"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-3xl font-extrabold text-slate-900 dark:text-white">
        {t.hub.coursesTitle}
      </h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-[#9fb0c8]">{t.hub.coursesSub}</p>

      <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">
        {publishedCourses.map((course) => {
          const pct = getCourseProgress(course.id, course.lessons.length);
          return (
            <div
              key={course.id}
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 dark:border-[#24385c] dark:bg-[#122443]"
            >
              <div>
                <DemoLabel />
                <h2 className="mt-1.5 font-display text-xl font-bold text-slate-900 dark:text-white">
                  {course.title}
                </h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-[#9fb0c8]">{course.description}</p>
              </div>

              <div className="mt-5">
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#eef2f8] dark:bg-[#16294b]">
                  <div className="h-full bg-emerald-600" style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-2 font-mono-num text-xs text-slate-500 dark:text-[#9fb0c8]">
                  {t.hub.completePct.replace('{pct}', String(pct))} · {course.lessons.length}{' '}
                  {t.common.lessons}
                </p>
                <Link
                  to={`/courses/${course.id}`}
                  className="mt-3 inline-flex h-9 items-center justify-center rounded-lg bg-[#102544] px-4 text-xs font-semibold text-white hover:bg-[#1b3a6b] dark:bg-[#facc15] dark:text-[#102544]"
                >
                  {pct > 0 ? t.hub.continueCourse : t.hub.startCourse}
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
