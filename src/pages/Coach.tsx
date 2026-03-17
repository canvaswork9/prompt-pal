import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import DisabledFeaturePlaceholder from '@/components/DisabledFeaturePlaceholder';

const CoachPage = () => {
  const coachEnabled = useFeatureFlag('ai_coach');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [todayScore, setTodayScore] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadContext() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const [{ data: profile }, { data: checkin }] = await Promise.all([
          supabase.from('user_profiles').select('display_name').eq('id', user.id).maybeSingle(),
          supabase.from('daily_checkins').select('readiness_score').eq('user_id', user.id).eq('date', new Date().toISOString().slice(0, 10)).maybeSingle(),
        ]);
        if (profile?.display_name) setDisplayName(profile.display_name);
        if (checkin?.readiness_score) setTodayScore(checkin.readiness_score);
      } catch (err) {
        console.error('Failed to load coach context:', err);
      }
    }
    loadContext();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const suggestedPrompts = [
    'What should I train today?',
    'Why is my score low this week?',
    'Am I making real progress?',
    'Plan me a 4-week program',
    'What should I eat before training?',
  ];

  const handleSend = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg = { role: 'user' as const, content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');

      const allMessages = [...messages, userMsg].slice(-10);

      const { data, error } = await supabase.functions.invoke('ai-coach', {
        body: { messages: allMessages, userId: user.id },
      });

      if (error) throw error;

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.reply || 'Sorry, something went wrong.',
      }]);
    } catch (err: any) {
      console.error('Coach error:', err);
      toast.error('Failed to get response. Please try again.');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I had trouble connecting. Please try again. 🔄',
      }]);
    } finally {
      setLoading(false);
    }
  };

  if (!coachEnabled) return <DisabledFeaturePlaceholder name="AI Coach" />;

  return (
    <div className="max-w-3xl mx-auto flex flex-col" style={{ height: 'calc(100dvh - 80px)' }}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">🤖</div>
          <div className="flex-1">
            <h1 className="font-semibold">FitCoach</h1>
            <p className="text-xs text-muted-foreground">Knows your last 30 days{displayName ? ` · Hi, ${displayName}` : ''}</p>
          </div>
          {todayScore !== null && (
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              todayScore >= 75 ? 'bg-status-green/10 text-status-green' :
              todayScore >= 50 ? 'bg-status-yellow/10 text-status-yellow' :
              'bg-status-red/10 text-status-red'
            }`}>
              Score: {todayScore}
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="space-y-4">
            <div className="bg-card rounded-xl p-4 card-shadow max-w-sm">
              <p className="text-sm">Hi{displayName ? ` ${displayName}` : ''} 👋 I know your training history. Ask me anything.</p>
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
            <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm whitespace-pre-wrap ${
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
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
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
