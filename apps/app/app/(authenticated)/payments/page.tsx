import { database } from "@repo/database";
import { Header } from "../_components/header";

const PaymentsPage = async () => {
  const payments = await database.payment.findMany();

  return (
    <>
      <Header page="Search" pages={["Building Your Application"]} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          {payments.length > 0 ? (
            payments.map((payment) => (
              <div
                className="aspect-video rounded-xl bg-muted/50"
                key={payment.id}
              >
                {payment.amount}
              </div>
            ))
          ) : (
            <div className="text-muted-foreground">No payments found.</div>
          )}
        </div>
        <div className="min-h-screen flex-1 rounded-xl bg-muted/50 md:min-h-min" />
      </div>
    </>
  );
};

export default PaymentsPage;
