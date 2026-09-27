import { Aggregate, Types } from "mongoose";
import {
  UserModel,
  UserSchemaType,
  UserSummary,
  UserWithOrganization,
} from "../models/user.model.js";
import { IOrganization } from "../models/organization.model.js";

// ============================================================
// SERVICE de "User"
// ============================================================
// Igual que el de Organization: funciones pequeñas, sin estado
// propio, que envuelven las llamadas a Mongoose. Aquí viven
// también las demos de POPULATE (equivalente a un JOIN) y de
// AGGREGATION PIPELINE.
//
// Es la capa que un futuro controller de API llamaría directamente
// (p.ej. GET /users/:name -> findUserByName), manteniendo el acceso
// a datos separado del transporte HTTP (routes/controllers).
//
// Tipado estricto: los retornos usan los tipos derivados del Schema
// (`UserSchemaType`, `UserDocument`) en vez de dejar que TypeScript
// infiera la firma a partir de la llamada a Mongoose. Dos casos
// merecen mención aparte:
//   - `findUserSummaryByName`: usa `.select()` + `.lean()`, así que
//     su tipo de retorno es un SUBCONJUNTO explícito de campos, no
//     el documento completo.
//   - `findUserWithOrganization`: usa `.populate()`. Por defecto
//     Mongoose seguiría tipando `organization` como `ObjectId` (el
//     tipo declarado en el Schema), aunque en tiempo de ejecución
//     ya contenga el documento completo. Hay que decírselo a
//     TypeScript explícitamente con el genérico de `.populate<>()`.
// ============================================================

// --- CRUD básico ---
export const findUserById = async (id: Types.ObjectId | string): Promise<UserSchemaType | null> => {
  return await UserModel.findById(id).lean();
};

export const findUserByName = async (name: string): Promise<UserSchemaType | null> => {
  return await UserModel.findOne({ name }).lean();
};

export const createUser = async (data: UserSchemaType): Promise<UserSchemaType | null> => {
  return await new UserModel(data).save();
};

export const updateUser = async (
  id: string,
  data: Partial<UserSchemaType>,
): Promise<UserSchemaType | null> => {
  return await UserModel.findByIdAndUpdate(id, data, { new: true }).lean();
};

export const deleteUserById = async (id: string): Promise<UserSchemaType | null> => {
  return await UserModel.findByIdAndDelete(id);
};

export const listAllUsers = async (): Promise<UserSchemaType[]> => {
  return await UserModel.find().lean();
};

// select(): pedimos solo los campos que nos interesan.
// lean(): devuelve un objeto JS plano en vez de un Documento de
// Mongoose. Es preferible cuando solo vamos a LEER datos, porque
// nos ahorramos el coste de construir un documento completo con
// todos sus métodos (.save(), getters, etc.).

export const findUserSummaryByName = async (name: string): Promise<UserSummary | null> =>
  UserModel.findOne({ name }).select("name email").lean();

// --- POPULATE ---
// populate('organization') sustituye el ObjectId guardado en el
// campo "organization" por el documento completo al que apunta.
// Es el equivalente en Mongoose a un JOIN en SQL.

export const findUserWithOrganization = async (
  name: string,
): Promise<UserWithOrganization | null> =>
  UserModel.findOne({ name }).populate<{ organization: IOrganization }>("organization").lean();

// --- AGGREGATION PIPELINE ---
// Igual que populate, pero a nivel de agregación: $lookup es el
// "JOIN" del pipeline. Aquí, además, agrupamos y contamos. El
// genérico de `.aggregate<>()` tipa la forma final que produce el
// $project: sin él, el resultado sería `any[]`.
interface OrganizationUserStats {
  readonly organizationName: string;
  readonly totalUsers: number;
}

export const aggregateUsersByOrganization = (): Aggregate<OrganizationUserStats[]> =>
  UserModel.aggregate<OrganizationUserStats>([
    // 1. Filtramos: nos quedamos solo con roles "reales".
    { $match: { role: { $ne: "GUEST" } } },
    // 2. Agrupamos por organización y contamos usuarios.
    { $group: { _id: "$organization", totalUsers: { $sum: 1 } } },
    // 3. $lookup = el JOIN del mundo de las agregaciones.
    {
      $lookup: {
        from: "organizations", // nombre real de la colección en Mongo
        localField: "_id",
        foreignField: "_id",
        as: "orgInfo",
      },
    },
    // 4. Proyectamos solo lo que queremos mostrar.
    {
      $project: {
        _id: 0,
        organizationName: { $arrayElemAt: ["$orgInfo.name", 0] },
        totalUsers: 1,
      },
    },
  ]);

// --- SEED / DELETE ---

export const seedUsers = async (users: ReadonlyArray<UserSchemaType>): Promise<UserSchemaType[]> =>
  UserModel.insertMany(users);

export const deleteAllUsers = async (): Promise<number> => {
  const { deletedCount } = await UserModel.deleteMany({});
  return deletedCount ?? 0;
};
