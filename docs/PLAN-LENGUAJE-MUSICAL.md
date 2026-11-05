# Plan: curso de Lenguaje Musical + Aula Pro (aprobado por el usuario el 2026-11-05)

## Decisiones del usuario
- Curso de Lenguaje Musical **gratis para el alumno**; solo el **Aula Pro** del profesor es de pago.
- El **Método Pro** de instrumento actual pasa a ser temario asignable dentro del Aula; la pestaña Pro = Aula.
- Cobro real fuera de alcance: la licencia Pro la activa el administrador (como `premiumActive` de la Escuela, js/school.js).
  Más adelante el pago irá **siempre a través de Google Play (Android) y App Store (iOS)**; la versión web entrará con la cuenta de Google. Precio, modalidad y quién paga: por decidir.
  Por eso el acceso Pro se consulta en un único punto (`proAccess()` o similar), alimentado hoy por el flag del administrador, para enchufar después la verificación de compras de las tiendas sin tocar las pantallas.
- Fase 1: motor + **Nivel 1 completo (8 unidades)** + Aula Pro. Fase 2: niveles 2-4.
- Puerta de calidad con **mínimo 8**, peso en originalidad, calidad del contenido, sentido didáctico y menús de seguimiento.
- Referencia de nivel: libros de un curso de Lenguaje Musical de 4 niveles que pasó el usuario. **No copiar** ejercicios, canciones ni textos: todo original o de dominio público.

## Curso (alumno)
4 niveles × 8 unidades. Cada unidad, secciones con versión **Fácil** y **Media**:
Teoría (ficha + práctica interactiva) · Ritmo (palmas por micro o toque en pantalla, metrónomo, juego STOP) ·
Agilidad de notas (sol y fa, contra reloj) · Entonación (ordenamientos bicorde→octocorde y lectura melódica **cantada**, la app corrige la voz) ·
Dictado (cantado, tocado o escrito en el pentagrama) · Canción de la unidad (original) · Audición y cultura (ficha original + fragmento de dominio público sintetizado) ·
Creatividad (compón y envía al profesor) · Repaso/evaluación por competencias.
Todo en pantalla; imprimir ficha en PDF opcional (js/pdf-writer.js).

Progresión: N1 negra/corchea/blanca y silencios, 2/4 3/4 4/4, clave de sol, Do M y La m, bicorde→octocorde ·
N2 clave de fa, semicorcheas, puntillo, 6/8, intervalos, 1 alteración · N3 menores natural/armónica/melódica, intervalos M/m/A/d, ligaduras, ternario, 3 alteraciones ·
N4 todas las tonalidades, tresillos, síncopas, amalgama, grados y acordes, modulación sencilla.

## Dos temarios entrelazados (indicación del usuario, 2026-11-05)
- **Temario común** (Lenguaje Musical, igual para todos) y **temario de instrumento** (técnica y repertorio del instrumento concreto del alumno), intercalados unidad a unidad: lo que se aprende en Lenguaje se aplica en el instrumento en la misma unidad.
- **Reutilizar las herramientas que ya existen** como tipos de ejercicio dentro de las unidades y de los libros, en vez de rehacerlas: Dictados (js/dictation*.js), Lectura a primera vista y lectura rítmica (js/generate.js, rhythm-reading.js), Gimnasio de técnica (gym), Afinar en acorde (chord), Notas tenidas (longtone), Teoría (theory.js), Toca libre/De memoria (free.js), lecciones del curso y páginas del Libro (book*), Método Pro (method*.js). Cada herramienta debe poder lanzarse con parámetros fijos desde una unidad (nivel, compás, tonalidad, semilla…) y devolver su resultado con el contrato de abajo.
- Lo nuevo (entonación cantada, pentagrama de varias notas para escribir, trazar barras de compás, STOP, agilidad, audición, creatividad) se construye solo donde no haya ya una herramienta.

## Contrato de resultados (lo comparten curso y Aula)
Cada intento de ejercicio emite un resultado:
`{ id: 'lm1-u3-ritmo-a-facil', level: 1, unit: 3, section: 'ritmo'|'teoria'|'agilidad'|'entonacion'|'dictado'|'cancion'|'audicion'|'creatividad'|'repaso', variant: 'facil'|'medio', pct: 0-100, stars: 0-3, seconds, at: epoch ms, skills: { ritmo?, entonacion?, lectura?, teoria?, dictado?, audicion? } (0-100), mistakes?: ['3M-3m', …] (códigos cortos, ≤10) }`
Se guarda en `state.lm` (mejor y último por id, minutos por día) y se publica un resumen al Aula si el alumno pertenece a una clase.
Catálogo: `js/lm/catalog.js` exporta `LM_LEVELS` con niveles → unidades → ejercicios `{ id, section, variant, title, … }` para que el Aula pueda asignarlos.

## Aula Pro (profesor)
Clases con código (sobre schools/ de school-api.js) · tareas: unidad / sección / ejercicios del catálogo, lecciones de instrumento, páginas del Libro, Método Pro, MusicXML; fecha, nota mínima, intentos, Fácil/Medio ·
Seguimiento: tabla clase (alumnos × unidades/tareas, color por %), quién no ha practicado esta semana, vencidas; ficha de alumno (minutos/día, racha, % por competencia, errores frecuentes, mejor intento); informe trimestral con baremo 1-10 por apartado en PDF y CSV; comentario del profesor por entrega ·
Alumno: «Mis tareas» en Pro. Reglas de Firestore: el profesor solo ve su clase; validación estricta de campos.
