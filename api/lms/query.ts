import { Query } from "../../core/utils/abstract.ts";

type CourseData = {
  id: number;
  slug: string;
  title: string;
  description: string;
  lessons: string;
  hours: number;
  created: string;
};

type LessonData = {
  id: number;
  course_id: number;
  slug: string;
  title: string;
  seconds: number;
  video: string;
  description: string;
  order: number;
  free: number; //0/1
  created: string;
};

type CourseCreate = Omit<CourseData, "id" | "created">;
type LessonCreate = Omit<LessonData, "id" | "created" | "course_id"> & {
  courseSlug: string;
};
type CertificateFullDate = {
  id: string;
  name: string;
  title: string;
  hours: number;
  lessons: number;
  completed: string;
};

export class LmsQuery extends Query {
  insertCourse({ slug, title, description, lessons, hours }: CourseCreate) {
    return this.db
      .query(
        /*sql*/ `
          INSERT OR IGNORE INTO "courses"
          ("slug", "title", "description", "lessons", "hours")
          VALUES (?,?,?,?,?)
        `,
      )
      .run(slug, title, description, lessons, hours);
  }

  insertLesson({
    courseSlug,
    slug,
    title,
    seconds,
    video,
    description,
    order,
    free,
  }: LessonCreate) {
    return this.db
      .query(
        /*sql*/ `
          INSERT OR IGNORE INTO "lessons"
          ("course_id", "slug", "title", "seconds", 
            "video", "description", "order", "free")
          VALUES ((SELECT "id" FROM "courses" WHERE "slug" = ?),?,?,?,?,?,?,?)
        `,
      )
      .run(courseSlug, slug, title, seconds, video, description, order, free);
  }

  selectCourses() {
    return this.db
      .prepare(
        /*sql*/ `SELECT * FROM "courses" ORDER BY "created" ASC LIMIT 100`,
      )
      .all() as CourseData[];
  }

  selectCourse(slug: string) {
    return this.db
      .prepare(/*sql*/ `SELECT * FROM "courses" WHERE "slug" = ?`)
      .get(slug) as CourseData | undefined;
  }

  selectLessons(courseSlug: string) {
    return this.db
      .prepare(
        /*sql*/ `SELECT * FROM "lessons" WHERE "course_id" = (SELECT "id" FROM "curses" WHERE "slug" = ?)
        ORDER BY "order" ASC`,
      )
      .all(courseSlug) as LessonData[];
  }

  selectLesson(courseSlug: string, lessonSlug: string) {
    return this.db
      .prepare(
        /*sql*/ `
        SELECT * FROM "lessons"
        WHERE "course_id" = (SELECT "id" FROM "courses" WHERE "slug" = ?)
        AND "slug" = ?`,
      )
      .get(courseSlug, lessonSlug) as LessonData | undefined;
  }

  selectLessonNav(courseSlug: string, lessonSlug: string) {
    return this.db
      .prepare(
        /*sql*/ `
        SELECT "slug" FROM "lesson_nav"
        WHERE "course_id" = (SELECT "id" FROM "courses" WHERE "slug" = ?)
        AND "current_slug" = ?`,
      )
      .all(courseSlug, lessonSlug) as { slug: string }[];
  }

  insertLessonCompleted(userId: number, courseId: number, lessonId: number) {
    return this.db
      .prepare(
        /*sql*/ `
        INSERT OR IGNORE INTO "lessons_completed"
        ("user_id", "course_id", "lesson_id") VALUES (?,?,?)`,
      )
      .run(userId, courseId, lessonId);
  }

  selectLessonCompleted(userId: number, lessonId: number) {
    return this.db
      .prepare(
        /*sql*/ `
        SELECT "completed" FROM "lessons_completed" WHERE "user_id" = ? AND "lesson_id" = ?
        `,
      )
      .get(userId, lessonId) as { completed: string } | undefined;
  }

  selectLessonsCompleted(userId: number, courseId: number) {
    return this.db
      .prepare(
        /*sql*/ `
        SELECT "lesson_id", "completed" FROM "lessons_completed" WHERE "user_id" = ? AND "course_id" = ?
        `,
      )
      .all(userId, courseId) as { lessonId: number; completed: string }[];
  }

  deleteLessonsCompleted(userId: number, courseId: number) {
    return this.db
      .prepare(
        /*sql*/ `
        DELETE FROM "lessons_completed" WHERE "user_id" = ? AND "course_id" = ?
        `,
      )
      .run(userId, courseId);
  }

  selectProgress(userId: number, courseId: number) {
    return this.db
      .prepare(
        /*sql*/ `
        SELECT "lesson"."id", "lessons_completed"."completed"
          FROM "lessons"
     LEFT JOIN "lessons_completed"
            ON "lessons" ."id" = "lessons_completed"."lesson_id" AND "lessons_completed"."user_id" = ?
         WHERE "lessons"."course_id" = ?`,
      )
      .all(userId, courseId) as { id: number; completed: string }[];
  }

  insertCertificate(userId: number, courseId: number) {
    return this.db
      .prepare(
        /*sql*/ `
          INSERT OR IGNORE INTO "certificates"
          ("user_id", "course_id") VALUES(?, ?)
          RETURNING "id"
        `,
      )
      .get(userId, courseId) as { id: string } | undefined;
  }

  selectCertificates(userId: number) {
    return this.db
      .prepare(
        /*sql*/ `
          SELECT FROM "certificates_full"
          WHERE "user_id" = ?
        `,
      )
      .all(userId) as CertificateFullDate[];
  }

  selectCertificate(certificateId: string) {
    return this.db
      .prepare(
        /*sql*/ `
          SELECT FROM "certificates_full"
          WHERE "id" = ?
        `,
      )
      .get(certificateId) as CertificateFullDate | undefined;
  }
}
