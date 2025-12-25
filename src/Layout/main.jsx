import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Ticket, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import BirthDateForm from '@/components/consultation/BirthDateForm';
import ChatInterface from '@/components/consultation/ChatInterface';

const concernExamples = [
  '今の彼との関係がうまくいくか心配です...',
  '転職を考えていますが、今のタイミングで良いでしょうか...',
  '最近体調が優れなくて、健康面が気になります...',
  '人間関係で悩んでいます。どう接すれば良いでしょうか...',
  '将来のお金のことが不安です...',
  '新しいことを始めたいけど、迷っています...',
];

export default function Consultation() {
  const [step, setStep] = useState(1); // 1: birth, 2: concern, 3: chat
  const [profile, setProfile] = useState(null);
  const [birthData, setBirthData] = useState(null);
  const [concern, setConcern] = useState('');
  const [consultation, setConsultation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [user, setUser] = useState(null);
  const [randomExample] = useState(() => concernExamples[Math.floor(Math.random() * concernExamples.length)]);

  useEffect(() => {
    loadUserAndProfile();
    checkForExistingConversation();
  }, []);

  useEffect(() => {
    if (!conversationId) return;
    
    const unsubscribe = base44.agents.subscribeToConversation(conversationId, (data) => {
      setMessages(data.messages || []);
    });

    return () => unsubscribe();
  }, [conversationId]);

  const checkForExistingConversation = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const existingConversationId = urlParams.get('conversation_id');
    
    if (existingConversationId) {
      setIsLoading(true);
      try {
        const conversation = await base44.agents.getConversation(existingConversationId);
        setConversationId(existingConversationId);
        setMessages(conversation.messages || []);
        
        // Load consultation data
        const consultationId = conversation.metadata?.consultation_id;
        if (consultationId) {
          const consultations = await base44.entities.Consultation.filter({ id: consultationId });
          if (consultations.length > 0) {
            setConsultation(consultations[0]);
          }
        }
        
        setStep(3);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const loadUserAndProfile = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      const profiles = await base44.entities.UserProfile.filter({ user_id: currentUser.email });
      if (profiles.length > 0) {
        setProfile(profiles[0]);
        if (profiles[0].birth_date) {
          setBirthData({
            birth_date: profiles[0].birth_date,
            birth_time: profiles[0].birth_time || '',
            birth_place: profiles[0].birth_place || '',
          });
        }
      }
    } catch (err) {
      // Not logged in
    }
  };

  const handleBirthSubmit = async (data) => {
    setBirthData(data);
    
    if (user) {
      try {
        if (profile) {
          await base44.entities.UserProfile.update(profile.id, data);
        } else {
          await base44.entities.UserProfile.create({
            user_id: user.email,
            ...data,
            tickets: 1,
          });
        }
      } catch (err) {
        console.error(err);
      }
    }
    
    setStep(2);
  };

  const handleConcernSubmit = async () => {
    setIsLoading(true);

    try {
      // Create consultation record
      const newConsultation = await base44.entities.Consultation.create({
        user_id: user?.email || 'anonymous',
        topic: 'general',
        concern: concern || '総合的な鑑定をお願いします',
        status: 'active',
        follow_up_count: 0,
      });
      setConsultation(newConsultation);

      // Create agent conversation
      const conversation = await base44.agents.createConversation({
        agent_name: 'fortune_teller',
        metadata: {
          name: '鑑定',
          consultation_id: newConsultation.id,
        },
      });
      setConversationId(conversation.id);

      // Build initial message with birth data and concern
      const concernText = concern.trim() ? `

【お悩み】
${concern}` : '';

      const initialMessage = `【相談者情報】
生年月日: ${birthData.birth_date}
${birthData.birth_time ? `出生時刻: ${birthData.birth_time}` : ''}
${birthData.birth_place ? `出生地: ${birthData.birth_place}` : ''}${concernText}

※まず生年月日から性格を読み取ってください。母親のように優しく寄り添い、「最近○○で悩んでいない？」のような共感的な問いかけを含めてください。最後は「自分のことで気になっていることはある？」のような自然な誘導で会話を続けやすくしてください。`;

      // Send first message
      await base44.agents.addMessage(conversation, {
        role: 'user',
        content: initialMessage,
      });

      setStep(3);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendFollowUp = async (message) => {
    if (!conversationId || !consultation) return;
    setIsLoading(true);

    try {
      const conversation = await base44.agents.getConversation(conversationId);
      
      await base44.agents.addMessage(conversation, {
        role: 'user',
        content: message,
      });

      // Update follow-up count
      const newCount = (consultation.follow_up_count || 0) + 1;
      await base44.entities.Consultation.update(consultation.id, {
        follow_up_count: newCount,
        status: newCount >= 2 ? 'completed' : 'active',
      });
      setConsultation({ ...consultation, follow_up_count: newCount });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950/30 to-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-lg border-b border-slate-800">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              戻る
            </Button>
          </Link>
          
          {profile && (
            <div className="flex items-center gap-2 text-white/60">
              <Ticket className="w-4 h-4" />
              <span className="text-sm">{profile.tickets || 0}枚</span>
            </div>
          )}
        </div>
      </header>

      {/* Progress */}
      {step < 3 && (
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="flex items-center justify-center gap-2">
            {[1, 2].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all ${
                  s <= step ? 'w-12 bg-violet-500' : 'w-8 bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <main className={step === 3 ? 'h-[calc(100vh-73px)] flex flex-col' : 'max-w-3xl mx-auto px-4 py-8'}>
        <AnimatePresence mode="wait">
          {step === 1 && (
            <BirthDateForm 
              onSubmit={handleBirthSubmit} 
              isLoading={isLoading}
              initialData={birthData}
            />
          )}

          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="max-w-lg mx-auto"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-light text-white mb-2">
                  気になることはありますか？
                </h2>
                <p className="text-white/50 text-sm">
                  なければそのまま鑑定を開始できます
                </p>
              </div>

              <div className="space-y-4">
                <Textarea
                  value={concern}
                  onChange={(e) => setConcern(e.target.value)}
                  placeholder={`例：${randomExample}`}
                  className="min-h-[160px] bg-slate-900/50 border-slate-700 text-white placeholder:text-white/30 focus:border-violet-500 rounded-xl resize-none"
                />

                <Button
                  onClick={handleConcernSubmit}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white rounded-full h-12 text-base"
                >
                  {isLoading ? (
                    <>
                      <span className="animate-pulse">鑑定を準備中...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      鑑定を開始する
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <ChatInterface
              messages={messages}
              onSendMessage={handleSendFollowUp}
              isLoading={isLoading}
              followUpCount={consultation?.follow_up_count || 0}
              maxFollowUps={2}
              isComplete={consultation?.status === 'completed'}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
