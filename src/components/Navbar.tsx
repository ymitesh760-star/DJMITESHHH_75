import React, { useState } from 'react';
import { 
  Disc, 
  Music, 
  ListMusic, 
  Sliders, 
  ShieldCheck, 
  Radio, 
  Menu, 
  X, 
  RotateCcw, 
  LogIn, 
  LogOut, 
  Lock,
  Sparkles 
} from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { signInWithGoogle, logoutAdmin } from '../services/firebase';
import { STUDIO_BRANDING } from '../constants/branding';

interface NavbarProps {
  onOpenAdmin: () => void;
  onReplayIntro: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAdmin, onReplayIntro }) => {
  const { isPlaying, authUser, isAdmin } = useMusic();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSwitchAccount = async () => {
    try {
      await logoutAdmin();
      await signInWithGoogle();
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        console.warn('Switch account error:', err);
      }
    }
  };

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        onOpenAdmin();
      }
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 glass-bar select-none transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand DJ Logo in Chrome & Gradient */}
        <div 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-3.5 cursor-pointer group"
        >
          <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#7957FF] to-[#64DFFF] p-0.5 shadow-[0_0_20px_rgba(121,87,255,0.4)]">
            <div className="w-full h-full bg-[#07080C] rounded-[14px] flex items-center justify-center">
              <Disc className={`w-5 h-5 text-[#64DFFF] ${isPlaying ? 'animate-spin-slow' : 'group-hover:rotate-45'} transition-transform`} />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-black text-base sm:text-lg tracking-wider text-white">
                <span className="text-silver-glow">DJ MITESHHH</span>
              </span>
              <span className="font-mono text-xs font-bold text-violet-cyan px-2 py-0.5 rounded-md bg-white/5 border border-white/10">
                75
              </span>
            </div>
            <div className="text-[10px] font-mono text-[#A5ADBD] tracking-[0.2em] uppercase flex items-center gap-1.5">
              <span>OBSIDIAN FREQUENCY</span>
              <span>•</span>
              <span className="text-[#64DFFF]">SOUND LAB</span>
            </div>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-2 text-xs font-mono tracking-wider">
          <button
            onClick={() => scrollTo('featured-remixes')}
            className="text-[#A5ADBD] hover:text-white hover:bg-white/5 px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 font-medium"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#7957FF]" />
            <span>EXCLUSIVES</span>
          </button>

          <button
            onClick={() => scrollTo('music-library')}
            className="text-[#A5ADBD] hover:text-white hover:bg-white/5 px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 font-medium"
          >
            <Music className="w-3.5 h-3.5 text-[#64DFFF]" />
            <span>ARCHIVE</span>
          </button>

          <button
            onClick={() => scrollTo('gear-rack')}
            className="text-[#A5ADBD] hover:text-white hover:bg-white/5 px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 font-medium"
          >
            <Sliders className="w-3.5 h-3.5 text-[#B8A8FF]" />
            <span>HARDWARE</span>
          </button>

          <button
            onClick={() => scrollTo('visualizer-stage')}
            className="text-[#A5ADBD] hover:text-white hover:bg-white/5 px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 font-medium"
          >
            <Radio className="w-3.5 h-3.5 text-[#10B981]" />
            <span>VISUALIZER</span>
          </button>

          <button
            onClick={() => scrollTo('playlists')}
            className="text-[#A5ADBD] hover:text-white hover:bg-white/5 px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 font-medium"
          >
            <ListMusic className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>SETS</span>
          </button>

          <button
            onClick={() => scrollTo('about')}
            className="text-[#A5ADBD] hover:text-white hover:bg-white/5 px-3.5 py-2 rounded-xl transition-all font-medium"
          >
            MANIFESTO
          </button>
        </nav>

        {/* Right Action Icons: Replay Intro, Sign In, Admin Control Room */}
        <div className="flex items-center gap-2.5">
          
          {/* Replay Intro Button */}
          <button
            onClick={onReplayIntro}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[#A5ADBD] hover:text-white transition-all shadow-xs"
            title="Replay Cinematic Intro (Scene 1-7)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Authentication State */}
          {authUser ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleSwitchAccount}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-[#DCE1EA] hover:text-white transition-colors"
                title={`Signed in as ${authUser.email}. Click to switch account.`}
              >
                {authUser.photoURL ? (
                  <img src={authUser.photoURL} alt={authUser.displayName || 'User'} className="w-4 h-4 rounded-full" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
                )}
                <span className="truncate max-w-[100px] text-[11px] font-bold">
                  {isAdmin ? 'ADMIN' : authUser.displayName?.split(' ')[0] || 'LISTENER'}
                </span>
              </button>

              <button
                onClick={logoutAdmin}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[#A5ADBD] hover:text-white transition-colors"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleSignIn}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono font-medium text-white transition-all"
              title="Sign in with Google"
            >
              <LogIn className="w-3.5 h-3.5 text-[#64DFFF]" />
              <span className="hidden sm:inline">SIGN IN</span>
            </button>
          )}

          {/* Admin Studio Trigger Button */}
          <button
            onClick={onOpenAdmin}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-mono font-bold tracking-wider uppercase transition-all shadow-md ${
              isAdmin
                ? 'bg-gradient-to-r from-[#7957FF] to-[#64DFFF] text-white border-transparent shadow-[0_0_20px_rgba(121,87,255,0.4)] hover:scale-105'
                : 'bg-[#11131B] border-white/15 text-[#DCE1EA] hover:border-[#7957FF]/60 hover:text-white'
            }`}
          >
            {isAdmin ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>STUDIO</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5 text-[#B8A8FF]" />
                <span>STUDIO</span>
              </>
            )}
          </button>

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

        </div>

      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pt-2 pb-6 space-y-2 border-t border-white/10 bg-[#07080C]/95 backdrop-blur-2xl">
          <button
            onClick={() => scrollTo('featured-remixes')}
            className="w-full text-left px-4 py-3 rounded-xl hover:bg-white/5 text-sm font-mono text-[#DCE1EA] flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-[#7957FF]" />
            <span>VIP EXCLUSIVES</span>
          </button>
          <button
            onClick={() => scrollTo('music-library')}
            className="w-full text-left px-4 py-3 rounded-xl hover:bg-white/5 text-sm font-mono text-[#DCE1EA] flex items-center gap-2"
          >
            <Music className="w-4 h-4 text-[#64DFFF]" />
            <span>MUSIC ARCHIVE</span>
          </button>
          <button
            onClick={() => scrollTo('gear-rack')}
            className="w-full text-left px-4 py-3 rounded-xl hover:bg-white/5 text-sm font-mono text-[#DCE1EA] flex items-center gap-2"
          >
            <Sliders className="w-4 h-4 text-[#B8A8FF]" />
            <span>HARDWARE CONSOLE</span>
          </button>
          <button
            onClick={() => scrollTo('visualizer-stage')}
            className="w-full text-left px-4 py-3 rounded-xl hover:bg-white/5 text-sm font-mono text-[#DCE1EA] flex items-center gap-2"
          >
            <Radio className="w-4 h-4 text-[#10B981]" />
            <span>AUDIO VISUALIZER</span>
          </button>
          <button
            onClick={() => scrollTo('playlists')}
            className="w-full text-left px-4 py-3 rounded-xl hover:bg-white/5 text-sm font-mono text-[#DCE1EA] flex items-center gap-2"
          >
            <ListMusic className="w-4 h-4 text-[#F59E0B]" />
            <span>CURATED SETS</span>
          </button>
          <button
            onClick={() => scrollTo('about')}
            className="w-full text-left px-4 py-3 rounded-xl hover:bg-white/5 text-sm font-mono text-[#DCE1EA]"
          >
            SOUND LAB MANIFESTO
          </button>
        </div>
      )}
    </header>
  );
};
