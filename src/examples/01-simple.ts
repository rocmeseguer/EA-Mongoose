/**
 * ============================================================
 * EJEMPLO 1 — VERSIÓN SENZILLA (async/await básico)
 * ============================================================
 * Pensado para quien empieza: una única función async, de arriba
 * a abajo, con UN solo try/catch/finally para todo el programa.
 * Sin composición de funciones ni abstracciones extra: el
 * objetivo es ver de un vistazo el ciclo de vida completo
 * (conectar -> preparar datos -> operar -> desconectar).
 *
 * Ejecutar:  npm run example:simple
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

const main = async (): Promise<void> => {
  try {
    // 1. CONEXIÓN
    await connectDatabase();
    console.info("Conectado a MongoDB");

    // 2. LIMPIEZA (idempotencia): el demo se puede volver a
    // ejecutar tantas veces como queramos y siempre parte del
    // mismo estado inicial.
    await deleteAllUsers();
    await deleteAllOrganizations();
    console.info("Base de datos limpiada");

    // 3. SEED: las organizaciones se crean primero porque los
    // usuarios necesitan su _id real para referenciarlas.
    const organizations = await seedOrganizations(organizationsSeed);
    console.info("Organizaciones insertadas: %d", organizations.length);
    const users = await seedUsers(usersSeed);
    console.info("Us uarios insertados: %d", users.length);

    // 4. CRUD
    console.info("\n--- CRUD ---");

    const bill = await findUserByName("Bill");
    console.info({ bill }, "Usuario encontrado:");

    // select() + lean(): solo los campos que nos interesan, como
    // objeto plano (más ligero que un Documento de Mongoose).
    const billSummary = await findUserSummaryByName("Bill");
    console.info({ billSummary }, "Resumen (select + lean):");

    // 5. POPULATE: sustituye el id de la organización por sus datos
    console.info("\n--- POPULATE ---");
    const billWithOrg = await findUserWithOrganization("Bill");
    console.info({ billWithOrg }, "Usuario con organización:");

    // 6. AGGREGATION PIPELINE
    console.info("\n--- AGGREGATION PIPELINE ---");
    const stats = await aggregateUsersByOrganization();
    console.info({ stats }, "Estadísticas de usuarios por organización:");

  } catch (error) {
    // Cualquier error de cualquiera de los pasos anteriores acaba
    // aquí: una única puerta de salida para los fallos.
    console.error(error, "Error en el ejemplo:");
    
  } finally {
    // finally se ejecuta SIEMPRE, haya habido error o no: es el
    // lugar correcto para liberar recursos como la conexión a BD.
    await disconnectDatabase();
    console.info("Desconectado de MongoDB");
  }
};

main();
