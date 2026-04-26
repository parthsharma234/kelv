import React from 'react';
import { Mail, Instagram } from 'lucide-react';
import RedPandaLogo from './RedPandaLogo';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="section-rule"
      style={{ background: 'var(--bg)', padding: '56px 0 40px' }}
    >
      <div
        style={{
          maxWidth: 'calc(var(--page-max) + var(--page-outer) * 2)',
          margin: '0 auto',
          padding: '0 var(--page-outer)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '48px',
            alignItems: 'start',
            marginBottom: '40px',
          }}
        >
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <RedPandaLogo size="md" animate={true} />
              <div>
                <span style={{ display: 'block', fontSize: '15px', fontWeight: 590, color: 'var(--text)', letterSpacing: '-0.01em' }}>Kelv</span>
                <span style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', marginTop: '2px' }}>
                  interview intelligence
                </span>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-3)', lineHeight: '1.6', maxWidth: '340px' }}>
              Interview prep should feel specific, calm, and honest. Kelv is built to show the real signal behind every answer.
            </p>
          </div>

          {/* Links */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div
              style={{
                padding: '16px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Mail style={{ width: '13px', height: '13px', color: 'var(--orange)' }} />
                <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace' }}>Contact</span>
              </div>
              <a
                href="mailto:team@kelvai.com"
                style={{ fontSize: '13px', color: 'var(--text-2)', textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={(e) => { (e.target as HTMLElement).style.color = 'var(--orange)'; }}
                onMouseLeave={(e) => { (e.target as HTMLElement).style.color = 'var(--text-2)'; }}
              >
                team@kelvai.com
              </a>
            </div>

            <div
              style={{
                padding: '16px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Instagram style={{ width: '13px', height: '13px', color: 'var(--orange)' }} />
                <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace' }}>Instagram</span>
              </div>
              <a
                href="https://instagram.com/kelv.ai"
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: '13px', color: 'var(--text-2)', textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={(e) => { (e.target as HTMLElement).style.color = 'var(--orange)'; }}
                onMouseLeave={(e) => { (e.target as HTMLElement).style.color = 'var(--text-2)'; }}
              >
                @kelv.ai
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '24px',
            borderTop: '1px solid var(--border)',
          }}
        >
          <p style={{ fontSize: '12px', color: 'var(--text-4)' }}>
            Copyright {currentYear} Kelv. All rights reserved.
          </p>
          <p style={{ fontSize: '11px', color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', letterSpacing: '0.06em' }}>
            Built for deliberate practice
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
