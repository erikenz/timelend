import type { CommitmentModel } from "@repo/database/generated";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { Label } from "@repo/design-system/components/ui/label";

interface DetailsCardProps {
  commitment: Pick<CommitmentModel, "description" | "endDate" | "startDate">;
}

export function DetailsCard({ commitment }: DetailsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-muted-foreground">Description</Label>
          <p className="mt-1">{commitment.description}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-muted-foreground">Start Date</Label>
            <p className="mt-1">{commitment.startDate.toLocaleDateString()}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">End Date</Label>
            <p className="mt-1">{commitment.endDate.toLocaleDateString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
