import { Suspense } from "react";
import { ApplicationPage } from "@/components/rec-chair/application/ApplicationPage";
import { Skeleton } from "@/components/ui/skeleton";

interface PageParams {
  params: {
    id: string;
  };
}

// This is a Server Component - no need for 'use client'
export default async function ApplicationDetailsPage({ params }: PageParams) {
  // Await the params to satisfy Next.js App Router requirements
  const id = await Promise.resolve(params.id);
  
  return (
    <>
      <Suspense fallback={<LoadingSkeleton />}>
        <ApplicationPage applicationId={id} />
      </Suspense>
    </>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
      <Skeleton className="h-[200px] w-full" />
      <Skeleton className="h-[300px] w-full" />
      <Skeleton className="h-[200px] w-full" />
    </div>
  );
}
