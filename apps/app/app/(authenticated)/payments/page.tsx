import { auth } from "@repo/auth/server";
import { database } from "@repo/database";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Header } from "../components/header";

const PaymentsPage = async () => {
  const payments = await database.payment.findMany({
    where: {
      paidAt: {
        equals: "true",
      },
    },
  });

  const session = await auth.api.getSession({
    headers: await headers(), // from next/headers
  });
  if (!session?.user) {
    return redirect("/sign-in"); // from next/navigation
  }

  return (
    <>
      <Header page="Search" pages={["Building Your Application"]} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          {payments.map((payment) => (
            <div
              className="aspect-video rounded-xl bg-muted/50"
              key={payment.id}
            >
              {payment.amount}
            </div>
          ))}
        </div>
        <div className="min-h-screen flex-1 rounded-xl bg-muted/50 md:min-h-min" />
      </div>
    </>
  );
};

export default PaymentsPage;
