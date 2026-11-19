import { http } from './http';
import type { DatabaseSchema } from '../types/api';

export const schemaService = {
  get: () => http.get<DatabaseSchema>('/api/v1/schema'),
};
