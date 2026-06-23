import { httpClient } from '../client'
import type { ApiResponse } from '@/typescript/interface/ApiResponse'

interface CreateReportData {
  type: 'POST' | 'COMMENT' | 'USER'
  reason: 'SPAM' | 'HARASSMENT' | 'INAPPROPRIATE_CONTENT' | 'MISINFORMATION' | 'COPYRIGHT' | 'OTHER'
  description?: string
  postId?: string
  commentId?: string
  reportedUserId?: string
}

export const reportsApi = {
  createReport: (data: CreateReportData) =>
    httpClient.post<ApiResponse<any>>('/reports', data),

  getMyReports: (params: { page?: number; limit?: number }) =>
    httpClient.get<ApiResponse<any[]>>('/reports/my-reports', { params }),
}
