import { Container } from "@/components/shared/container";
import { LoadingState } from "@/components/shared/loading-state";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <Container className="space-y-8 py-16">
      <div className="space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-64" />
      </div>
      <LoadingState rows={4} label="Loading page" />
    </Container>
  );
}
