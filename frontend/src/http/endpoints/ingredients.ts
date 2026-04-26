import { httpClient } from '../client'
import type { Ingredient } from '@/typescript/interface/Ingredient'
import type { PaginatedResponse, ApiResponse } from '@/typescript/interface/ApiResponse'

export const ingredientsApi = {
  getAll: (params?: any) =>
    httpClient.get<PaginatedResponse<Ingredient>>('/ingredients', { params }),

  getById: (id: string) => httpClient.get<ApiResponse<Ingredient>>(`/ingredients/${id}`),

  create: (data: Partial<Ingredient>) =>
    httpClient.post<ApiResponse<Ingredient>>('/ingredients', data),

  update: (id: string, data: Partial<Ingredient>) =>
    httpClient.put<ApiResponse<Ingredient>>(`/ingredients/${id}`, data),

  delete: (id: string) => httpClient.delete<ApiResponse<void>>(`/ingredients/${id}`),

  getNames: () => httpClient.get<ApiResponse<string[]>>('/posts/ingredients'),
}
