/**
 * ============================================================
 * EJEMPLO 2 — VERSIÓN CON PROMESAS (.then / .catch / .finally)
 * ============================================================
 * Mismo demo que el ejemplo 1, pero encadenando Promesas de forma
 * explícita, SIN usar la palabra clave async/await. Sirve para
 * entender qué esconde realmente el "azúcar sintáctico" de
 * async/await: cada `await` no es más que un `.then()`.
 *
 * Ejecutar:  npm run example:promises
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
import { organizationsSeed, usersSeed } from "./seed-data.js";

connectDatabase()
  .then(() => {
    console.info("Conectado a MongoDB");
    // Promise.all: las dos limpiezas no dependen la una de la
    // otra, así que se lanzan en paralelo en vez de esperarlas
    // una detrás de otra.
    return Promise.all([deleteAllUsers(), deleteAllOrganizations()]);
  })
  .then(async () => {
    console.info("Base de datos limpiada");

    const organizations = await seedOrganizations(organizationsSeed);
    console.info("Organizaciones insertadas: %d", organizations.length);
    const users = await seedUsers(usersSeed);
    console.info("Us uarios insertados: %d", users.length);
  })
  .then(() => {
    console.info("\n--- CRUD ---");
    
    return findUserByName("Bill");
  })
  .then((bill) => {
    console.info({ bill }, "Usuario encontrado:");
    
    return findUserSummaryByName("Bill");
  })
  .then((billSummary) => {
    console.info({ billSummary }, "Resumen (select + lean):");

    console.info("\n--- POPULATE ---");
    return findUserWithOrganization("Bill");
  })
  .then((billWithOrg) => {
    console.info({ billWithOrg }, "Usuario con organización:");

    console.info("\n--- AGGREGATION PIPELINE ---");
    return aggregateUsersByOrganization();
  })
  .then((stats) => {
    console.info({ stats }, "Estadísticas de usuarios por organización:");
  })
  .catch((error) => {
    // .catch() atrapa cualquier rechazo ocurrido en CUALQUIER
    // eslabón anterior de la cadena: es el equivalente al catch
    // de un try/catch, pero para Promesas encadenadas.
    console.error("Error en el ejemplo:", error);
  })
  .finally(() => {
    // .finally() se ejecuta siempre, tanto si la cadena terminó
    // en .then como en .catch.
    void disconnectDatabase().then(() => console.info("Desconectado de MongoDB"));
  });

  
