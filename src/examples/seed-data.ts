import { Types } from "mongoose";
import type { IOrganizationWithId } from "../models/organization.model.js";
import type { UserSchemaType } from "../models/user.model.js";

// ============================================================
// DATOS DE PRUEBA (seed)
// ============================================================
// Datos puros, sin lógica: se comparten entre los 3 ejemplos
// para que la única diferencia real entre ellos sea el ESTILO
// asíncrono usado (async/await simple, Promesas encadenadas o
// async/await + composición), no los datos ni las operaciones.
// ============================================================

export const organizationsSeed: IOrganizationWithId[] = [
  {
    name: "Initech",
    country: "USA",
    _id: new Types.ObjectId(),
  },
  {
    name: "Umbrella Corp",
    country: "UK",
    _id: new Types.ObjectId(),
  },
];

export const usersSeed: UserSchemaType[] = [
  {
    name: "Bill",
    email: "bill@initech.com",
    role: "ADMIN" as const,
    organization: organizationsSeed[0]._id,
  },

  {
    name: "Peter",
    email: "peter@initech.com",
    role: "USER" as const,
    organization: organizationsSeed[1]._id,
  },
  {
    name: "Alice",
    email: "alice@umbrella.com",
    role: "EDITOR" as const,
    organization: organizationsSeed[1]._id,
  },
];
