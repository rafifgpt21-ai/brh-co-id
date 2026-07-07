import { GoogleGenAI } from "@google/genai";

const DEFAULT_LLM_MODEL = "gemini-2.5-flash";
const DEFAULT_EMBEDDING_MODEL = "gemini-embedding-001";

let client: GoogleGenAI | null = null;

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  if (!client) {
    client = new GoogleGenAI({ apiKey });
  }

  return client;
}

export function getGeminiModelConfig() {
  return {
    llmModel: process.env.GEMINI_LLM_MODEL || DEFAULT_LLM_MODEL,
    embeddingModel: process.env.GEMINI_EMBEDDING_MODEL || DEFAULT_EMBEDDING_MODEL,
  };
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRetryDelayMs(error: unknown) {
  if (typeof error === "object" && error !== null && "status" in error) {
    const status = (error as { status?: number }).status;
    if (status === 429) {
      return 8_000;
    }
    if (status === 503) {
      return 2_500;
    }
  }

  return 0;
}

export async function createEmbeddings(texts: string[]) {
  if (!texts.length) {
    return [];
  }

  const { embeddingModel } = getGeminiModelConfig();
  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await getGeminiClient().models.embedContent({
        model: embeddingModel,
        contents: texts,
      });

      const embeddings = response.embeddings?.map((embedding) => embedding.values || []) || [];
      if (embeddings.length !== texts.length || embeddings.some((embedding) => !embedding.length)) {
        throw new Error("Gemini did not return embeddings for every input");
      }

      return embeddings;
    } catch (error) {
      lastError = error;
      const retryDelayMs = getRetryDelayMs(error);
      if (!retryDelayMs || attempt === 2) {
        break;
      }
      await wait(retryDelayMs);
    }
  }

  throw lastError;
}

export async function createEmbedding(text: string) {
  const [embedding] = await createEmbeddings([text]);
  return embedding;
}

export async function generateGroundedAnswer(params: {
  question: string;
  context: string;
  includeReferences?: boolean;
  history?: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
}) {
  const { llmModel } = getGeminiModelConfig();
  const referenceInstruction = params.includeReferences
    ? [
        "Pengguna meminta link, sumber, atau referensi.",
        "Jangan tulis URL mentah atau markdown link dalam jawaban.",
        "Sebutkan secara natural bahwa referensi tersedia di kartu sumber di bawah jawaban.",
      ]
    : [
        "Pengguna tidak meminta link, sumber, atau referensi.",
        "Jangan menyebut kartu sumber, tautan, link, referensi, atau sumber di dalam jawaban.",
        "Jawab langsung dan ringkas berdasarkan konteks.",
      ];
  const historyText = params.history?.length
    ? params.history
        .map((message) => `${message.role === "user" ? "Pengguna" : "Asisten"}: ${message.content}`)
        .join("\n")
    : "Tidak ada riwayat percakapan sebelumnya.";

  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await getGeminiClient().models.generateContent({
        model: llmModel,
        contents: [
          {
            role: "user",
            parts: [
              {
                text: [
                  "Anda adalah chatbot resmi BRH Insight.",
                  "Jawab hanya berdasarkan konteks yang diberikan.",
                  "Jika konteks tidak cukup, katakan bahwa informasi tersebut belum tersedia di website BRH.",
                  "Jangan mengarang detail, tanggal, kutipan, atau sumber.",
                  "Jawab dengan bahasa yang sama dengan pertanyaan pengguna.",
                  "Gunakan riwayat percakapan hanya untuk memahami maksud pertanyaan lanjutan.",
                  "Jangan tulis URL mentah atau markdown link dalam jawaban.",
                  ...referenceInstruction,
                  "Buat jawaban ringkas dan jelas.",
                  "",
                  `Riwayat percakapan:\n${historyText}`,
                  "",
                  `Konteks:\n${params.context}`,
                  "",
                  `Pertanyaan:\n${params.question}`,
                ].join("\n"),
              },
            ],
          },
        ],
      });

      return response.text?.trim() || "Maaf, saya belum bisa membuat jawaban untuk pertanyaan itu.";
    } catch (error) {
      lastError = error;
      const retryDelayMs = getRetryDelayMs(error);
      if (!retryDelayMs || attempt === 2) {
        break;
      }
      await wait(retryDelayMs);
    }
  }

  throw lastError;
}
