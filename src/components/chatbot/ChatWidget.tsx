import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { chatbotFlows, keywordFlowMap, Option } from './chatbotFlows';
import { ChatWindow } from './ChatWindow';
import { Message } from './MessageBubble';

const getCurrentTime = () => {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [nodeId, setNodeId] = useState<string>('home');
  const [historyStack, setHistoryStack] = useState<string[]>(['home']);
  const [isTyping, setIsTyping] = useState(false);

  // Initial welcome message
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: chatbotFlows.home.text,
      sender: 'bot',
      time: getCurrentTime(),
    },
  ]);

  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimized(false);
  };

  const handleOptionSelect = (option: Option) => {
    // 1. Add user message showing option selected
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      text: option.label,
      sender: 'user',
      time: getCurrentTime(),
    };

    const nextNodeId = option.nextId;
    const nextNode = chatbotFlows[nextNodeId] || chatbotFlows.home;

    setMessages((prev) => [...prev, userMsg]);
    setHistoryStack((prev) => [...prev, nextNodeId]);
    setNodeId(nextNodeId);

    // 2. Simulate typing indicator and bot response
    setIsTyping(true);

    // Insert a dummy message with isTyping true
    const typingId = `typing-${Date.now()}`;
    const typingMsg: Message = {
      id: typingId,
      text: '',
      sender: 'bot',
      time: getCurrentTime(),
      isTyping: true,
    };

    setMessages((prev) => [...prev, typingMsg]);

    setTimeout(() => {
      // Remove typing bubble and append actual response
      setMessages((prev) => {
        const filtered = prev.filter((msg) => msg.id !== typingId);
        return [
          ...filtered,
          {
            id: `bot-${Date.now()}`,
            text: nextNode.text,
            sender: 'bot',
            time: getCurrentTime(),
          },
        ];
      });
      setIsTyping(false);
    }, 750);
  };

  const handleBackSelect = () => {
    if (historyStack.length <= 1) return;

    // Pop the current node
    const newStack = [...historyStack];
    newStack.pop();
    const prevNodeId = newStack[newStack.length - 1];

    // Show user clicked back
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      text: 'Go Back ↩',
      sender: 'user',
      time: getCurrentTime(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setHistoryStack(newStack);
    setNodeId(prevNodeId);

    // Simulate typing for prev node
    setIsTyping(true);
    const typingId = `typing-${Date.now()}`;
    const typingMsg: Message = {
      id: typingId,
      text: '',
      sender: 'bot',
      time: getCurrentTime(),
      isTyping: true,
    };
    setMessages((prev) => [...prev, typingMsg]);

    setTimeout(() => {
      const prevNode = chatbotFlows[prevNodeId] || chatbotFlows.home;
      setMessages((prev) => {
        const filtered = prev.filter((msg) => msg.id !== typingId);
        return [
          ...filtered,
          {
            id: `bot-${Date.now()}`,
            text: prevNode.text,
            sender: 'bot',
            time: getCurrentTime(),
          },
        ];
      });
      setIsTyping(false);
    }, 500);
  };

  const handleHomeSelect = () => {
    if (nodeId === 'home') return;

    // Show user clicked Home
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      text: 'Back to Main Menu 🏠',
      sender: 'user',
      time: getCurrentTime(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setHistoryStack(['home']);
    setNodeId('home');

    // Simulate typing
    setIsTyping(true);
    const typingId = `typing-${Date.now()}`;
    const typingMsg: Message = {
      id: typingId,
      text: '',
      sender: 'bot',
      time: getCurrentTime(),
      isTyping: true,
    };
    setMessages((prev) => [...prev, typingMsg]);

    setTimeout(() => {
      setMessages((prev) => {
        const filtered = prev.filter((msg) => msg.id !== typingId);
        return [
          ...filtered,
          {
            id: `bot-${Date.now()}`,
            text: chatbotFlows.home.text,
            sender: 'bot',
            time: getCurrentTime(),
          },
        ];
      });
      setIsTyping(false);
    }, 600);
  };

  const handleSendMessage = (inputText: string) => {
    if (!inputText.trim()) return;

    // 1. Add user message
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      text: inputText,
      sender: 'user',
      time: getCurrentTime(),
    };
    setMessages((prev) => [...prev, userMsg]);

    // 2. Perform keyword matching
    const searchString = inputText.toLowerCase();
    let matchedNodeId = '';

    for (const match of keywordFlowMap) {
      if (match.keywords.some((keyword) => searchString.includes(keyword))) {
        matchedNodeId = match.nextId;
        break;
      }
    }

    // 3. Trigger typing simulation
    setIsTyping(true);
    const typingId = `typing-${Date.now()}`;
    const typingMsg: Message = {
      id: typingId,
      text: '',
      sender: 'bot',
      time: getCurrentTime(),
      isTyping: true,
    };
    setMessages((prev) => [...prev, typingMsg]);

    setTimeout(() => {
      if (matchedNodeId) {
        // Matched flow
        const targetNode = chatbotFlows[matchedNodeId];
        setHistoryStack((prev) => [...prev, matchedNodeId]);
        setNodeId(matchedNodeId);

        setMessages((prev) => {
          const filtered = prev.filter((msg) => msg.id !== typingId);
          return [
            ...filtered,
            {
              id: `bot-${Date.now()}`,
              text: `I detected you are asking about **${targetNode.id.split('_').join(' ').toUpperCase()}**.\n\n${targetNode.text}`,
              sender: 'bot',
              time: getCurrentTime(),
            },
          ];
        });
      } else {
        // Fallback message
        setMessages((prev) => {
          const filtered = prev.filter((msg) => msg.id !== typingId);
          return [
            ...filtered,
            {
              id: `bot-${Date.now()}`,
              text: "I couldn't find a direct match for that. 🔍 Please select one of the options below or rephrase your request. You can also type terms like 'pricing', 'mock tests', 'speaking', or 'contact' for help.",
              sender: 'bot',
              time: getCurrentTime(),
            },
          ];
        });
      }
      setIsTyping(false);
    }, 850);
  };

  const currentNode = chatbotFlows[nodeId] || chatbotFlows.home;
  const showBack = historyStack.length > 1 && !isTyping;
  const showHome = nodeId !== 'home' && !isTyping;

  if (!isOpen) {
    return (
      <button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 z-50 p-4.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-750 text-white rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer flex items-center justify-center group"
        aria-label="Open Chat Support"
      >
        <MessageCircle className="h-6.5 w-6.5 group-hover:rotate-12 transition-transform" />
      </button>
    );
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="px-5 py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-750 text-white rounded-xl shadow-2xl hover:scale-103 active:scale-97 transition-all duration-255 flex items-center gap-3 cursor-pointer border border-white/10"
        >
          <div className="relative">
            <MessageCircle className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-2 w-2 bg-green-400 rounded-full animate-ping"></span>
          </div>
          <span className="font-semibold text-xs tracking-wide">PTE Chat Support</span>
          <span className="h-2 w-2 bg-green-400 rounded-full"></span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <ChatWindow
        messages={messages}
        activeOptions={currentNode.options}
        showBack={showBack}
        showHome={showHome}
        onOptionSelect={handleOptionSelect}
        onBackSelect={handleBackSelect}
        onHomeSelect={handleHomeSelect}
        onSendMessage={handleSendMessage}
        onMinimize={() => setIsMinimized(true)}
        onClose={() => setIsOpen(false)}
      />
    </div>
  );
}
export default ChatWidget;
