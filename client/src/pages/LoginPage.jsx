import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm';

const LoginPage = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="login-page">
      <div style={{ 
        background: 'linear-gradient(135deg, #800020 0%, #600018 100%)',
        minHeight: '40vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        textAlign: 'center'
      }}>
        <div>
          <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Welcome Back</h1>
          <p style={{ fontSize: '1.2rem', opacity: 0.9 }}>Sign in to continue your learning journey</p>
        </div>
      </div>
      <AuthForm />
    </div>
  );
};

export default LoginPage;
