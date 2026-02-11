import express from "express";
import { Router } from "express";
import ragService from "../services/rag.service.js";

const router = Router();

// GET/api/health
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "RAG service is Running",
    timeStamp: new Date().toISOString().split('T'),
  });
});

// POST /api/documents/upload
router.post("/documents/upload", async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: "Title and content are required",
      });
    }

    if (content.length < 10) {
      return res.status(400).json({
        success: false,
        error: "Conten is too short (minimum 10 character)",
      });
    }

    const result = await ragService.uploadDocument(title, content);

    res.status(200).json({
      success: true,
      documentId: result.documentId,
      chunksCreated: result.chunksCreated,
      message: "Documents uploaded Successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// POST /api/query
router.post("/query", async (req, res) => {
  try {
    const { question, topK = 5, similarityThreshold = 0.5 } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        error: "Question is required",
      });
    }

    const result = await ragService.query(question, topK, similarityThreshold);

    res.json({
      success: true,
      answer: result.answer,
      sources: result.sources,
      retrievedChunks: result.sources.length,
    });
  } catch (error) {
    console.error("Query error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /api/documents
router.get("/documents", async (req, res) => {
  try {
    const documents = await ragService.getAllDocs();

    res.json({
      success: true,
      documents,
      count: documents.length,
    });
  } catch (error) {
    console.error("Fetch documents error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /api/documents/:id

router.get("/documents/:id", async (req, res) => {
  try {
    const documnetId = parseInt(req.params.id);

    if (isNaN(documnetId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid doucment ID",
      });
    }

    const document = await ragService.getDocs(documnetId);

    res.json({
      success: true,
      document,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// DELETE /api/documents/:id
router.delete("/documents/:id", async (req, res) => {
  try {
    const documentId = parseInt(req.params.id);

    if (isNaN(documentId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid document ID",
      });
    }

    await ragService.deleteDocument(documentId);

    res.json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
