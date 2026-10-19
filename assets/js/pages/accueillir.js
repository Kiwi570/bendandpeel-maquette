/* Accueillir le spectacle : dossier pour les lieux, déroulé, parcours, demande simulée. */
import { buildFrise } from '../components/frise.js';
import { buildMap } from '../components/map.js';
import { fillStats } from '../core/stats.js';
import { simForms, pastWall } from './common.js';

export default function () {
  fillStats();
  document.querySelectorAll('[data-frise]').forEach(buildFrise);
  document.querySelectorAll('[data-map]').forEach((m) => buildMap(m));
  pastWall();
  simForms();
}
