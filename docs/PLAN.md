# Violín Fácil 2.0: plan

## Objetivo
Una app para aprender violín al estilo de Simply Piano. La app te escucha, te guía nota a nota y luego te pide tocar a tempo. Las lecciones avanzadas usan canciones del estilo de música que elijas, y puedes cambiar el estilo cuando quieras.

## Experiencia
1. **Bienvenida (solo la primera vez):** eliges la nomenclatura (Do-Re-Mi o G3-A4), tu nivel (nunca he tocado / sé lo básico / toco con soltura) y tus estilos favoritos. Todo se puede cambiar después en Perfil.
2. **Aprender:** un mapa del curso con 8 unidades. Las lecciones se desbloquean en orden y cada una da de 1 a 3 estrellas.
   - Hay 4 tipos de lección: *Teoría* (tarjetas con el diapasón dibujado), *Notas* (la app espera a que toques cada nota), *Canción, modo aprender* (espera) y *Canción, modo a tempo* (la partitura avanza con cuenta previa y se puntúa la precisión).
   - Desde la unidad 4, cada unidad incluye lecciones **«Tu música»**: canciones de tus estilos con la dificultad de esa unidad. Si cambias de estilo, esas lecciones cambian.
3. **Canciones:** una biblioteca filtrada por estilo, con la dificultad de cada canción.
4. **Práctica:** afinador, metrónomo y «Toca libre», que muestra en el pentagrama y en el diapasón cualquier nota que toques.
5. **Perfil:** racha de días, puntos, lecciones hechas y ajustes (estilos, nomenclatura, exigencia de afinación, diapasón visible, desbloquear todo y comentarios).

## Estilos (repertorio de dominio público o composiciones originales)
Clásica · Folk y country · Jazz y blues · Navidad · Populares · Rock y pop (composiciones originales, porque las canciones pop actuales tienen derechos de autor).

## Técnica
- Web app estática en GitHub Pages, sin dependencias, con módulos ES separados por función (`js/`), cada archivo por debajo de 800 líneas.
- Detección de tono YIN, metrónomo programado en el reloj de audio y clics silenciados para el micrófono.
- Notación propia en SVG: clave, armadura, compás, figuras (redonda a semicorchea), puntillo, silencios, líneas adicionales y barras de compás.
- Digitación automática en primera posición, con dedos «bajo» y «alto».
- Tests con `node --test`: notación, digitación, detector de tono, que cada compás de cada canción sume lo que indica su compás, rango tocable y montaje del curso según los estilos.
- Progreso guardado en el navegador, migrando el de la versión 1.
