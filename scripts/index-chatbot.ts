import { indexAllKnowledge } from "@/lib/chatbot/indexing";

async function main() {
  console.log("Indexing chatbot knowledge...");
  const result = await indexAllKnowledge();
  console.log(`Indexed ${result.chunks} chunks from ${result.sources} sources.`);
}

main().catch((error) => {
  console.error("Failed to index chatbot knowledge:", error);
  process.exit(1);
});
