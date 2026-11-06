# Plan: Aprender con dos caminos (propuesta 2026-11-06, pendiente de aprobación)

## Decisión del usuario
- La pestaña Aprender deja de tener cuatro modos (Casual, Libro, Lenguaje, Pro) y pasa a tener **dos caminos**:
  **Por mi cuenta** y **Con profesor**, más **Técnica** compartida.
- «Por mi cuenta» **no** es el temario del libro con otra cara: es para quien empieza solo y debe volver,
  divertirse y aprender tocando canciones («que vuelvan, que se diviertan, que aprendan divirtiéndose»).
- Los dos caminos llevan los consejos de técnica (colocación del instrumento, boca, dedos).

## 1. Por mi cuenta: aprender tocando canciones
**Objetivo:** retención diaria (D1, D7, D30) y la sensación de «ya sé tocar algo» en la primera sesión.

**Curso largo y muy gradual (indicación del usuario, 2026-11-06):** «que sea un curso largo tipo Duolingo… muy pronto
me pedía tocar varias notas, se me hizo complicado». Por eso:
- Muchas lecciones muy cortas (2-3 min) y **una sola cosa nueva por lección**. Nunca dos notas nuevas a la vez.
- Una nota nueva se practica sola y con **una** vecina conocida durante varias lecciones antes de usarla en una melodía.
- Las primeras canciones usan 1, 2 y luego 3 notas (arreglos simplificados o frases cortas), aunque la melodía original tenga más.
- Cada lección repite mucho lo ya sabido (≈80 % conocido, 20 % nuevo) y termina siempre con éxito.
- Si el alumno falla mucho, la app baja el paso (más despacio, menos notas, con ayuda) en vez de hacerle repetir lo mismo.
- Un curso de cientos de lecciones por instrumento, como Duolingo: avance pequeño pero constante.
- Se prueba con principiantes reales simulados en la puerta de calidad: ninguna lección del primer mes puede pedir más de lo que se ha practicado.

- **Cada unidad es una canción**, con el título y la meta a la vista («Esta semana: Cumpleaños feliz»).
  Pasos hacia ella, reaprovechando `course-steps.js`:
  1. escucharla con la partitura que se ilumina;
  2. sus notas nuevas, de 2 en 2;
  3. la frase 1 con acompañamiento;
  4. la frase 2;
  5. entera despacio;
  6. **concierto**: a tempo, con acompañamiento, aplausos, grabación para escucharte y compartir.
- **Primera sesión:** en menos de 5 minutos se toca una frase reconocible (por instrumento: 2-3 notas).
- **Teoría mínima y en el momento:** tarjetas de 20-30 s solo cuando la canción las necesita
  (p. ej. «esta nota dura dos pulsos»), con su dibujo. Sin fichas largas ni exámenes. Si quiere más, enlace al libro.
- **Técnica en el momento:** antes de la canción que pide algo nuevo (cambiar de cuerda, registro agudo,
  boquilla), tarjeta de 30 s con la ilustración de `tips`. Después de tocar, el consejo del micrófono (ya existe).
- **Ganchos para volver:**
  - racha y objetivo diario elegible (5, 10 o 15 min);
  - **repaso de 2 minutos** con lo que fallas (repaso espaciado: vuelve a 1, 3 y 7 días);
  - retos rápidos tipo **Relax** (de `screens/pro-relax.js`) como «calentamiento» y para salvar la racha;
  - cofres y medallas por canción aprendida, y **cancionero** con lo que ya sabes tocar (para presumir);
  - la liga semanal (`league.js`) si ya está activa.
- **Elegir qué tocar:** desde la unidad 3, en cada unidad se elige entre 2-3 canciones del mismo nivel
  (de las 41 de `songs.js` y las del curso del instrumento). Sensación de control.
- **Puente al estudio:** tras ~3 semanas o cuando acaba un bloque, tarjeta discreta: «¿Quieres ir más en serio?
  El libro te enseña a leer música» → Con profesor › Mi libro. Lo aprendido cuenta.

## 2. Con profesor: el libro de estudio
- **Alumno:** arriba «Mis tareas» (del Aula), debajo **Mi libro** por unidades con los dos temarios juntos:
  Lenguaje Musical (común) + temario del instrumento (lo que hoy son Libro y Método Pro), intercalados unidad a unidad.
- **Sin profesor:** el libro se puede estudiar solo; «Unirme a una clase» queda a mano.
- **Profesor:** «Mis clases» (Aula Pro) en el mismo sitio.
- La teoría ilustrada, los dictados, la entonación y el resto del curso de Lenguaje viven aquí.

## 3. Técnica (en los dos caminos)
- Botón fijo «Técnica» arriba en Aprender: los consejos de postura, boca y dedos del instrumento, con las ilustraciones y fotos ya hechas.
- Tarjetas en el momento justo (camino 1) y en cada unidad del libro (camino 2).

## Migración
- Nadie pierde progreso: los pasos del Casual siguen contando (`parentKey`), las medallas del Libro y los niveles del Método Pro pasan a Mi libro.
- La primera vez se elige el camino (o se deduce: si está en una clase → Con profesor). Se puede cambiar siempre.
- `learnView` antiguo (`casual|book|lm|pro`) se traduce al nuevo (`solo|profe`).

## Fases
1. **Estructura:** dos caminos + Técnica, migración, sin contenido nuevo (lo de hoy reordenado). Publicable.
2. **Por mi cuenta:** unidades-canción, concierto, teoría y técnica en el momento, repaso espaciado, elegir canción, cancionero.
3. **Mi libro:** Lenguaje + instrumento intercalados por unidad.

## Calidad
- Puerta de calidad: mínimo 8 en todo; en el camino 1, peso especial en diversión, primera sesión y retención; contenido revisado por expertos de cada familia de instrumentos.
- Métricas: tiempo hasta la primera canción, % que vuelve al día siguiente y a los 7 días, rachas.

## Riesgos
- Rehacer el Casual como unidades-canción toca el contenido de todos los instrumentos: hacerlo con el generador de pasos y canciones que ya existen, no a mano.
- Percusión y xilófono: «canción» = ritmo o melodía de láminas; adaptar.
- Que el camino 1 no se convierta en otro temario: cada pantalla debe acabar en tocar.
