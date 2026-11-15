// Reporting a build or comment (TanStack Query over src/lib/firebase/reports).
import { useMutation } from '@tanstack/react-query';
import { reportContent, type ReportTarget } from '@/lib/firebase';
import type { ReportReason } from '@/lib/models';

export function useReport(target: ReportTarget, reporterId: string | null) {
  return useMutation({
    mutationFn: ({ reason, note }: { reason: ReportReason; note: string }) => {
      if (!reporterId) throw new Error('Log in to report.');
      return reportContent(reporterId, target, reason, note);
    },
  });
}
