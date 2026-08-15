import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const clientDirectory = path.resolve(currentDirectory, "../../firebox-ai/dist/public");
if (process.env.NODE_ENV === "production") {
  app.use(express.static(clientDirectory));
  app.get("/{*path}", (_req, res) => {
    res.sendFile(path.join(clientDirectory, "index.html"));
  });
}
export default app;
