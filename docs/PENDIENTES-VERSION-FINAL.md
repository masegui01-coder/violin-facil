# Pendientes antes de publicar la versión final

Cosas aparcadas que hay que decidir (implementar o descartar) antes de la versión final.

## Verificar a los directores de banda (aparcado el 2026-10-26)

Hoy cualquiera con cuenta puede crear una banda y ser su director. Propuesta en tres capas:

1. **Banda sin verificar, con límites:** se crea al momento, pero admite como mucho 15–20 músicos, biblioteca
   limitada y sin avisos masivos. Los músicos ven «Banda sin verificar». Protege sobre todo a los menores.
2. **Verificación ligera que revisa el administrador:** en *Más → Verificar mi banda* el director da el nombre
   oficial, la localidad y una prueba: correo de la banda/ayuntamiento/conservatorio (con enlace de confirmación)
   o un código publicado en la web o las redes oficiales de la banda. Las solicitudes llegan al panel de
   administrador; al aprobar, insignia «✓ Banda verificada» y sin límites. Solo un admin puede cambiar
   `verified` (regla de Firestore). Ayuda: listados de sociedades musicales de las federaciones.
3. **Por actividad (más adelante):** si una banda sin verificar tiene unos 8 músicos activos durante 2 semanas,
   se propone al administrador como «probablemente real».

Por decidir: el límite de músicos sin verificar y qué pruebas se aceptan (correo oficial, web/redes o ambas).

## Cobro de la licencia de escuela (2026-10-26)

La sección Escuela es premium, pero aún no hay pagos: la licencia (hasta 200 alumnos, hasta el 31 de agosto) la activa
el administrador a mano desde Métricas → Escuelas, y sin ella la escuela funciona en modo prueba con 5 alumnos.
Antes de la versión final: decidir el precio y la forma de cobro (transferencia y factura, Stripe o Google Play)
y automatizar la activación.

## Revisar con un profesor antes de subir (2026-10-26)

Tras la revisión de los 24 instrumentos quedaron datos sin rellenar, a falta de confirmarlos con Fran o con un profesor
de cada instrumento (no se han inventado):

- **Oboe:** faltan digitaciones de la escala de la banda (Si♭4, Do5, Re5, Mi♭5, Fa5, Si♭5) y del Fa4; ahora sale
  «consulta tu tabla». Incluir el medio agujero del Re5 y decidir Fa de horquilla o con llave.
- **Clarinete y clarinete bajo:** falta el Fa5 escrito (última nota de su «Escala de Fa»).
- **Trompa en Fa:** confirmar Re♭5 (ahora «cilindro 2»; las tablas suelen dar 1-2) y Mi4 (ahora al aire; suelen dar 1-2).
- **Detector de cuerda vecina:** solo mira saltos de 5 y 7 semitonos; no detecta los 4 de Sol–Si en la guitarra
  ni de Do–Mi en el ukelele.
- **Rutina del cajón:** recibe los rudimentos de caja (paradiddle); valorar una rutina propia de palmas y tonos.
- **Imágenes de los consejos:** pendientes de generar con IA a partir de `docs/prompts-imagenes-consejos.md`
  (el clarinete bajo aún usa la del barrilete).

## Otros pendientes

- Poner el `measurementId` de Google Analytics en `js/firebase-config.js` (hay que activarlo antes en Firebase).
- Simplificar los premios (una sola moneda para la liga) y el resto de ajustes de los cursos: octava de la tuba,
  digitaciones del oboe, técnica de la rutina según el nivel y notas que salen antes de explicarse.
