/**
 * Participation Types Service - Business Logic Layer
 * 
 * PURPOSE: Business logic for participation type operations
 * ARCHITECTURE: Controllers → Business Services → DB Services → PostgreSQL
 */

import {
  getAllParticipationTypes as getAllParticipationTypesDB,
  getParticipationTypeById as getParticipationTypeByIdDB,
  createParticipationType as createParticipationTypeDB,
  updateParticipationType as updateParticipationTypeDB,
  deleteParticipationType as deleteParticipationTypeDB
} from '../db/participation-types-postgres.js';

export const getAllParticipationTypes = async (params = {}, user = null) => {
  return await getAllParticipationTypesDB(params, user);
};

export const getParticipationTypeById = async (id, user = null) => {
  return await getParticipationTypeByIdDB(id, user);
};

export const createParticipationType = async (participationTypeData, user = null) => {
  return await createParticipationTypeDB(participationTypeData, user);
};

export const updateParticipationType = async (id, updateData, user = null) => {
  return await updateParticipationTypeDB(id, updateData, user);
};

export const deleteParticipationType = async (id, user = null) => {
  return await deleteParticipationTypeDB(id, user);
};
