import { Api } from "../../core/utils/abstract.ts";
import { RouteError } from "../../core/utils/route-error.ts";
import { lmsTables } from "./tables.ts";
import { LmsQuery } from "./query.ts";

export class LmsApi extends Api {
  query = new LmsQuery(this.db);

  handlers = {
    postCourse: (req, res) => {
      const { slug, title, description, lessons, hours } = req.body;
      const writeResult = this.query.insertCourse({
        slug,
        title,
        description,
        lessons,
        hours,
      });

      console.log(writeResult);

      if (writeResult.changes === 0) {
        throw new RouteError(400, "Erro ao criar curso");
      }

      res.status(201).json({
        id: writeResult.lastInsertRowid,
        changes: writeResult.changes,
        title: "Curso criado.",
      });
    },

    postLesson: (req, res) => {
      const {
        courseSlug,
        slug,
        title,
        seconds,
        video,
        description,
        order,
        free,
      } = req.body;
      const writeResult = this.query.insertLesson({
        courseSlug,
        slug,
        title,
        seconds,
        video,
        description,
        order,
        free,
      });

      if (writeResult.changes === 0) {
        throw new RouteError(400, "Erro ao criar aula.");
      }

      res.status(201).json({
        id: writeResult.lastInsertRowid,
        changes: writeResult.changes,
        title: "aula criada.",
      });
    },

    getCourses: (req, res) => {
      const courses = this.query.selectCourses();

      if (courses.length === 0) {
        throw new RouteError(404, "Nenhum curso encontrado.");
      }

      res.status(200).json(courses);
    },

    getCourse: (req, res) => {
      const { slug } = req.params;
      const course = this.query.selectCourse(slug);
      const lessons = this.query.selectLessons(slug);

      if (!course) {
        throw new RouteError(404, "Nenhum curso encontrado.");
      }

      const userId = 1;
      let completed: { lessonId: number; completed: string }[] = [];

      if (userId) {
        completed = this.query.selectLessonsCompleted(userId, course.id);
      }

      res.status(200).json({ course, lessons, completed });
    },

    getLesson: (req, res) => {
      const { courseSlug, lessonSlug } = req.params;
      const lesson = this.query.selectLesson(courseSlug, lessonSlug);
      const nav = this.query.selectLessonNav(courseSlug, lessonSlug);

      if (!lesson) {
        throw new RouteError(404, "Aula não encontrada.");
      }

      const i = nav.findIndex((l) => l.slug === lesson.slug);
      const prev = i === 0 ? null : nav.at(i - 1)?.slug;
      const next = nav.at(i + 1)?.slug ?? null;

      const userId = 1;
      let completed = "";

      if (userId) {
        const lessonCompleted = this.query.selectLessonCompleted(
          userId,
          lesson.id,
        );

        if (lessonCompleted) {
          completed = lessonCompleted.completed;
        }
      }

      res.status(200).json({ ...lesson, nav, prev, next, completed });
    },

    postLessonComplete: (req, res) => {
      try {
        const userId = 1;
        const { courseId, lessonId } = req.body;
        const writeResult = this.query.insertLessonCompleted(
          userId,
          courseId,
          lessonId,
        );

        if (writeResult.changes === 0) {
          throw new RouteError(400, "Erro ao completar aula.");
        }

        const progress = this.query.selectProgress(userId, courseId);
        const incompleteLessons = progress.filter((item) => !item.completed);

        if (incompleteLessons.length > 0 && incompleteLessons.length == 0) {
          const certificate = this.query.insertCertificate(userId, courseId);

          if (!certificate) {
            throw new RouteError(400, "Erro ao gerar certificado.");
          }
          res
            .status(201)
            .json({ certificate: certificate.id, title: "aula concluída" });
          return;
        }

        res.status(201).json({ certificate: null, title: "Aula concluída." });
      } catch (err) {
        res.status(400).json({ title: "Aula não encontrada." });
      }
    },

    resetCourse: (req, res) => {
      const userId = 1;
      const { courseId } = req.body;

      const writeResult = this.query.deleteLessonsCompleted(userId, courseId);

      if (writeResult.changes === 0) {
        throw new RouteError(400, "Erro ao resetar curso.");
      }

      res.status(200).json({ title: "Curso resetado." });
    },
  } satisfies Api["handlers"];

  tables(): void {
    this.db.exec(lmsTables);
  }

  routes(): void {
    this.router.post("/lms/course", this.handlers.postCourse);
    this.router.get("/lms/courses", this.handlers.getCourses);
    this.router.get("/lms/course/:slug", this.handlers.getCourse);
    this.router.delete("/lms/course/reset", this.handlers.resetCourse);
    this.router.post("/lms/lesson", this.handlers.postLesson);
    this.router.get(
      "/lms/lesson/:courseSlug/:lessonSlug",
      this.handlers.getLesson,
    );
    this.router.post("/lms/lesson/complete", this.handlers.postLessonComplete);
  }
}
