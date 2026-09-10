import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Coffee, MapPin } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div style={{ 
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100dvh',
      width: '100%',
      backgroundImage: 'linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.65)), url("/landing_coffee_cake.png")', // Foto profesional de café y torta
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      color: 'white',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0
    }}>
      <div className="animate-fade-in" style={{ 
        padding: '2rem',
        width: '90%',
        maxWidth: '400px',
        textAlign: 'center'
      }}>
        <Coffee 
          size={64} 
          style={{ 
            margin: '0 auto 1rem auto',
            color: 'var(--color-accent)',
            filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))'
          }} 
        />
        <h1 
          className="font-serif" 
          style={{ 
            fontSize: '3rem', 
            color: 'white', 
            margin: '0 0 0.25rem 0',
            textShadow: '0 2px 10px rgba(0,0,0,0.8), 0 1px 3px rgba(0,0,0,0.5)'
          }}
        >
          Patagonia
        </h1>
        <p 
          className="font-serif" 
          style={{ 
            fontSize: '1.4rem', 
            color: 'var(--color-accent)', 
            margin: '0 0 1.5rem 0',
            fontWeight: '600',
            textShadow: '0 2px 8px rgba(0,0,0,0.8), 0 1px 3px rgba(0,0,0,0.5)'
          }}
        >
          Cafetería & Heladería
        </p>
        
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '0.5rem', 
          marginBottom: '2.5rem', 
          fontSize: '1rem', 
          fontWeight: '500',
          textShadow: '0 2px 5px rgba(0,0,0,0.8)'
        }}>
          <MapPin size={18} style={{ color: 'var(--color-accent)' }} />
          <span>Al pie de la cordillera</span>
        </div>

        <button 
          onClick={() => navigate('/menu')}
          className="btn"
          style={{ 
            backgroundColor: 'var(--color-accent)', 
            color: 'var(--color-primary)', 
            width: '100%', 
            fontSize: '1.15rem', 
            padding: '1rem 1.5rem',
            borderRadius: '14px',
            fontWeight: 'bold',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            cursor: 'pointer',
            transition: 'transform 0.2s, background-color 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.03)';
            e.currentTarget.style.backgroundColor = '#e5b383';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.backgroundColor = 'var(--color-accent)';
          }}
        >
          Ver Carta y Pedir
        </button>
      </div>
    </div>
  );
};

export default Landing;
