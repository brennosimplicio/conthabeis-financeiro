'use client';
import { useState, useEffect } from 'react';
import { getDb } from '@/lib/db';
import Sidebar from '@/components/Sidebar';
import { Lock, LogIn } from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function ClientAuthWrapper({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const { showToast } = useToast();
  const supabase = getDb();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const [isSignUp, setIsSignUp] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoggingIn(true);
    try {
      let result;
      if (isSignUp) {
        result = await supabase.auth.signUp({ email, password });
      } else {
        result = await supabase.auth.signInWithPassword({ email, password });
      }
      
      if (result.error) {
        showToast(result.error.message, 'error');
      } else {
        showToast(isSignUp ? 'Conta criada! Verifique o e-mail ou faça login.' : 'Login realizado com sucesso!');
        if (isSignUp) setIsSignUp(false);
      }
    } catch (err) {
      showToast('Erro interno', 'error');
    } finally {
      setLoggingIn(false);
    }
  };

  if (loading) {
    return <div className="flex-center" style={{ height: '100vh', background: 'var(--bg-darkest)' }}><div className="spinner"></div></div>;
  }

  if (!session) {
    return (
      <div className="flex-center" style={{ height: '100vh', background: 'var(--bg-darkest)' }}>
        <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
          <div className="flex-center" style={{ marginBottom: '1.5rem', flexDirection: 'column', gap: '1rem' }}>
            <img src="/logo.png" alt="Logo" style={{ maxHeight: '60px' }} />
            <h2 style={{ textAlign: 'center' }}>Acesso Restrito</h2>
          </div>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="form-label">E-mail</label>
              <input 
                type="email" 
                className="input" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <label className="form-label">Senha</label>
              <input 
                type="password" 
                className="input" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                placeholder="******"
                minLength={6}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }} disabled={loggingIn}>
              {loggingIn ? 'Aguarde...' : <><LogIn size={18} /> {isSignUp ? 'Criar Conta' : 'Entrar'}</>}
            </button>
            <button type="button" className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setIsSignUp(!isSignUp)}>
              {isSignUp ? 'Já tenho uma conta (Fazer Login)' : 'Criar nova conta'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
