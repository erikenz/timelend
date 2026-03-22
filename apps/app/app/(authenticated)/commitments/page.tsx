import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import Link from "next/link";
import { api } from "@/trpc/server";
import { Header } from "../_components/header";

function getStatusBadge(status: { completed: boolean; paid: boolean }) {
  if (status.paid) {
    return <Badge variant="secondary">Completed</Badge>;
  }
  if (status.completed) {
    return <Badge variant="default">Success</Badge>;
  }
  return <Badge variant="outline">In Progress</Badge>;
}

export default async function CommitmentsPage() {
  const commitments = await api.commitments.getAll();

  return (
    <>
      <Header page="Commitments" pages={["Dashboard"]} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-2xl">Your Commitments</h2>
          <Button asChild>
            <Link href="/commitments/create">Create New</Link>
          </Button>
        </div>

        {commitments.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {commitments.map((commitment) => (
              <Card key={commitment.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{commitment.name}</CardTitle>
                    {getStatusBadge(commitment)}
                  </div>
                  <CardDescription>{commitment.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Start:</span>
                      <span>{commitment.startDate.toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">End:</span>
                      <span>{commitment.endDate.toLocaleDateString()}</span>
                    </div>
                    {commitment.onChainCommitmentId && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          On-chain ID:
                        </span>
                        <span className="font-mono text-xs">
                          {commitment.onChainCommitmentId}
                        </span>
                      </div>
                    )}
                  </div>
                  <Button asChild className="mt-4 w-full">
                    <Link href={`/commitments/${commitment.id}`}>
                      View Details
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">No commitments found.</p>
              <Button asChild className="mt-4">
                <Link href="/commitments/create">
                  Create Your First Commitment
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
