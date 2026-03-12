import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const CoachPage = () => {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const suggestedPrompts = [
    'What should I train today?',
    'Why is my score low this week?',
    'Am I making real progress?',
    'Plan me a 4-week program',
    'What should I eat before training?',
  ];

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    const userMsg = { role: 'user' as const, content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Mock response for now — will integrate with Lovable AI later
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Based on your recent data, here's my take: Your average score has been around 74 this week, which is solid Yellow territory. ${text.includes('train') ? 'I\'d recommend a moderate lower body session today — your upper body needs more recovery time.' : 'Keep focusing on sleep quality and nutrition to push into consistent Green territory.'} Remember, consistency beats intensity every time. 💪`,
      }]);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">🤖</div>
          <div>
            <h1 className="font-semibold">FitCoach</h1>
            <p className="text-xs text-muted-foreground">Knows your last 30 days</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="space-y-4">
            <div className="bg-card rounded-xl p-4 card-shadow max-w-sm">
              <p className="text-sm">Hi there 👋 I know your training history. Ask me anything.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestedPrompts.map(prompt => (
                <Button key={prompt} variant="outline" size="sm" className="text-xs" onClick={() => handleSend(prompt)}>
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${
              msg.role === 'user'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card card-shadow'
            }`}>
              {msg.content}
            </div>
          </motion.div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-card card-shadow rounded-xl px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse" />
                <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <form onSubmit={e => { e.preventDefault(); handleSend(input); }} className="flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask your coach anything..."
            className="bg-card flex-1"
          />
          <Button type="submit" disabled={!input.trim() || loading}>Send</Button>
        </form>
      </div>
    </div>
  );
};

export default CoachPage;
