import { useQuery } from "@tanstack/react-query";
import { Button } from "./components/ui/button";
import { db } from "./db";

function App() {
  const { data } = useQuery({
    queryKey: [],
    queryFn: async () => {
      return await db.query.transactions.findMany({
        with: {
          account: true,
        },
      });
    },
  });

  console.log("data", data);

  return (
    <div>
      <Button className="p-4 pt-2">Hello</Button>
    </div>
  );
}

export default App;
