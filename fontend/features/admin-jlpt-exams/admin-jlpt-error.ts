import axios from 'axios';
import { z } from 'zod';
import { getApiError, type ApiError } from '@/lib/api-error';
import type { AdminJlptValidationIssue } from '@/apis/admin-jlpt-exams/admin-jlpt-exams.type';

const issueSchema = z.object({
  code: z.string(),
  message: z.string(),
  path: z.string(),
  category: z.enum(['CONTENT', 'LIFECYCLE']),
  resourceIds: z.object({
    examId: z.number().optional(),
    sessionId: z.number().optional(),
    partId: z.number().optional(),
    questionId: z.number().optional(),
    answerId: z.number().optional(),
    mediaId: z.number().optional(),
  }),
});
const publishErrorSchema = z.object({ issues: z.array(issueSchema) });

/** Keep the original Axios rejection in hooks; use this adapter at the form/UI boundary. */
export function getAdminJlptError(
  error: unknown,
): ApiError & { issues: AdminJlptValidationIssue[] } {
  const parsed = publishErrorSchema.safeParse(
    axios.isAxiosError<unknown>(error) ? error.response?.data : error,
  );
  return { ...getApiError(error), issues: parsed.success ? parsed.data.issues : [] };
}
