import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("DUMMY_KEY");

const model = genAI.getGenerativeModel({ 
  model: "gemini-2.5-flash",
  systemInstruction: "test" 
});

async function run() {
  try {
    await model.generateContent("hello");
  } catch(err) {
    console.error("ERROR CAUGHT:");
    console.error(err);
  }
}
run();
