/**
 * ============================================================
 * EJEMPLO 3 — VERSIÓN ASYNC/AWAIT (idiomática y funcional)
 * ============================================================
 * Versión recomendada: async/await para la legibilidad,
 * try/catch/finally para el manejo de errores, y una "receta" de
 * PASOS PUROS encadenados a mano en `main()`.
 *
 * Cada paso es una función pura en su firma: recibe un estado y
 * devuelve un estado NUEVO (nunca muta el que recibe). Llamarlos
 * directamente con `await`, uno detrás de otro, es preferible a
 * envolverlos en una utilidad de composición genérica (pipeAsync):
 * el flujo es igual de legible pero cada paso queda a un solo
 * `await` de distancia de sus vecinos, sin indirección extra ni
 * necesidad de saber cómo funciona el "pipe" por debajo.
 *
 * Ejecutar:  npm run example:async
 * ============================================================
 */

import { connectDatabase, disconnectDatabase } from "../config/db.js";
import { deleteAllOrganizations, seedOrganizations } from "../services/organization.service.js";
import {
  aggregateUsersByOrganization,
  deleteAllUsers,
  findUserByName,
  findUserSummaryByName,
  findUserWithOrganization,
  seedUsers,
} from "../services/user.service.js";
import { usersSeed, organizationsSeed } from "./seed-data.js";

// Estado que fluye por la receta. Es de solo lectura (readonly):
// ningún paso puede mutarlo, solo puede devolver uno nuevo.
interface DemoState {
  readonly organizationsCount: number;
  readonly usersCount: number;
}

const initialState: DemoState = { organizationsCount: 0, usersCount: 0 };

const cleanDatabase = async (state: DemoState): Promise<DemoState> => {
  await Promise.all([deleteAllUsers(), deleteAllOrganizations()]);
  console.info("Base de datos limpiada");
  return state;
};

const seedDatabase = async (state: DemoState): Promise<DemoState> => {
  const organizations = await seedOrganizations(organizationsSeed);
  console.info("Organizaciones insertadas: %d", organizations.length);
  const users = await seedUsers(usersSeed);
  console.info("Usuarios insertados: %d", users.length);
  // Spread: devolvemos un objeto NUEVO en vez de modificar "state".
  return { ...state, organizationsCount: organizations.length, usersCount: users.length };
};

const runCrudDemo = async (state: DemoState): Promise<DemoState> => {
  console.info("\n--- CRUD ---");
  const bill = await findUserByName("Bill");
  console.info({ bill }, "Usuario encontrado:");

  const billSummary = await findUserSummaryByName("Bill");
  console.info({ billSummary }, "Resumen (select + lean):");
  return state;
};

const runPopulateDemo = async (state: DemoState): Promise<DemoState> => {
  console.info("\n--- POPULATE ---");
  const billWithOrg = await findUserWithOrganization("Bill");
  console.info({ billWithOrg }, "Usuario con organización:");
  return state;
};

const runAggregationDemo = async (state: DemoState): Promise<DemoState> => {
  console.info("\n--- AGGREGATION PIPELINE ---");
  const stats = await aggregateUsersByOrganization();
  console.info({ stats }, "Estadísticas de usuarios por organización:");
  return state;
};

const main = async (): Promise<void> => {
  try {
    await connectDatabase();
    console.info("Conectado a MongoDB");

    // Cada paso se llama directamente con `await`, encadenando el
    // estado a mano: mismo resultado que una composición genérica,
    // pero sin esconder el orden de ejecución detrás de una utilidad.
    let state = await cleanDatabase(initialState);
    state = await seedDatabase(state);
    state = await runCrudDemo(state);
    state = await runPopulateDemo(state);
    state = await runAggregationDemo(state);

    console.info(
      `\nResumen final: ${state.organizationsCount} organizaciones, ${state.usersCount} usuarios`,
    );
  } catch (error) {
    console.error(error, "Error en el ejemplo:");
  } finally {
    await disconnectDatabase();
    console.info("Desconectado de MongoDB");
  }
};

main();


