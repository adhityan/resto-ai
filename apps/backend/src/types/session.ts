import { Prisma } from "@repo/database";

export interface SessionFilters {
    status?: string[];
    applications?: string[];
    products?: string[];
    currencies?: string[];
    type?: string;
    range?: string;
    skip?: number;
    take?: number;
}

// TODO: Commented out - Session model doesn't exist in schema
// export type SessionWithRelations = Prisma.SessionGetPayload<{
//     include: {
//         price: {
//             include: {
//                 product: {
//                     include: {
//                         app: true;
//                     };
//                 };
//             };
//         };
//         customer: true;
//     };
// }>;
