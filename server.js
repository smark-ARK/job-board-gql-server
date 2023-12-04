import cors from "cors";
import express from "express";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware as apolloMiddleware } from "@apollo/server/express4";
import { authMiddleware, handleLogin } from "./auth.js";
import { readFile } from "fs/promises";
import { resolvers } from "./resolvers.js";
import { getUser } from "./db/users.js";
import { createCompanyLoader } from "./db/companies.js";

const PORT = 9000;

const app = express();
app.use(cors(), express.json(), authMiddleware);

async function getContext({ req }) {
  const companyLoader = await createCompanyLoader();
  const context = { companyLoader };
  if (req.auth) {
    const user = await getUser(req.auth.sub);
    context.user = user;
  }

  return context;
}

app.get("/", (req, res) =>
  res.status(200).json({
    message: "Hello World!",
  })
);
app.post("/login", handleLogin);

const typeDefs = await readFile("./schemas.graphql", "utf-8");
const apolloServer = new ApolloServer({ typeDefs, resolvers });
await apolloServer.start();

app.use(
  "/graphql",
  apolloMiddleware(apolloServer, {
    context: getContext,
  })
);
app.listen({ port: PORT }, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`GraphQl Endpoint: http://localhost:${PORT}/graphql`);
});
