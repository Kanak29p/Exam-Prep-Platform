import React from 'react';
import { Bot, User } from 'lucide-react';

export interface Message {
  id: string | number;
  text: string;
  sender: 'bot' | 'user';
  time: string;
  isTyping?: boolean;
}

interface MessageBubbleProps {
  message: Message;
}

// Inline Markdown Parser for bold text
function parseInlineMarkdown(text: string): React.ReactNode[] | string {
  const boldRegex = /\*\*([^*]+)\*\*/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = boldRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    parts.push(
      <strong key={match.index} className="font-bold text-gray-900 dark:text-white">
        {match[1]}
      </strong>
    );
    lastIndex = boldRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length === 0 ? text : parts;
}

// Full Markdown Block Parser (handles Tables, Lists, Headings, Paragraphs)
function parseMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  
  let currentTable: string[][] = [];
  let inTable = false;
  
  let currentList: string[] = [];
  let inList = false;

  const flushTable = (key: number) => {
    if (currentTable.length === 0) return;

    // Check if second row is a table divider e.g. |:---|---:| or similar
    const hasDivider = currentTable[1] && currentTable[1].every(
      cell => cell.trim().startsWith('-') || cell.trim().includes('---') || cell.trim() === ''
    );

    const headers = currentTable[0];
    const rows = hasDivider ? currentTable.slice(2) : currentTable.slice(1);

    elements.push(
      <div key={`table-${key}`} className="overflow-x-auto my-3 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
        <table className="w-full text-xs text-left border-collapse bg-white dark:bg-gray-800">
          <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 uppercase font-semibold border-b border-gray-200 dark:border-gray-600">
            <tr>
              {headers.map((cell, idx) => (
                <th key={idx} className="px-3 py-2 border-r border-gray-200 dark:border-gray-600 last:border-none">
                  {parseInlineMarkdown(cell)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {rows.map((row, rowIdx) => (
              <tr 
                key={rowIdx} 
                className="hover:bg-gray-50/50 dark:hover:bg-gray-750 odd:bg-white even:bg-gray-50/30 dark:odd:bg-gray-800 dark:even:bg-gray-800/40"
              >
                {row.map((cell, cellIdx) => (
                  <td key={cellIdx} className="px-3 py-2 text-gray-600 dark:text-gray-300 border-r border-gray-200 dark:border-gray-750 last:border-none">
                    {parseInlineMarkdown(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );

    currentTable = [];
    inTable = false;
  };

  const flushList = (key: number) => {
    if (currentList.length === 0) return;

    elements.push(
      <ul key={`list-${key}`} className="list-disc pl-5 my-2 space-y-1 text-sm text-gray-700 dark:text-gray-300">
        {currentList.map((item, idx) => (
          <li key={idx}>{parseInlineMarkdown(item)}</li>
        ))}
      </ul>
    );

    currentList = [];
    inList = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Table Row Detection
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      if (inList) flushList(i);
      inTable = true;
      const cells = line.split('|').slice(1, -1).map(c => c.trim());
      currentTable.push(cells);
      continue;
    } else if (inTable) {
      flushTable(i);
    }

    // Bullet List Detection
    if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
      inList = true;
      const content = line.trim().replace(/^[\*\-]\s+/, '');
      currentList.push(content);
      continue;
    } else if (inList) {
      flushList(i);
    }

    // Numbered List Detection
    if (line.trim().match(/^\d+\.\s+/)) {
      const numMatch = line.trim().match(/^\d+/);
      const content = line.trim().replace(/^\d+\.\s+/, '');
      elements.push(
        <div key={`num-${i}`} className="flex gap-2 text-sm my-1 text-gray-700 dark:text-gray-300 leading-relaxed">
          <span className="font-semibold text-blue-600 dark:text-blue-400">{numMatch ? numMatch[0] : '1'}.</span>
          <div className="flex-1">{parseInlineMarkdown(content)}</div>
        </div>
      );
      continue;
    }

    // Heading Detection
    if (line.trim().startsWith('#')) {
      const level = (line.match(/^#+/) || ['#'])[0].length;
      const content = line.replace(/^#+\s+/, '');
      const headingClass = level === 1 
        ? 'text-lg font-bold text-gray-900 dark:text-white mt-3 mb-1'
        : 'text-base font-semibold text-gray-800 dark:text-gray-200 mt-2 mb-1';
      elements.push(
        <div key={`heading-${i}`} className={headingClass}>
          {parseInlineMarkdown(content)}
        </div>
      );
      continue;
    }

    // Blank line
    if (line.trim() === '') {
      continue;
    }

    // Paragraph
    elements.push(
      <p key={`p-${i}`} className="text-sm my-1.5 leading-relaxed text-gray-800 dark:text-gray-200">
        {parseInlineMarkdown(line)}
      </p>
    );
  }

  // Flush remaining blocks
  if (inTable) flushTable(lines.length);
  if (inList) flushList(lines.length);

  return <div className="space-y-0.5">{elements}</div>;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isBot = message.sender === 'bot';

  return (
    <div className={`flex items-start gap-2.5 ${!isBot ? 'flex-row-reverse' : ''} animate-fade-in`}>
      {/* Avatar Icon */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
        isBot 
          ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/40' 
          : 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 border border-purple-200/50 dark:border-purple-800/40'
      }`}>
        {isBot ? <Bot className="h-4.5 w-4.5" /> : <User className="h-4.5 w-4.5" />}
      </div>

      {/* Bubble Container */}
      <div className={`flex flex-col max-w-[78%] ${!isBot ? 'items-end' : 'items-start'}`}>
        <div className={`rounded-2xl px-4 py-2.5 shadow-sm border ${
          isBot 
            ? 'bg-white dark:bg-gray-800 border-gray-150 dark:border-gray-700/80 text-gray-800 dark:text-gray-100 rounded-tl-none' 
            : 'bg-gradient-to-r from-blue-600 to-purple-600 border-transparent text-white rounded-tr-none'
        }`}>
          {message.isTyping ? (
            <div className="flex space-x-1.5 py-1 px-1 items-center">
              <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          ) : (
            isBot ? parseMarkdown(message.text) : <p className="text-sm leading-relaxed">{message.text}</p>
          )}
        </div>
        
        {/* Time Stamp */}
        <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 px-1">
          {message.time}
        </span>
      </div>
    </div>
  );
}
