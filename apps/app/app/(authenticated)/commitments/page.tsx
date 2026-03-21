import { database } from "@repo/database";
import { Header } from "../_components/header";

const PaymentsPage = async () => {
  const commitments = await database.commitment.findMany({});

  return (
    <>
      <Header page="Search" pages={["Building Your Application"]} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          {commitments.length > 0 ? (
            commitments.map((commitment) => (
              <div
                className="aspect-video rounded-xl bg-muted/50"
                key={commitment.id}
              >
                {commitment.name}
              </div>
            ))
          ) : (
            <div className="text-muted-foreground">No commitments found.</div>
          )}
        </div>
        <div className="min-h-screen flex-1 rounded-xl bg-muted/50 md:min-h-min" />
      </div>
    </>
  );
};

export default PaymentsPage;
