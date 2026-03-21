import { database } from "@repo/database";
import type { Metadata } from "next";
import { Header } from "@/app/(authenticated)/components/header";

const title = "Acme Inc";
const description = "My application.";

export const metadata: Metadata = {
  title,
  description,
};

const App = async () => {
  // const session = await auth.api.getSession({
  //   headers: await headers(), // from next/headers
  // });
  // if (!session?.user) {
  //   return redirect("/auth/sign-in"); // from next/navigation
  // }
  const commitments = await database.commitment.findMany();

  return (
    <>
      <Header page="Data Fetching" pages={["Building Your Application"]} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          {commitments.map((commitments) => (
            <div
              className="aspect-video rounded-xl bg-muted/50"
              key={commitments.id}
            >
              {commitments.name}
            </div>
          ))}
        </div>
        <div className="min-h-screen flex-1 rounded-xl bg-muted/50 md:min-h-min" />
      </div>
    </>
  );
};

export default App;
