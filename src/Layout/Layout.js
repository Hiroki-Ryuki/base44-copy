import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Star, User, Menu, X, Sparkles, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isHomePage = currentPageName === 'Home';
  const isConsultationPage = currentPageName === 'Consultation';
  const isPurchasePage = currentPageName === 'Purchase';
  
  // Don't show header on consultation and purchase pages (they have their own)
  const hideHeader = isConsultationPage || isPurchasePage;

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      const profiles = await base44.entities.UserProfile.filter({ user_id: currentUser.email });
      if (profiles.length > 0) {
        setProfile(profiles[0]);
      }
    } catch (err) {
      // Not logged in
    }
  };

  if (hideHeader) {
    return (
      <div className="min-h-screen bg-[#1C1C1C]">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;500;600;700&family=Noto+Sans+JP:wght@400;500;600&display=swap');
          body { font-family: 'Noto Sans JP', sans-serif; }
        `}</style>
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1C1C1C]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;500;600;700&family=Noto+Sans+JP:wght@400;500;600&display=swap');
        body { font-family: 'Noto Sans JP', sans-serif; }
        .noise-texture::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.02'/%3E%3C/svg%3E");
          pointer-events: none;
        }
      `}</style>
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all noise-texture ${
        isHomePage ? 'bg-transparent' : 'bg-[#1C1C1C]/95 backdrop-blur-lg border-b border-[#0F4C81]/20'
      }`}>
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to={createPageUrl('Home')} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-sm bg-gradient-to-br from-[#0F4C81] to-[#0F4C81]/60 flex items-center justify-center border border-[#C2A56F]/20">
                <Star className="w-4 h-4 text-[#C2A56F]" strokeWidth={1.5} />
              </div>
              <span className="text-[#F5F3F0] font-medium text-lg tracking-wide" style={{ fontFamily: "'Noto Serif JP', serif" }}>
                <ruby>暦堂<rt style={{ fontSize: '0.45em', color: '#C2A56F' }}>こよみどう</rt></ruby>
                <ruby className="ml-1">縁<rt style={{ fontSize: '0.45em', color: '#C2A56F' }}>えにし</rt></ruby>
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-6">
              {profile && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#0F4C81]/10 border border-[#0F4C81]/30">
                  <Ticket className="w-4 h-4 text-[#C2A56F]" />
                  <span className="text-[#F5F3F0] text-sm">あと{profile.tickets || 0}枚</span>
                </div>
              )}
              <Link to={createPageUrl('Home')} className="text-[#F5F3F0]/70 hover:text-[#C2A56F] transition-colors text-sm">
                ホーム
              </Link>
              <Link to={createPageUrl('Consultation')} className="text-[#F5F3F0]/70 hover:text-[#C2A56F] transition-colors text-sm">
                鑑定を始める
              </Link>
              {user ? (
                <Link to={createPageUrl('MyPage')}>
                  <Button variant="ghost" size="sm" className="text-[#F5F3F0]/70 hover:text-[#F5F3F0] hover:bg-[#0F4C81]/20">
                    <User className="w-4 h-4 mr-2" />
                    マイページ
                  </Button>
                </Link>
              ) : (
                <Button
                  onClick={() => base44.auth.redirectToLogin()}
                  size="sm"
                  className="bg-[#0F4C81] hover:bg-[#0F4C81]/80 text-[#F5F3F0] rounded-md border border-[#C2A56F]/20"
                >
                  ログイン
                </Button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-[#F5F3F0] p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-[#1C1C1C]/98 border-t border-[#0F4C81]/20 noise-texture"
            >
              <div className="px-4 py-6 space-y-4">
                {profile && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-[#0F4C81]/10 border border-[#0F4C81]/30 mb-4">
                    <Ticket className="w-4 h-4 text-[#C2A56F]" />
                    <span className="text-[#F5F3F0] text-sm">チケット残数：あと{profile.tickets || 0}枚</span>
                  </div>
                )}
                <Link
                  to={createPageUrl('Home')}
                  onClick={() => setIsMenuOpen(false)}
                  className="block text-[#F5F3F0]/70 hover:text-[#C2A56F] py-2"
                >
                  ホーム
                </Link>
                <Link
                  to={createPageUrl('Consultation')}
                  onClick={() => setIsMenuOpen(false)}
                  className="block text-[#F5F3F0]/70 hover:text-[#C2A56F] py-2"
                >
                  <Sparkles className="w-4 h-4 inline mr-2" />
                  鑑定を始める
                </Link>
                {user ? (
                  <Link
                    to={createPageUrl('MyPage')}
                    onClick={() => setIsMenuOpen(false)}
                    className="block text-[#F5F3F0]/70 hover:text-[#C2A56F] py-2"
                  >
                    <User className="w-4 h-4 inline mr-2" />
                    マイページ
                  </Link>
                ) : (
                  <Button
                    onClick={() => {
                      setIsMenuOpen(false);
                      base44.auth.redirectToLogin();
                    }}
                    className="w-full bg-[#0F4C81] hover:bg-[#0F4C81]/80 text-[#F5F3F0] rounded-md border border-[#C2A56F]/20"
                  >
                    ログイン
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Main Content */}
      <main className={isHomePage ? '' : 'pt-16'}>
        {children}
      </main>
    </div>
  );
}
