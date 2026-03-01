import React, { useState } from "react";
import ChatbotButton from "./ChatbotButton";
import ChatbotModal from "./ChatbotModal";

const Chatbot = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  return (
    <>
      <ChatbotButton onClick={toggleModal} />
      {isModalOpen && <ChatbotModal onClose={() => setIsModalOpen(false)} />}
    </>
  );
};

export default Chatbot;
