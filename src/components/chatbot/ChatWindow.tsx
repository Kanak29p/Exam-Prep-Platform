import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Minimize2 } from 'lucide-react';
import { MessageBubble, Message } from './MessageBubble';
import { OptionButtons, Option } from './OptionButtons';

interface ChatWindowProps {
  messages: Message[];
  activeOptions?: Option[];
  showBack: boolean;
  showHome: boolean;
  onOptionSelect: (option: Option) => void;
  onBackSelect: () => void;
  onHomeSelect: () => void;
  onSendMessage: (text: string) => void;
  onMinimize: () => void;
  onClose: () => void;
}

export function ChatWindow({
  messages,
  activeOptions = [],
  showBack,
  showHome,
  onOptionSelect,
  onBackSelect,
  onHomeSelect,
  onSendMessage,
  onMinimize,
  onClose,
}: ChatWindowProps) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const quickReplies = ['Pricing Plans', 'Study Plans', 'Technical Help', 'Contact Support'];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-150 dark:border-gray-800 overflow-hidden flex flex-col h-[520px] w-96 max-w-[calc(100vw-2.5rem)] transition-all duration-300 animate-scale-up">
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-4 text-white flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-10 w-10 bg-white/15 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10">
                <MessageCircle className="h-5.5 w-5.5 text-white" />
              </div>
              <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-400 rounded-full border-2 border-white dark:border-gray-900 animate-pulse"></span>
            </div>
            <div>
              <div className="font-semibold text-sm tracking-wide">PTE Study Assistant</div>
              <div className="text-[11px] text-white/75 flex items-center gap-1">
                <span>Active Support Agent</span>
                <span className="h-1.5 w-1.5 bg-green-400 rounded-full"></span>
              </div>
            </div>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={onMinimize}
              title="Minimize Chat"
              className="p-1.5 hover:bg-white/15 rounded-lg transition-colors cursor-pointer"
            >
              <Minimize2 className="h-4.5 w-4.5" />
            </button>
            <button
              onClick={onClose}
              title="Close Chat"
              className="p-1.5 hover:bg-white/15 rounded-lg transition-colors cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Message and Options Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-950 flex flex-col scrollbar-thin">
        {/* Messages list */}
        <div className="space-y-4 flex-1">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Option buttons aligned above the input footer */}
        {activeOptions.length > 0 && (
          <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 p-3 rounded-2xl shadow-sm space-y-2 mt-4">
            <div className="text-[10px] uppercase font-bold tracking-wider text-gray-400 dark:text-gray-500">
              Select an option
            </div>
            <OptionButtons
              options={activeOptions}
              showBack={showBack}
              showHome={showHome}
              onOptionClick={onOptionSelect}
              onBackClick={onBackSelect}
              onHomeClick={onHomeSelect}
            />
          </div>
        )}
      </div>

      {/* Footer Area with Input and Quick Replies */}
      <div className="p-3.5 border-t border-gray-150 dark:border-gray-800/80 bg-white dark:bg-gray-900 flex-shrink-0">
        {/* Quick replies slider */}
        <div className="mb-2.5 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none flex-nowrap whitespace-nowrap">
          {quickReplies.map((reply, index) => (
            <button
              key={index}
              onClick={() => onSendMessage(reply)}
              className="px-3 py-1.5 text-[11px] font-medium bg-gray-50 dark:bg-gray-850 hover:bg-blue-50/50 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400 text-gray-600 dark:text-gray-300 rounded-full border border-gray-200 dark:border-gray-700/80 transition-colors flex-shrink-0 cursor-pointer"
            >
              {reply}
            </button>
          ))}
        </div>

        {/* Input fields */}
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type a keyword (e.g. pricing, scoring)..."
            className="flex-1 px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700/80 rounded-xl dark:bg-gray-850 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 placeholder-gray-400 dark:placeholder-gray-500"
          />
          <button
            onClick={handleSend}
            className="p-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg hover:brightness-105 active:scale-95 transition-all cursor-pointer flex-shrink-0"
          >
            <Send className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
