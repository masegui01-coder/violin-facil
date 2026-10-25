# Conectar «Mi banda» a Firebase (10 minutos)

«Mi banda» guarda las bandas, tareas y progreso en Firebase (Google). Con el plan gratuito (Spark) sobra para muchas bandas. No hace falta tarjeta de crédito.

1. **Crea el proyecto.** Entra en https://console.firebase.google.com con tu cuenta de Google y pulsa *Crear un proyecto*. Llámalo `band-flow` y desactiva Google Analytics, que no hace falta.
2. **Activa el inicio de sesión.** Ve a *Compilación → Authentication → Comenzar → Método de acceso* y habilita:
   - **Anónimo**: es para los músicos, que entran solo con un apodo y el código de la banda (válido también para menores, sin email).
   - **Google**: es para los directores. Te pedirá un correo de asistencia; pon el tuyo.
3. **Autoriza la web.** En *Authentication → Configuración → Dominios autorizados → Agregar dominio*, escribe `masegui01-coder.github.io`.
4. **Crea la base de datos.** Ve a *Compilación → Firestore Database → Crear base de datos*, elige el **modo de producción** y la ubicación `eur3 (europe-west)`.
5. **Pega las reglas de seguridad.** En *Firestore → Reglas*, borra lo que haya, pega el contenido del archivo `firestore.rules` de este proyecto y pulsa **Publicar**.
6. **Registra la app web.** En el engranaje ⚙ → *Configuración del proyecto → General → Tus apps*, pulsa el icono web `</>`, pon el nombre «Band Flow», no marques Hosting y pulsa *Registrar*. Aparecerá un bloque `const firebaseConfig = { apiKey: …, authDomain: …, projectId: …, … }`. **Cópialo y pásamelo.**

Los datos de `firebaseConfig` no son secretos: identifican el proyecto y van dentro de la web. La seguridad la ponen las reglas del paso 5: cada músico solo puede escribir su propio progreso y solo el director ve el de todos.
