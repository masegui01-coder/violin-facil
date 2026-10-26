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

## Otros pendientes

- Poner el `measurementId` de Google Analytics en `js/firebase-config.js` (hay que activarlo antes en Firebase).
- Simplificar los premios (una sola moneda para la liga) y el resto de ajustes de los cursos: octava de la tuba,
  digitaciones del oboe, técnica de la rutina según el nivel y notas que salen antes de explicarse.
