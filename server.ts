import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Server-side AI explanation endpoint using Gemini 3.1 Pro Preview with high thinking
  app.post("/api/ai-explain", async (req, res) => {
    try {
      const { formulaTitle, formulaLatex, class10Concept, userQuery, numericValues } = req.body;

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(200).json({
          success: true,
          isOfflineFallback: true,
          explanation: `### Class-10 Mathematical Breakdown: ${formulaTitle || "Mathematical Concept"}

#### 1. Core Formula
$$\\large ${formulaLatex || "y = mx + c"}$$

#### 2. Class-10 Curriculum Connection
- **Topic Reference**: ${class10Concept || "Coordinate Geometry & Linear Relations"}
- **Mathematical Principle**: In Class-10, we learn that geometry and algebra are two representations of the exact same phenomenon. When an Artificial Intelligence classifies images or makes predictions, it uses these exact algebraic relations.

#### 3. Numerical Calculation
${numericValues ? `With current parameters: ${JSON.stringify(numericValues)}` : "Every pixel or data feature corresponds to a variable, transforming multi-dimensional questions into basic arithmetic."}

#### 4. Artificial Intelligence Bridge
- Modern neural networks evaluate billions of these equations every second.
- The fundamental unit of AI (the artificial neuron) is simply: **Dot Product $\\to$ Add Bias $\\to$ Activation Function**.
*(Note: To unlock live Gemini 3.1 Pro high-thinking pedagogical derivations, configure your GEMINI_API_KEY in the Settings panel.)*`,
        });
      }

      // Initialize Google GenAI with recommended user-agent
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const prompt = `You are a Chief Mathematics Educator and AI Research Scientist presenting to Class-10 National Math Festival Judges, Teachers, and Students.
Explain the mathematical formula "${formulaTitle}" (${formulaLatex}) with high-level pedagogical clarity, strictly connecting it to standard Class-10 Mathematics curriculum (e.g. Coordinate Geometry, Linear Equations in Two Variables, Statistics & Probability, Matrices/Vectors).

Context & Parameters:
- Formula: ${formulaLatex}
- Class-10 Topic: ${class10Concept}
- Current Interactive Values: ${JSON.stringify(numericValues || {})}
- Specific Student / Judge Question: ${userQuery || "How does this Class-10 formula power modern Artificial Intelligence?"}

Please provide:
1. **Mathematical Derivation & Intuition**: Explain the formula clearly for a 10th-grade student using geometric and algebraic intuition.
2. **Step-by-Step Calculation**: Show how the numbers are plugged in and computed with clear arithmetic.
3. **The Artificial Intelligence Connection**: How does a real AI model (like ChatGPT, computer vision, or self-driving cars) use this exact mathematical step?
4. **Interactive Thought Experiment / Challenge**: A question for the festival judge or student to test in the simulator.

Keep the formatting clean with Markdown and standard LaTeX ($...$ and $$...$$). Be rigorous, inspiring, and accessible.`;

      // Use gemini-3.1-pro-preview with ThinkingLevel.HIGH as mandated for complex reasoning
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: {
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.HIGH,
          },
          systemInstruction:
            "You are an inspiring, authoritative Mathematics Educator and Data Scientist specializing in secondary school mathematics and artificial intelligence foundations. Produce crystal-clear mathematical explanations with elegant LaTeX.",
        },
      });

      const explanationText = response.text || "No explanation generated.";
      return res.json({
        success: true,
        isOfflineFallback: false,
        explanation: explanationText,
      });
    } catch (error: any) {
      console.error("Error generating AI explanation:", error);
      // Fallback gracefully so the UI never breaks
      return res.status(200).json({
        success: true,
        isOfflineFallback: true,
        error: error.message,
        explanation: `### Class-10 Mathematical Insight: ${req.body.formulaTitle || "Formula Insight"}

$$\\large ${req.body.formulaLatex || ""}$$

**Mathematical Principle:**
In Class-10 mathematics, we study how pairs of linear equations, coordinate distances, and probability ratios describe spatial relationships. In modern Machine Learning, algorithms like Perceptrons, K-Nearest Neighbors, and Matrix Matchers use these exact principles to classify data, recognize handwritten digits, and make real-time decisions!`,
      });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Festival Math App server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
