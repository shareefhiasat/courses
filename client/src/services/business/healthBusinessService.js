/**
 * healthBusinessService - Stub
 */

const { info, error, warn, debug } = require('../utils/logger.js');

const serviceName = 'healthBusinessService';

const getAll = async (params = {}) => {
  return { success: true, data: [], total: 0 };
};

const getById = async (id) => {
  return { success: true, data: null };
};

const create = async (data, user = null) => {
  return { success: true, data: { id: Date.now(), ...data } };
};

const update = async (id, data, user = null) => {
  return { success: true, data: { id, ...data } };
};

const deleteHealth = async (id, user = null) => {
  return { success: true, message: 'Deleted successfully' };
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  deleteHealth
};
