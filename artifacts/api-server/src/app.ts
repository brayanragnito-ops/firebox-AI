import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path";
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

// Serve static files from firebox-ai dist/public
const distPath = path.join(__dirname, "../../firebox-ai/dist/public");
app.use(express.static(distPath));

// SPA fallback: serve index.html for any non-API routes
app.use((req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

export default app;
