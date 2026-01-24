import { Core } from './core/core.ts';
import {
  criarCurso,
  criarAula,
  pegarCursos,
  pegarCurso,
  pegarAulas,
  pegarAula,
} from './core/database.ts';

const core = new Core();

core.router.get('/curso/:curso', (req, res) => {
  const slug = req.query.get('slug');
  const curso = pegarCurso(slug);
  if (curso) {
    res.status(200).json(curso);
  } else {
    res.status(404).json('curso não encontrado');
  }
});

core.router.get('/', (req, res) => {
    res.status(200).json('ola');
});

core.router.get('/aula/:aula', (req, res) => {
    res.status(200).json('aula');
});

core.router.get('/', (req, res) => {
  res.status(200).end('Hello');
})

core.init();