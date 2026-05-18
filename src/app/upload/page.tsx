/**
 * Dedicated upload page — redirect to dashboard after save.
 * See: docs/ARCHITECTURE.md §8
 */

'use client';

import { useRouter } from 'next/navigation';
import { UploadPanel } from '@/components/file-upload/UploadPanel';

export default function UploadPage() {
  const router = useRouter();

  return (
    <UploadPanel
      showPrivacyBanner={false}
      showBackLink
      afterSave={() => router.push('/')}
    />
  );
}
