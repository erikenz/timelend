import type { Metadata } from "next";
import { Chatbot } from "../_components/chatbot";
import { Header } from "../_components/header";

const title = "Chatbot";
const description = "AI Chatbot.";

export const metadata: Metadata = {
  title,
  description,
};

const ChatbotPage = async () => {
  return (
    <>
      <Header page="AI Chatbot" pages={["Building Your Application"]} />
      <Chatbot />
    </>
  );
};

export default ChatbotPage;
