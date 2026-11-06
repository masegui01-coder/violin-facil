// Inglés del modo prueba (testers sin cuenta, js/screens/demo.js). Vocabulario: «modo prueba», trial mode (como ya se
// traducía); «alumno», student; «profesor», teacher; «alumnos de ejemplo», sample students.
// Va el primero en EXACT (si una frase ya existía, gana la traducción de siempre).
export const DEMO_EXACT = {
  // Pantalla de acceso y elección de papel
  'o sin cuenta, para probar': 'or without an account, to try it out',
  'Probar sin cuenta (modo prueba)': 'Try without an account (trial mode)',
  'Para testers: entra como alumno o como profesor sin registrarte. Lo que hagas en la prueba se borra al salir y caduca en 7 días.':
    'For testers: come in as a student or as a teacher without signing up. What you do in the trial is deleted when you leave and expires in 7 days.',
  'Modo prueba': 'Trial mode', '¿Cómo quieres probar la app?': 'How do you want to try the app?',
  'Alumno': 'Student', 'Profesor': 'Teacher',
  'Todo el curso abierto (también Lenguaje Musical) y entrar en una clase con el código de tu profesor.':
    "The whole course unlocked (Music Theory too) and joining a class with your teacher's code.",
  'Aula Pro de prueba: crea clases, pon tareas y mira el progreso de tus alumnos.': "Trial Classroom Pro: create classes, set tasks and see your students' progress.",
  'Para probar el Aula de verdad usa dos móviles: uno como profesor y otro como alumno.': 'To really try the Classroom use two phones: one as the teacher and one as the student.',
  'Cierra tu sesión para entrar en el modo prueba.': 'Sign out to enter trial mode.',
  'No he podido preparar el Aula de prueba. Inténtalo otra vez.': "I couldn't set up the trial Classroom. Try again.",
  // Avisos
  'Modo prueba: has entrado como profesor': "Trial mode: you're in as a teacher",
  'Modo prueba: has entrado como alumno': "Trial mode: you're in as a student",
  'Has salido del modo prueba: se ha borrado todo lo de la prueba': 'You left trial mode: everything from the trial has been deleted',
  'Alumnos de ejemplo quitados': 'Sample students removed', 'Alumnos de ejemplo añadidos: abre una clase para verlos': 'Sample students added: open a class to see them',
  // Aviso fijo arriba, cambiar de papel y salir
  'Modo prueba · profesor': 'Trial mode · teacher', 'Modo prueba · alumno': 'Trial mode · student',
  'Caduca el': 'Expires on', 'La prueba ha caducado': 'The trial has expired', 'Borrando la prueba…': 'Deleting the trial…',
  'Cambiar a profesor': 'Switch to teacher', 'Cambiar a alumno': 'Switch to student', 'Salir del modo prueba': 'Leave trial mode',
  '¿Cambiar a profesor?': 'Switch to teacher?', '¿Cambiar a alumno?': 'Switch to student?', '¿Salir del modo prueba?': 'Leave trial mode?',
  'Se borran tu escuela de prueba, tus clases, sus tareas y lo que hayan enviado los alumnos de prueba.':
    'Your trial school, your classes, their tasks and everything the trial students sent are deleted.',
  'Sales de tus clases de prueba y se borra el progreso que has hecho en la prueba.': 'You leave your trial classes and the progress you made in the trial is deleted.',
  'Cambiar y borrar la prueba': 'Switch and delete the trial', 'Salir y borrar la prueba': 'Leave and delete the trial',
  // Aula: los tres pasos y los alumnos de ejemplo
  'Pruébalo con dos móviles': 'Try it with two phones',
  'Crea una clase y apunta su código.': 'Create a class and note down its code.',
  'En otro móvil, entra en el modo prueba como alumno y únete con ese código.': 'On another phone, enter trial mode as a student and join with that code.',
  'Pon una tarea (por ejemplo, una unidad de Lenguaje Musical) y mira aquí el progreso del alumno.': "Set a task (for example, a Music Theory unit) and see the student's progress here.",
  'En otro móvil, entra en el modo prueba como profesor y crea una clase.': 'On another phone, enter trial mode as a teacher and create a class.',
  'Escribe aquí abajo el código de la clase y tu nombre.': 'Type the class code and your name below.',
  'Haz la tarea desde «Mis tareas»: tu profesor verá tu progreso en su móvil.': 'Do the task from “My tasks”: your teacher will see your progress on their phone.',
  'Tu Aula de prueba (3 clases y 30 alumnos por clase como mucho) caduca el': 'Your trial Classroom (up to 3 classes and 30 students per class) expires on',
  'Al salir del modo prueba se borra todo.': 'Everything is deleted when you leave trial mode.',
  'Al salir del modo prueba sales de tus clases y se borra tu progreso de la prueba.': 'When you leave trial mode you leave your classes and your trial progress is deleted.',
  'Rellenar con alumnos de ejemplo': 'Fill with sample students', 'Quitar los alumnos de ejemplo': 'Remove the sample students',
  'Alumnos inventados, marcados «(ejemplo)», para ver la tabla, los filtros, la ficha y el informe. Solo se ven en este móvil.':
    'Made-up students, marked “(sample)”, to see the table, the filters, the student file and the report. Only visible on this phone.',
  'En el modo prueba caben 3 clases como mucho.': 'Trial mode allows up to 3 classes.',
  // Modo tester (usuarios con cuenta): clase de ejemplo solo en este móvil
  'Modo tester': 'Tester mode', 'Modo tester:': 'Tester mode:', 'Ver como alumno': 'View as student', 'Ver como profesor': 'View as teacher',
  'Abrir el libro de Lenguaje Musical (Nivel 1)': 'Open the Music Theory book (Level 1)',
  'Modo tester: ves el Aula como profesor (clase de ejemplo)': "Tester mode: you're seeing the Classroom as a teacher (sample class)",
  'Modo tester: ves el Aula como alumno (tareas de ejemplo)': "Tester mode: you're seeing the Classroom as a student (sample tasks)",
  'Has salido del modo tester: vuelves a tu Aula de siempre': 'You left tester mode: back to your usual Classroom',
  'Mira el Aula como alumno o como profesor con una clase de ejemplo, sin registrarte en ninguna clase ni pedir licencia. Nada de lo que hagas toca tus datos.':
    "See the Classroom as a student or as a teacher with a sample class, without joining any class or requesting a licence. Nothing you do touches your data.",
  'Clase de ejemplo con alumnos inventados («ejemplo»): prueba la tabla, los filtros, las fichas, el informe trimestral, los comentarios y el formulario de tareas. Todo se queda en este móvil.':
    'Sample class with made-up students (“sample”): try the table, the filters, the student files, the term report, the comments and the task form. Everything stays on this phone.',
  'Abrir la clase de ejemplo': 'Open the sample class',
  'Para probarlo de verdad con dos móviles, usa «Probar sin cuenta (modo prueba)» en una ventana privada o en otro móvil.':
    'To really try it with two phones, use “Try without an account (trial mode)” in a private window or on another phone.',
  'Tareas de ejemplo de una profesora inventada. Al hacerlas se abre el ejercicio de verdad y tu resultado aparece en la tarea.':
    'Sample tasks from a made-up teacher. Doing them opens the real exercise and your result shows up in the task.',
  'Unirme a una clase de verdad con código': 'Join a real class with a code',
  'Modo tester · profesor': 'Tester mode · teacher', 'Modo tester · alumno': 'Tester mode · student', 'Clase de ejemplo: nada toca tus datos': 'Sample class: nothing touches your data',
  // Contenido de la clase de ejemplo (tester-view.js)
  'Escuela de ejemplo': 'Sample school', 'Lenguaje 1 · Ejemplo': 'Music Theory 1 · Sample',
  'Unidad 1 · El latido': 'Unit 1 · The beat', 'Ritmo · Unidad 2': 'Rhythm · Unit 2', 'Ejercicios · Unidad 3': 'Exercises · Unit 3',
  'Nivel 1 · Unidad 1: El latido': 'Level 1 · Unit 1: The beat', 'Nivel 1 · Unidad 2: Corcheas a pares · Ritmo': 'Level 1 · Unit 2: Quavers in pairs · Rhythm',
  'Nivel 1 · Unidad 3: Sonidos largos · 2 ejercicios': 'Level 1 · Unit 3: Long sounds · 2 exercises', 'Violín · Unidad 1 · Conoce tu violín': 'Violin · Unit 1 · Get to know your violin',
  'Haz todas las secciones. Si te cuesta el dictado, repítelo.': "Do every section. If dictation is hard for you, do it again.",
  '¡Muy buen pulso! Ahora repasa el dictado.': 'Great pulse! Now go over the dictation.', 'Bien. Mira otra vez cómo se coge el arco.': 'Good. Look again at how to hold the bow.',
  '¡Muy bien! Ya conoces las partes de tu instrumento.': 'Very good! You now know the parts of your instrument.',
  'Te falta terminar la unidad: el dictado es lo que más te cuesta.': "You still need to finish the unit: dictation is what you find hardest.",
  'Mi primer ritmo': 'My first rhythm', 'Sonido largo': 'Long sound',
  'Escuela de prueba': 'Trial school', 'Profe de prueba': 'Trial teacher', 'Alumno de prueba': 'Trial student',
};

export function demoPatterns() {
  return [
    [/^Clase de (.+) \(ejemplo\)$/, (m, name) => `${name} (sample)'s class`],
    [/^(.+) \(ejemplo\)$/, (m, name) => `${name} (sample)`],
  ];
}
