import express from "express";
import cors from "cors";
import apiRouter from "./routes/api.routes.js";

const app = express();

app.use(express.json({ limit: "10mb" })); // allow larger payloads for documents
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || "http://localhost:5173",
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Routes
app.use("/api", apiRouter);

app.get("/", (req, res) => {
  // res.send("hey this is Rag");
  res.json({
    message: "Personal Documentation Assistance API",
    version: "1.0.0",
    endpoints: {
      upload: "POST /api/documents/upload",
      query: "POST /api/query",
      listDocuments: "GET /api/documents",
      getDocument: "GET /api/documents/:id",
      deleteDocument: "DELETE /api/documents/:id",
      health: "GET /api/health",
    },
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
  });
});

app.use((err,req,res,next)=>{
  console.error("Unhandled error:",err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
})

export default app;
