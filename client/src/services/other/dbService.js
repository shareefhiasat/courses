import attendanceDbService from '../db/attendanceDbService-postgres.js';

export const dbService = {
  findMany: async (model, params) => {
    const result = await attendanceDbService.getAll(params?.where ? params : params || {});
    return { success: result.success, data: result.data || [] };
  },
  findUnique: async (model, id) => {
    const result = await attendanceDbService.getById(id);
    return { success: result.success, data: result.data };
  },
  create: async (model, data, user) => {
    const result = await attendanceDbService.create(data);
    return { success: result.success, data: result.data };
  },
  update: async (model, id, data, user) => {
    const result = await attendanceDbService.update(id, data);
    return { success: result.success, data: result.data };
  },
  delete: async (model, id) => {
    const result = await attendanceDbService.delete(id);
    return { success: result.success, data: result.data };
  },
};

export default dbService;
