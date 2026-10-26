// Métricas de la app (solo administrador). Enlace directo: ?panel=metricas
import { $, esc } from '../ui.js';
import { register, go } from '../router.js';
import { currentAccount, onAccount } from '../account.js';
import { isAdmin, listTesters } from '../sync.js';
import { cloudErrorText } from '../cloud.js';
import { instrumentById } from '../instruments.js';
import { userMetrics, groupMetrics, isAdminEmail } from '../metrics.js';
import { listBandsWithMembers, listGroupsWithSongs } from '../admin-api.js';
import { columns, hbars, statTile, attachTooltips } from '../charts.js';
import { openTesters } from './account-panel.js';

const CONSOLE = 'https://console.firebase.google.com/project/band-flow-83d4b';
const body = html => { $('metricsBody').innerHTML = html; };

async function adminCheck(acc) {
  return !!acc && (isAdminEmail(acc.email) || await isAdmin(acc.uid));
}

async function enter() {
  const acc = currentAccount();
  if (!acc) {
    body('<p>Entra con la cuenta de administrador para ver las métricas.</p><button type="button" class="btn" id="metricsLogin">Entrar</button>');
    $('metricsLogin').addEventListener('click', () => go('account'));
    return;
  }
  if (!(await adminCheck(acc))) { body('<p class="warn">Esta página es solo para el administrador de la app.</p>'); return; }
  body('<p class="empty">Calculando…</p>');
  try {
    const [testers, bands, groups] = await Promise.all([
      listTesters(), listBandsWithMembers().catch(() => null), listGroupsWithSongs().catch(() => null),
    ]);
    render(testers, bands, groups);
  } catch (err) { body(`<p class="warn">${esc(cloudErrorText(err))}</p>`); }
}

function render(testers, bands, groups) {
  const m = userMetrics(testers.map(t => ({ ...t, instrumentName: t.instrument ? instrumentById(t.instrument).name : '' })));
  const g = groups ? groupMetrics(groups) : null;
  const musicians = bands ? bands.reduce((s, b) => s + Math.max(0, b.members - 1), 0) : 0;
  body(`<p class="muted small">Datos de los usuarios con cuenta. Se actualizan cada vez que alguien usa la app. ${new Date().toLocaleString('es-ES')}</p>
    <div class="tiles">
      ${statTile({ label: 'Usuarios con cuenta', value: m.total, hint: `${m.newThisWeek} nuevos esta semana` })}
      ${statTile({ label: 'Activos hoy', value: m.active1 })}
      ${statTile({ label: 'Activos 7 días', value: m.active7, hint: `${m.total ? Math.round((m.active7 / m.total) * 100) : 0} % del total` })}
      ${statTile({ label: 'Activos 30 días', value: m.active30 })}
      ${statTile({ label: 'Minutos de práctica', value: m.minutes, hint: `${m.minutesPerUser} por usuario` })}
      ${statTile({ label: 'Lecciones tocadas', value: m.lessons })}
    </div>
    <h2>Altas por semana</h2>
    ${columns(m.signups, { unit: 'altas', title: 'Usuarios nuevos por semana', xLabels: [0, 3, 7] })}
    <h2>¿Vuelven?</h2>
    ${hbars(m.retention.map(r => ({ label: r.label, value: r.value, display: `${r.value} %` })), { max: 100 })}
    <h2>Instrumentos</h2>
    ${hbars(m.instruments.slice(0, 10))}
    <h2>Dispositivos</h2>
    ${hbars(m.platforms.slice(0, 8))}
    <h2>Bandas y grupos</h2>
    <div class="tiles">
      ${statTile({ label: 'Bandas', value: bands ? bands.length : '—', hint: bands ? `${musicians} músicos` : 'sin permiso todavía' })}
      ${statTile({ label: 'Usuarios en una banda', value: m.inBand })}
      ${statTile({ label: 'Grupos', value: g ? g.groups : '—', hint: g ? `${g.members} músicos` : '' })}
      ${statTile({ label: 'Canciones de grupo', value: g ? g.songs : '—', hint: g ? `${g.tracks} pistas · ${g.megabytes} MB` : '' })}
    </div>
    ${bands && bands.length ? `<div class="table-wrap"><table class="prog-table"><thead><tr><th>Banda</th><th>Director</th><th class="num">Músicos</th></tr></thead><tbody>
      ${bands.sort((a, b) => b.members - a.members).map(b => `<tr><td>${esc(b.name)}</td><td>${esc(b.directorName || '')}</td><td class="num">${Math.max(0, b.members - 1)}</td></tr>`).join('')}</tbody></table></div>` : ''}
    <div class="row"><button type="button" class="btn small" id="metricsTesters">Lista de testers y CSV</button><button type="button" class="btn ghost small" id="metricsReload">Actualizar</button></div>
    <h2>Más datos en Firebase</h2>
    <div class="list">
      <a class="list-row" href="${CONSOLE}/analytics" target="_blank" rel="noopener"><span><b>Google Analytics</b><small>Visitas, pantallas y países (cuando esté activado)</small></span><span class="chev">›</span></a>
      <a class="list-row" href="${CONSOLE}/firestore/databases/-default-/usage" target="_blank" rel="noopener"><span><b>Uso de la base de datos</b><small>Lecturas, escrituras y espacio frente al límite gratuito</small></span><span class="chev">›</span></a>
      <a class="list-row" href="${CONSOLE}/authentication/users" target="_blank" rel="noopener"><span><b>Usuarios registrados</b><small>Cuentas de Google y correo</small></span><span class="chev">›</span></a>
    </div>`);
  attachTooltips($('metricsBody'));
  $('metricsTesters').addEventListener('click', openTesters);
  $('metricsReload').addEventListener('click', enter);
}

register('metrics', { enter });

// Enlace directo: al entrar con la cuenta se abren las métricas
if (new URLSearchParams(location.search).get('panel') === 'metricas') {
  let opened = false;
  const open = acc => { if (acc && !opened) { opened = true; setTimeout(() => go('metrics'), 400); } };
  onAccount(open);
  open(currentAccount());
}
