import { database } from "@repo/database";
import type { Metadata } from "next";
import { Header } from "@/app/(authenticated)/_components/header";
import { getSession } from "@/server/better-auth/server";
import { api, HydrateClient } from "@/trpc/server";

const title = "Acme Inc";
const description = "My application.";

export const metadata: Metadata = {
  title,
  description,
};

const App = async () => {
  const hello = await api.post.hello({ text: "from tRPC" });
  const session = await getSession();

  if (session) {
    api.post.getLatest.prefetch();
  }
  const commitments = await database.commitment.findMany();

  return (
    <HydrateClient>
      <Header page="Data Fetching" pages={["Building Your Application"]} />

      <p className="text-2xl text-white">
        {hello ? hello.greeting : "Loading tRPC query..."}
      </p>
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
    </HydrateClient>
  );
};

export default App;
