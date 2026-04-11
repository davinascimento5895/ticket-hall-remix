/**
 * TicketHall Certificate Templates
 * 
 * Four unique, production-grade certificate designs for event participation.
 * Each template is fully parametrizable with CSS custom properties for dynamic theming.
 * All templates are optimized for A4 landscape (297mm x 210mm / 1.414:1 ratio).
 */

import * as React from 'react';

// ============================================================
// Certificate Data Types
// ============================================================

export interface CertificateData {
  participantName: string;
  eventName: string;
  eventDate?: string;
  eventTime?: string;
  eventLocation?: string;
  producerName?: string;
  certificateCode: string;
  workloadHours?: number;
  customText?: string | null;
  verificationUrl?: string;
}

export interface CertificateConfig {
  showEventDate: boolean;
  showEventTime: boolean;
  showEventLocation: boolean;
  showWorkload: boolean;
  workloadHours: number;
  showProducerName: boolean;
  showProducerSignature: boolean;
  customText: string | null;
  template: CertificateTemplateId;
  primaryColor: string | null;
  secondaryColor: string | null;
  showLogo: boolean;
}

export type CertificateTemplateId = 
  | 'executive' 
  | 'modern' 
  | 'academic' 
  | 'creative';

// ============================================================
// Template Type Definitions
// ============================================================

export interface CertificateFontConfig {
  title: string;
  body: string;
  titleWeights: string;
  bodyWeights: string;
}

export interface CertificateColorConfig {
  primary: string;
  secondary: string;
  background?: string;
  text?: string;
  accent?: string;
}

export interface CertificateLayoutConfig {
  aspectRatio: string;
  padding: string;
  borderStyle?: string;
  hasDecorativeCorners: boolean;
  hasInnerBorder: boolean;
  contentAlignment: 'center' | 'left' | 'asymmetric';
}

export interface CertificateTemplate {
  id: CertificateTemplateId;
  name: string;
  description: string;
  category: 'formal' | 'modern' | 'traditional' | 'creative';
  defaultColors: CertificateColorConfig;
  fonts: CertificateFontConfig;
  layout: CertificateLayoutConfig;
  googleFonts: string[];
  render: (data: CertificateData, config: CertificateConfig) => React.ReactNode;
}

// ============================================================
// Template 1: EXECUTIVE
// Ivy League diploma inspired - Prestigious, traditional, high-status
// ============================================================

const ExecutiveTemplate: CertificateTemplate = {
  id: 'executive',
  name: 'Executive',
  description: 'Corporate elegance with ornate golden borders and wax seal simulation. Perfect for high-profile corporate events and prestigious conferences.',
  category: 'formal',
  
  defaultColors: {
    primary: '#1a365d',     // Deep navy
    secondary: '#c9a227',   // Rich gold
    background: '#faf8f3',  // Warm cream
    text: '#1a202c',        // Near black
    accent: '#8b6914',      // Dark gold
  },
  
  fonts: {
    title: '"Playfair Display", Georgia, serif',
    body: '"Source Sans 3", "Source Sans Pro", system-ui, sans-serif',
    titleWeights: '400;500;600;700',
    bodyWeights: '300;400;600;700',
  },
  
  layout: {
    aspectRatio: '297/210',
    padding: '48px 64px',
    hasDecorativeCorners: true,
    hasInnerBorder: true,
    contentAlignment: 'center',
  },
  
  googleFonts: [
    'Playfair Display:400,500,600,700',
    'Source Sans 3:300,400,600,700',
  ],
  
  render: (data, config) => {
    const primaryColor = config.primaryColor || ExecutiveTemplate.defaultColors.primary;
    const secondaryColor = config.secondaryColor || ExecutiveTemplate.defaultColors.secondary;
    
    return React.createElement('div', {
      className: 'executive-certificate',
      style: {
        '--cert-primary': primaryColor,
        '--cert-secondary': secondaryColor,
        '--cert-bg': ExecutiveTemplate.defaultColors.background,
        '--cert-text': ExecutiveTemplate.defaultColors.text,
        '--cert-accent': ExecutiveTemplate.defaultColors.accent,
        width: '100%',
        height: '100%',
        backgroundColor: 'var(--cert-bg)',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: ExecutiveTemplate.fonts.body,
      } as React.CSSProperties,
    }, [
      // Outer ornate border frame
      React.createElement('div', {
        key: 'outer-frame',
        style: {
          position: 'absolute',
          inset: '12px',
          border: '3px double var(--cert-secondary)',
          borderRadius: '2px',
          pointerEvents: 'none',
        },
      }),
      
      // Inner decorative border
      React.createElement('div', {
        key: 'inner-frame',
        style: {
          position: 'absolute',
          inset: '20px',
          border: '1px solid var(--cert-secondary)',
          opacity: 0.6,
          pointerEvents: 'none',
        },
      }),
      
      // Corner ornaments
      ...[
        { pos: 'top: 16px; left: 16px', rotate: '0deg' },
        { pos: 'top: 16px; right: 16px', rotate: '90deg' },
        { pos: 'bottom: 16px; right: 16px', rotate: '180deg' },
        { pos: 'bottom: 16px; left: 16px', rotate: '270deg' },
      ].map((corner, i) => React.createElement('svg', {
        key: `corner-${i}`,
        width: 48,
        height: 48,
        viewBox: '0 0 48 48',
        style: {
          position: 'absolute',
          ...Object.fromEntries(corner.pos.split('; ').map(s => s.split(': ').map((v, j) => j === 1 ? v : v))),
          transform: `rotate(${corner.rotate})`,
          pointerEvents: 'none',
        },
        children: React.createElement('path', {
          d: 'M4 4 L4 32 Q4 44 16 44 L44 44 M4 4 L20 4 M4 4 L4 20',
          fill: 'none',
          stroke: 'var(--cert-secondary)',
          strokeWidth: 2,
          strokeLinecap: 'round',
        }),
      })),
      
      // Main content container
      React.createElement('div', {
        key: 'content',
        style: {
          position: 'relative',
          zIndex: 1,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 72px',
          textAlign: 'center',
        },
      }, [
        // Logo/Brand Area
        config.showLogo && React.createElement('div', {
          key: 'logo',
          style: { marginBottom: '24px' },
        }, React.createElement('div', {
          style: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            letterSpacing: '0.2em',
            color: 'var(--cert-text)',
            textTransform: 'uppercase' as const,
          },
        }, [
          React.createElement('span', { key: 'ticket', style: { fontWeight: 600 } }, 'TICKET'),
          React.createElement('span', { key: 'hall', style: { fontWeight: 300, color: 'var(--cert-secondary)' } }, 'HALL'),
        ])),
        
        // Certificate Title
        React.createElement('h1', {
          key: 'title',
          style: {
            fontFamily: ExecutiveTemplate.fonts.title,
            fontSize: '32px',
            fontWeight: 600,
            color: 'var(--cert-primary)',
            letterSpacing: '0.15em',
            textTransform: 'uppercase' as const,
            margin: '0 0 8px 0',
          },
        }, 'Certificado'),
        
        // Subtitle
        React.createElement('p', {
          key: 'subtitle',
          style: {
            fontFamily: ExecutiveTemplate.fonts.title,
            fontSize: '14px',
            fontStyle: 'italic',
            color: 'var(--cert-accent)',
            margin: '0 0 32px 0',
          },
        }, 'de Participação'),
        
        // Decorative divider
        React.createElement('div', {
          key: 'divider-top',
          style: {
            width: '120px',
            height: '2px',
            background: 'linear-gradient(90deg, transparent, var(--cert-secondary), transparent)',
            margin: '0 auto 32px',
          },
        }),
        
        // Intro text
        React.createElement('p', {
          key: 'intro',
          style: {
            fontSize: '13px',
            color: 'var(--cert-text)',
            opacity: 0.7,
            margin: '0 0 16px 0',
            letterSpacing: '0.05em',
          },
        }, config.customText || 'Certificamos que'),
        
        // Participant Name
        React.createElement('h2', {
          key: 'participant',
          style: {
            fontFamily: ExecutiveTemplate.fonts.title,
            fontSize: '38px',
            fontWeight: 600,
            color: 'var(--cert-primary)',
            margin: '0 0 24px 0',
            lineHeight: 1.2,
          },
        }, data.participantName),
        
        // Participation statement
        React.createElement('p', {
          key: 'participated',
          style: {
            fontSize: '14px',
            color: 'var(--cert-text)',
            opacity: 0.8,
            margin: '0 0 16px 0',
          },
        }, 'participou do evento'),
        
        // Event Name
        React.createElement('h3', {
          key: 'event',
          style: {
            fontFamily: ExecutiveTemplate.fonts.title,
            fontSize: '24px',
            fontWeight: 500,
            color: 'var(--cert-primary)',
            margin: '0 0 8px 0',
          },
        }, data.eventName),
        
        // Event details row
        React.createElement('div', {
          key: 'details',
          style: {
            display: 'flex',
            justifyContent: 'center',
            gap: '32px',
            margin: '24px 0',
            fontSize: '12px',
            color: 'var(--cert-text)',
            opacity: 0.7,
          },
        }, [
          config.showEventDate && data.eventDate && React.createElement('span', { key: 'date' }, `📅 ${data.eventDate}`),
          config.showEventTime && data.eventTime && React.createElement('span', { key: 'time' }, `🕐 ${data.eventTime}`),
          config.showEventLocation && data.eventLocation && React.createElement('span', { key: 'location' }, `📍 ${data.eventLocation}`),
        ].filter(Boolean)),
        
        // Workload
        config.showWorkload && config.workloadHours > 0 && React.createElement('p', {
          key: 'workload',
          style: {
            fontSize: '13px',
            color: 'var(--cert-accent)',
            margin: '16px 0',
            fontStyle: 'italic',
          },
        }, `Carga horária: ${config.workloadHours} horas`),
        
        // Spacer
        React.createElement('div', { key: 'spacer', style: { flex: 1, minHeight: '24px' } }),
        
        // Bottom section with signature and seal
        React.createElement('div', {
          key: 'bottom',
          style: {
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            width: '100%',
            paddingTop: '24px',
            borderTop: '1px solid rgba(201, 162, 39, 0.3)',
          },
        }, [
          // Signature area
          config.showProducerSignature && React.createElement('div', {
            key: 'signature',
            style: { textAlign: 'center', flex: 1 },
          }, [
            React.createElement('div', {
              key: 'line',
              style: {
                width: '160px',
                height: '1px',
                background: 'var(--cert-primary)',
                margin: '0 auto 8px',
              },
            }),
            React.createElement('p', {
              key: 'label',
              style: { fontSize: '11px', color: 'var(--cert-text)', opacity: 0.6 },
            }, 'Assinatura do Organizador'),
            config.showProducerName && React.createElement('p', {
              key: 'name',
              style: { fontSize: '12px', fontWeight: 600, color: 'var(--cert-primary)', marginTop: '4px' },
            }, data.producerName),
          ]),
          
          // Wax seal simulation
          React.createElement('div', {
            key: 'seal',
            style: {
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 35%, #d4af37, #8b6914)',
              boxShadow: 'inset -3px -3px 8px rgba(0,0,0,0.3), 2px 2px 6px rgba(0,0,0,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            },
          }, React.createElement('div', {
            style: {
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            },
          }, React.createElement('span', {
            style: {
              fontSize: '24px',
              color: 'rgba(255,255,255,0.9)',
            },
          }, '✓'))),
          
          // Certificate code
          React.createElement('div', {
            key: 'code',
            style: { textAlign: 'center', flex: 1 },
          }, [
            React.createElement('p', {
              key: 'label',
              style: { fontSize: '10px', color: 'var(--cert-text)', opacity: 0.5, letterSpacing: '0.1em' },
            }, 'CÓDIGO DE VERIFICAÇÃO'),
            React.createElement('p', {
              key: 'value',
              style: { fontSize: '11px', fontFamily: 'monospace', color: 'var(--cert-primary)', marginTop: '4px' },
            }, data.certificateCode),
          ]),
        ]),
      ]),
    ]);
  },
};

// ============================================================
// Template 2: MODERN
// Minimalist, generous whitespace, bold typography
// Clean, contemporary, confident
// ============================================================

const ModernTemplate: CertificateTemplate = {
  id: 'modern',
  name: 'Modern',
  description: 'Minimalist design with generous whitespace and bold typography. Perfect for tech conferences, startups, and contemporary events.',
  category: 'modern',
  
  defaultColors: {
    primary: '#ea580b',     // TicketHall orange
    secondary: '#1f2937',   // Dark gray
    background: '#ffffff',  // Pure white
    text: '#111827',        // Near black
    accent: '#f97316',      // Bright orange
  },
  
  fonts: {
    title: '"Space Grotesk", system-ui, sans-serif',
    body: '"Inter", system-ui, sans-serif',
    titleWeights: '400;500;600;700',
    bodyWeights: '300;400;500;600',
  },
  
  layout: {
    aspectRatio: '297/210',
    padding: '40px 48px',
    hasDecorativeCorners: false,
    hasInnerBorder: false,
    contentAlignment: 'asymmetric',
  },
  
  googleFonts: [
    'Space Grotesk:400,500,600,700',
    'Inter:300,400,500,600',
  ],
  
  render: (data, config) => {
    const primaryColor = config.primaryColor || ModernTemplate.defaultColors.primary;
    const secondaryColor = config.secondaryColor || ModernTemplate.defaultColors.secondary;
    
    return React.createElement('div', {
      className: 'modern-certificate',
      style: {
        '--cert-primary': primaryColor,
        '--cert-secondary': secondaryColor,
        '--cert-bg': ModernTemplate.defaultColors.background,
        '--cert-text': ModernTemplate.defaultColors.text,
        '--cert-accent': ModernTemplate.defaultColors.accent,
        width: '100%',
        height: '100%',
        backgroundColor: 'var(--cert-bg)',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: ModernTemplate.fonts.body,
      } as React.CSSProperties,
    }, [
      // Geometric accent lines
      React.createElement('div', {
        key: 'geo-lines',
        style: {
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          overflow: 'hidden',
        },
      }, [
        // Top accent bar
        React.createElement('div', {
          key: 'top-bar',
          style: {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '40%',
            height: '8px',
            background: 'var(--cert-primary)',
          },
        }),
        
        // Side accent line
        React.createElement('div', {
          key: 'side-line',
          style: {
            position: 'absolute',
            top: '15%',
            left: '40px',
            width: '3px',
            height: '70%',
            background: 'linear-gradient(180deg, var(--cert-primary) 0%, transparent 100%)',
          },
        }),
        
        // Bottom right geometric shape
        React.createElement('svg', {
          key: 'bottom-geo',
          style: {
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: '200px',
            height: '200px',
            opacity: 0.05,
          },
          viewBox: '0 0 200 200',
          children: React.createElement('polygon', {
            points: '200,0 200,200 0,200',
            fill: 'var(--cert-primary)',
          }),
        }),
      ]),
      
      // Main content - asymmetric layout
      React.createElement('div', {
        key: 'content',
        style: {
          position: 'relative',
          zIndex: 1,
          height: '100%',
          display: 'grid',
          gridTemplateColumns: '1fr 320px',
          gap: '48px',
          padding: '48px 56px',
        },
      }, [
        // Left column - main content
        React.createElement('div', {
          key: 'left',
          style: {
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          },
        }, [
          // Small label
          React.createElement('p', {
            key: 'label',
            style: {
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.2em',
              textTransform: 'uppercase' as const,
              color: 'var(--cert-primary)',
              margin: '0 0 16px 0',
            },
          }, 'Certificado de Participação'),
          
          // Participant name - large and bold
          React.createElement('h1', {
            key: 'participant',
            style: {
              fontFamily: ModernTemplate.fonts.title,
              fontSize: '44px',
              fontWeight: 600,
              color: 'var(--cert-text)',
              margin: '0 0 24px 0',
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
            },
          }, data.participantName),
          
          // Event name
          React.createElement('p', {
            key: 'participated',
            style: {
              fontSize: '14px',
              color: 'var(--cert-text)',
              opacity: 0.6,
              margin: '0 0 8px 0',
            },
          }, 'Participou de'),
          
          React.createElement('h2', {
            key: 'event',
            style: {
              fontFamily: ModernTemplate.fonts.title,
              fontSize: '24px',
              fontWeight: 500,
              color: 'var(--cert-secondary)',
              margin: '0 0 32px 0',
              lineHeight: 1.3,
            },
          }, data.eventName),
          
          // Custom text if provided
          config.customText && React.createElement('p', {
            key: 'custom',
            style: {
              fontSize: '13px',
              color: 'var(--cert-text)',
              opacity: 0.7,
              margin: '0 0 24px 0',
              maxWidth: '400px',
              lineHeight: 1.6,
            },
          }, config.customText),
          
          // Workload badge
          config.showWorkload && config.workloadHours > 0 && React.createElement('div', {
            key: 'workload',
            style: {
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              background: 'rgba(234, 88, 11, 0.1)',
              borderRadius: '4px',
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--cert-primary)',
              width: 'fit-content',
            },
          }, [
            React.createElement('span', { key: 'icon' }, '⏱'),
            React.createElement('span', { key: 'text' }, `${config.workloadHours} horas de carga horária`),
          ]),
        ]),
        
        // Right column - details and verification
        React.createElement('div', {
          key: 'right',
          style: {
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            paddingLeft: '32px',
            borderLeft: '1px solid rgba(0,0,0,0.1)',
          },
        }, [
          // Logo
          config.showLogo && React.createElement('div', {
            key: 'logo',
            style: {
              marginBottom: '32px',
            },
          }, React.createElement('div', {
            style: {
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '16px',
              fontWeight: 700,
            },
          }, [
            React.createElement('span', { key: 'ticket', style: { color: 'var(--cert-text)' } }, 'TICKET'),
            React.createElement('span', { key: 'hall', style: { color: 'var(--cert-primary)' } }, 'HALL'),
          ])),
          
          // Event details
          React.createElement('div', {
            key: 'details',
            style: { marginBottom: 'auto', paddingTop: '48px' },
          }, [
            config.showEventDate && data.eventDate && React.createElement('div', {
              key: 'date',
              style: { marginBottom: '16px' },
            }, [
              React.createElement('p', {
                key: 'label',
                style: { fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'var(--cert-text)', opacity: 0.4, margin: '0 0 4px 0' },
              }, 'Data'),
              React.createElement('p', {
                key: 'value',
                style: { fontSize: '14px', fontWeight: 500, color: 'var(--cert-text)', margin: 0 },
              }, data.eventDate),
            ]),
            
            config.showEventTime && data.eventTime && React.createElement('div', {
              key: 'time',
              style: { marginBottom: '16px' },
            }, [
              React.createElement('p', {
                key: 'label',
                style: { fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'var(--cert-text)', opacity: 0.4, margin: '0 0 4px 0' },
              }, 'Horário'),
              React.createElement('p', {
                key: 'value',
                style: { fontSize: '14px', fontWeight: 500, color: 'var(--cert-text)', margin: 0 },
              }, data.eventTime),
            ]),
            
            config.showEventLocation && data.eventLocation && React.createElement('div', {
              key: 'location',
              style: { marginBottom: '16px' },
            }, [
              React.createElement('p', {
                key: 'label',
                style: { fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'var(--cert-text)', opacity: 0.4, margin: '0 0 4px 0' },
              }, 'Local'),
              React.createElement('p', {
                key: 'value',
                style: { fontSize: '14px', fontWeight: 500, color: 'var(--cert-text)', margin: 0, lineHeight: 1.4 },
              }, data.eventLocation),
            ]),
            
            config.showProducerName && data.producerName && React.createElement('div', {
              key: 'producer',
              style: { marginTop: '24px' },
            }, [
              React.createElement('p', {
                key: 'label',
                style: { fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'var(--cert-text)', opacity: 0.4, margin: '0 0 4px 0' },
              }, 'Organizador'),
              React.createElement('p', {
                key: 'value',
                style: { fontSize: '14px', fontWeight: 500, color: 'var(--cert-text)', margin: 0 },
              }, data.producerName),
            ]),
          ]),
          
          // Signature and verification
          React.createElement('div', {
            key: 'bottom',
            style: { marginTop: 'auto' },
          }, [
            config.showProducerSignature && React.createElement('div', {
              key: 'signature',
              style: { marginBottom: '24px' },
            }, [
              React.createElement('div', {
                key: 'line',
                style: {
                  width: '100%',
                  height: '1px',
                  background: 'linear-gradient(90deg, var(--cert-secondary), transparent)',
                  marginBottom: '8px',
                },
              }),
              React.createElement('p', {
                key: 'text',
                style: { fontSize: '11px', color: 'var(--cert-text)', opacity: 0.5, margin: 0 },
              }, 'Assinatura digital do organizador'),
            ]),
            
            // Verification code
            React.createElement('div', {
              key: 'verification',
              style: {
                padding: '12px',
                background: 'rgba(0,0,0,0.03)',
                borderRadius: '6px',
              },
            }, [
              React.createElement('p', {
                key: 'label',
                style: { fontSize: '9px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'var(--cert-text)', opacity: 0.4, margin: '0 0 4px 0' },
              }, 'Verificação'),
              React.createElement('p', {
                key: 'code',
                style: { fontSize: '11px', fontFamily: 'monospace', color: 'var(--cert-secondary)', margin: 0, letterSpacing: '0.05em' },
              }, data.certificateCode),
              data.verificationUrl && React.createElement('p', {
                key: 'url',
                style: { fontSize: '9px', color: 'var(--cert-text)', opacity: 0.4, margin: '4px 0 0 0' },
              }, 'tickethall.com.br/verificar'),
            ]),
          ]),
        ]),
      ]),
    ]);
  },
};

// ============================================================
// Template 3: ACADEMIC
// Traditional academic, classic serifs
// Scholarly, timeless, authoritative
// ============================================================

const AcademicTemplate: CertificateTemplate = {
  id: 'academic',
  name: 'Academic',
  description: 'Traditional academic design with classic serifs and decorative crest. Perfect for educational institutions, workshops, and scholarly events.',
  category: 'traditional',
  
  defaultColors: {
    primary: '#064e3b',     // Forest green
    secondary: '#d4af37',   // Academic gold
    background: '#fefdf9',  // Warm white
    text: '#1c1917',        // Stone black
    accent: '#065f46',      // Darker green
  },
  
  fonts: {
    title: '"Cormorant Garamond", Georgia, serif',
    body: '"Lora", Georgia, serif',
    titleWeights: '400;500;600;700',
    bodyWeights: '400;500;600',
  },
  
  layout: {
    aspectRatio: '297/210',
    padding: '48px 64px',
    hasDecorativeCorners: true,
    hasInnerBorder: true,
    contentAlignment: 'center',
  },
  
  googleFonts: [
    'Cormorant Garamond:400,500,600,700',
    'Lora:400,500,600',
  ],
  
  render: (data, config) => {
    const primaryColor = config.primaryColor || AcademicTemplate.defaultColors.primary;
    const secondaryColor = config.secondaryColor || AcademicTemplate.defaultColors.secondary;
    
    return React.createElement('div', {
      className: 'academic-certificate',
      style: {
        '--cert-primary': primaryColor,
        '--cert-secondary': secondaryColor,
        '--cert-bg': AcademicTemplate.defaultColors.background,
        '--cert-text': AcademicTemplate.defaultColors.text,
        '--cert-accent': AcademicTemplate.defaultColors.accent,
        width: '100%',
        height: '100%',
        backgroundColor: 'var(--cert-bg)',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: AcademicTemplate.fonts.body,
      } as React.CSSProperties,
    }, [
      // Classic double border
      React.createElement('div', {
        key: 'outer-border',
        style: {
          position: 'absolute',
          inset: '16px',
          border: '2px solid var(--cert-primary)',
          pointerEvents: 'none',
        },
      }),
      
      React.createElement('div', {
        key: 'inner-border',
        style: {
          position: 'absolute',
          inset: '22px',
          border: '1px solid var(--cert-secondary)',
          pointerEvents: 'none',
        },
      }),
      
      // Corner medallions
      ...[
        { pos: { top: 24, left: 24 } },
        { pos: { top: 24, right: 24 } },
        { pos: { bottom: 24, right: 24 } },
        { pos: { bottom: 24, left: 24 } },
      ].map((corner, i) => React.createElement('div', {
        key: `medallion-${i}`,
        style: {
          position: 'absolute',
          width: 12,
          height: 12,
          borderRadius: '50%',
          background: 'var(--cert-secondary)',
          ...corner.pos,
          pointerEvents: 'none',
        },
      })),
      
      // Decorative header line
      React.createElement('div', {
        key: 'header-line',
        style: {
          position: 'absolute',
          top: '60px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '200px',
          height: '2px',
          background: 'linear-gradient(90deg, transparent, var(--cert-secondary), transparent)',
          pointerEvents: 'none',
        },
      }),
      
      // Main content - symmetrical centered layout
      React.createElement('div', {
        key: 'content',
        style: {
          position: 'relative',
          zIndex: 1,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          padding: '56px 80px 48px',
        },
      }, [
        // Institution/Logo area
        config.showLogo && React.createElement('div', {
          key: 'institution',
          style: { marginBottom: '20px' },
        }, React.createElement('div', {
          style: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            padding: '8px 20px',
            border: '1px solid var(--cert-primary)',
            borderRadius: '2px',
          },
        }, [
          React.createElement('span', {
            key: 'ticket',
            style: { fontSize: '12px', letterSpacing: '0.15em', color: 'var(--cert-text)', fontWeight: 500 },
          }, 'TICKET'),
          React.createElement('span', {
            key: 'divider',
            style: { width: 1, height: 12, background: 'var(--cert-secondary)' },
          }),
          React.createElement('span', {
            key: 'hall',
            style: { fontSize: '12px', letterSpacing: '0.15em', color: 'var(--cert-primary)', fontWeight: 500 },
          }, 'HALL'),
        ])),
        
        // Decorative crest/shield area
        React.createElement('div', {
          key: 'crest',
          style: {
            width: '80px',
            height: '80px',
            margin: '0 auto 20px',
            position: 'relative',
          },
        }, [
          // Shield shape
          React.createElement('svg', {
            key: 'shield',
            viewBox: '0 0 100 120',
            style: {
              width: '100%',
              height: '100%',
            },
            children: [
              React.createElement('path', {
                key: 'shield-path',
                d: 'M50 0 L100 20 L100 50 Q100 90 50 120 Q0 90 0 50 L0 20 Z',
                fill: 'var(--cert-primary)',
                opacity: 0.1,
              }),
              React.createElement('path', {
                key: 'shield-border',
                d: 'M50 5 L95 23 L95 50 Q95 87 50 115 Q5 87 5 50 L5 23 Z',
                fill: 'none',
                stroke: 'var(--cert-primary)',
                strokeWidth: 2,
              }),
              // Laurel branches inside shield
              React.createElement('path', {
                key: 'laurel-left',
                d: 'M30 60 Q25 50 35 45 M35 65 Q30 55 40 50 M40 70 Q35 60 45 55',
                fill: 'none',
                stroke: 'var(--cert-primary)',
                strokeWidth: 1.5,
                strokeLinecap: 'round',
              }),
              React.createElement('path', {
                key: 'laurel-right',
                d: 'M70 60 Q75 50 65 45 M65 65 Q70 55 60 50 M60 70 Q65 60 55 55',
                fill: 'none',
                stroke: 'var(--cert-primary)',
                strokeWidth: 1.5,
                strokeLinecap: 'round',
              }),
            ],
          }),
          // Star at top
          React.createElement('div', {
            key: 'star',
            style: {
              position: 'absolute',
              top: '20%',
              left: '50%',
              transform: 'translateX(-50%)',
              color: 'var(--cert-secondary)',
              fontSize: '16px',
            },
          }, '★'),
        ]),
        
        // Certificate title
        React.createElement('h1', {
          key: 'title',
          style: {
            fontFamily: AcademicTemplate.fonts.title,
            fontSize: '36px',
            fontWeight: 600,
            color: 'var(--cert-primary)',
            margin: '0 0 8px 0',
            letterSpacing: '0.08em',
          },
        }, 'CERTIFICADO'),
        
        React.createElement('p', {
          key: 'subtitle',
          style: {
            fontSize: '13px',
            fontStyle: 'italic',
            color: 'var(--cert-text)',
            opacity: 0.7,
            margin: '0 0 32px 0',
          },
        }, 'de Participação no Evento'),
        
        // Main text
        React.createElement('div', {
          key: 'main-text',
          style: {
            maxWidth: '600px',
            margin: '0 auto 32px',
          },
        }, [
          React.createElement('p', {
            key: 'intro',
            style: {
              fontSize: '14px',
              color: 'var(--cert-text)',
              lineHeight: 1.8,
              margin: '0 0 16px 0',
            },
          }, config.customText || 'Certificamos que'),
          
          // Participant name - prominent
          React.createElement('h2', {
            key: 'participant',
            style: {
              fontFamily: AcademicTemplate.fonts.title,
              fontSize: '36px',
              fontWeight: 600,
              color: 'var(--cert-text)',
              margin: '16px 0',
              padding: '16px 0',
              borderTop: '1px solid var(--cert-secondary)',
              borderBottom: '1px solid var(--cert-secondary)',
            },
          }, data.participantName),
          
          React.createElement('p', {
            key: 'participated-text',
            style: {
              fontSize: '14px',
              color: 'var(--cert-text)',
              lineHeight: 1.8,
              margin: '16px 0 0 0',
            },
          }, 'participou do evento'),
          
          React.createElement('h3', {
            key: 'event-name',
            style: {
              fontFamily: AcademicTemplate.fonts.title,
              fontSize: '24px',
              fontWeight: 600,
              color: 'var(--cert-primary)',
              margin: '12px 0 8px 0',
            },
          }, data.eventName),
        ]),
        
        // Event details in elegant row
        React.createElement('div', {
          key: 'details',
          style: {
            display: 'flex',
            justifyContent: 'center',
            gap: '40px',
            margin: '24px 0',
            fontSize: '13px',
            color: 'var(--cert-text)',
          },
        }, [
          config.showEventDate && data.eventDate && React.createElement('div', { key: 'date' }, [
            React.createElement('span', { key: 'label', style: { fontStyle: 'italic', opacity: 0.6 } }, 'Data: '),
            React.createElement('span', { key: 'value', style: { fontWeight: 500 } }, data.eventDate),
          ]),
          config.showEventTime && data.eventTime && React.createElement('div', { key: 'time' }, [
            React.createElement('span', { key: 'label', style: { fontStyle: 'italic', opacity: 0.6 } }, 'Horário: '),
            React.createElement('span', { key: 'value', style: { fontWeight: 500 } }, data.eventTime),
          ]),
          config.showEventLocation && data.eventLocation && React.createElement('div', { key: 'location' }, [
            React.createElement('span', { key: 'label', style: { fontStyle: 'italic', opacity: 0.6 } }, 'Local: '),
            React.createElement('span', { key: 'value', style: { fontWeight: 500 } }, data.eventLocation),
          ]),
        ].filter(Boolean)),
        
        // Workload
        config.showWorkload && config.workloadHours > 0 && React.createElement('p', {
          key: 'workload',
          style: {
            fontSize: '13px',
            fontStyle: 'italic',
            color: 'var(--cert-accent)',
            margin: '16px 0 24px',
          },
        }, `com carga horária total de ${config.workloadHours} horas`),
        
        // Spacer
        React.createElement('div', { key: 'spacer', style: { flex: 1 } }),
        
        // Bottom section with signature and seals
        React.createElement('div', {
          key: 'footer',
          style: {
            width: '100%',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            paddingTop: '24px',
            borderTop: '1px solid rgba(6, 78, 59, 0.2)',
          },
        }, [
          // Left: Date and location
          React.createElement('div', {
            key: 'left',
            style: { textAlign: 'left', fontSize: '12px', color: 'var(--cert-text)', opacity: 0.7 },
          }, [
            config.showProducerName && React.createElement('p', { key: 'producer', style: { margin: '0 0 4px 0' } }, [
              React.createElement('span', { key: 'label' }, 'Organização: '),
              React.createElement('span', { key: 'value', style: { fontWeight: 500 } }, data.producerName),
            ]),
            React.createElement('p', { key: 'url', style: { margin: 0 } }, 'tickethall.com.br'),
          ]),
          
          // Center: Signature
          config.showProducerSignature && React.createElement('div', {
            key: 'signature',
            style: { textAlign: 'center' },
          }, [
            React.createElement('div', {
              key: 'line',
              style: {
                width: '180px',
                height: '1px',
                background: 'var(--cert-text)',
                margin: '0 auto 8px',
                opacity: 0.4,
              },
            }),
            React.createElement('p', {
              key: 'label',
              style: { fontSize: '11px', fontStyle: 'italic', color: 'var(--cert-text)', opacity: 0.6, margin: 0 },
            }, 'Assinatura do Organizador'),
          ]),
          
          // Right: Certificate code
          React.createElement('div', {
            key: 'right',
            style: { textAlign: 'right' },
          }, [
            React.createElement('div', {
              key: 'seal',
              style: {
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                border: '2px solid var(--cert-secondary)',
                marginBottom: '8px',
              },
            }, React.createElement('span', { style: { fontSize: '20px', color: 'var(--cert-secondary)' } }, '✓')),
            React.createElement('p', {
              key: 'label',
              style: { fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'var(--cert-text)', opacity: 0.5, margin: '0 0 4px 0' },
            }, 'Registro'),
            React.createElement('p', {
              key: 'code',
              style: { fontSize: '10px', fontFamily: 'monospace', color: 'var(--cert-primary)', margin: 0 },
            }, data.certificateCode),
          ]),
        ]),
      ]),
    ]);
  },
};

// ============================================================
// Template 4: CREATIVE
// Bold gradients, organic shapes, diagonal flow
// Energetic, artistic, youthful
// ============================================================

const CreativeTemplate: CertificateTemplate = {
  id: 'creative',
  name: 'Creative',
  description: 'Bold design with soft gradients, organic shapes, and diagonal flow. Perfect for music festivals, creative workshops, and youth events.',
  category: 'creative',
  
  defaultColors: {
    primary: '#581c87',     // Deep purple
    secondary: '#f97316',   // Coral/orange
    background: '#faf5ff',  // Very light purple
    text: '#3b0764',        // Dark purple
    accent: '#c2410c',      // Burnt orange
  },
  
  fonts: {
    title: '"Clash Display", "Impact", system-ui, sans-serif',
    body: '"Satoshi", "Inter", system-ui, sans-serif',
    titleWeights: '400;500;600;700',
    bodyWeights: '300;400;500;700',
  },
  
  layout: {
    aspectRatio: '297/210',
    padding: '32px 40px',
    hasDecorativeCorners: false,
    hasInnerBorder: false,
    contentAlignment: 'asymmetric',
  },
  
  googleFonts: [
    // Note: Clash Display is not on Google Fonts, would need to be loaded separately
    // Using fallback to Impact/system fonts
    'Inter:300,400,500,700',
  ],
  
  render: (data, config) => {
    const primaryColor = config.primaryColor || CreativeTemplate.defaultColors.primary;
    const secondaryColor = config.secondaryColor || CreativeTemplate.defaultColors.secondary;
    
    return React.createElement('div', {
      className: 'creative-certificate',
      style: {
        '--cert-primary': primaryColor,
        '--cert-secondary': secondaryColor,
        '--cert-bg': CreativeTemplate.defaultColors.background,
        '--cert-text': CreativeTemplate.defaultColors.text,
        '--cert-accent': CreativeTemplate.defaultColors.accent,
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, var(--cert-bg) 0%, #fff 50%, #fff0f5 100%)',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: CreativeTemplate.fonts.body,
      } as React.CSSProperties,
    }, [
      // Background organic shapes
      React.createElement('div', {
        key: 'shapes',
        style: {
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
        },
      }, [
        // Large organic blob top right
        React.createElement('div', {
          key: 'blob1',
          style: {
            position: 'absolute',
            top: '-10%',
            right: '-5%',
            width: '350px',
            height: '350px',
            borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
            background: `linear-gradient(135deg, ${primaryColor}15, ${secondaryColor}10)`,
            filter: 'blur(40px)',
            animation: 'float 8s ease-in-out infinite',
          },
        }),
        
        // Medium blob bottom left
        React.createElement('div', {
          key: 'blob2',
          style: {
            position: 'absolute',
            bottom: '-15%',
            left: '-10%',
            width: '400px',
            height: '400px',
            borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%',
            background: `linear-gradient(225deg, ${secondaryColor}12, ${primaryColor}08)`,
            filter: 'blur(50px)',
          },
        }),
        
        // Small accent blob center-right
        React.createElement('div', {
          key: 'blob3',
          style: {
            position: 'absolute',
            top: '40%',
            right: '15%',
            width: '150px',
            height: '150px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${secondaryColor}20, transparent)`,
            filter: 'blur(30px)',
          },
        }),
        
        // Diagonal decorative line
        React.createElement('svg', {
          key: 'diagonal',
          style: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '40%',
            opacity: 0.1,
          },
          preserveAspectRatio: 'none',
          viewBox: '0 0 1000 400',
          children: React.createElement('path', {
            d: 'M0,400 L400,0 L450,0 L50,400 Z',
            fill: primaryColor,
          }),
        }),
      ]),
      
      // Floating decorative elements
      React.createElement('div', {
        key: 'floating',
        style: {
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
        },
      }, [
        // Stars/sparkles
        ...[
          { top: '15%', left: '8%', size: 16 },
          { top: '25%', right: '12%', size: 12 },
          { bottom: '30%', left: '15%', size: 20 },
          { top: '60%', right: '8%', size: 14 },
        ].map((star, i) => React.createElement('div', {
          key: `star-${i}`,
          style: {
            position: 'absolute',
            ...Object.fromEntries(Object.entries(star).map(([k, v]) => [k, typeof v === 'number' ? `${v}px` : v])),
            color: secondaryColor,
            fontSize: star.size,
            opacity: 0.6,
          },
        }, '✦')),
        
        // Small circles
        ...[
          { top: '20%', left: '20%', size: 8 },
          { bottom: '25%', right: '25%', size: 12 },
          { top: '70%', left: '10%', size: 6 },
        ].map((circle, i) => React.createElement('div', {
          key: `circle-${i}`,
          style: {
            position: 'absolute',
            ...Object.fromEntries(Object.entries(circle).map(([k, v]) => [k, typeof v === 'number' ? `${v}px` : v])),
            width: circle.size,
            height: circle.size,
            borderRadius: '50%',
            background: primaryColor,
            opacity: 0.3,
          },
        })),
      ]),
      
      // Main content container
      React.createElement('div', {
        key: 'content',
        style: {
          position: 'relative',
          zIndex: 1,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '40px 48px',
        },
      }, [
        // Header with logo and verification
        React.createElement('div', {
          key: 'header',
          style: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '24px',
          },
        }, [
          // Logo
          config.showLogo && React.createElement('div', {
            key: 'logo',
            style: {
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              background: 'rgba(88, 28, 135, 0.08)',
              borderRadius: '50px',
            },
          }, [
            React.createElement('span', {
              key: 'ticket',
              style: { fontSize: '14px', fontWeight: 700, color: primaryColor },
            }, 'TICKET'),
            React.createElement('span', {
              key: 'hall',
              style: { fontSize: '14px', fontWeight: 700, color: secondaryColor },
            }, 'HALL'),
          ]),
          
          // Certificate badge
          React.createElement('div', {
            key: 'badge',
            style: {
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 14px',
              background: 'linear-gradient(135deg, var(--cert-primary), var(--cert-accent))',
              borderRadius: '50px',
              color: 'white',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase' as const,
            },
          }, [
            React.createElement('span', { key: 'icon' }, '✓'),
            React.createElement('span', { key: 'text' }, 'Certificado'),
          ]),
        ]),
        
        // Main content area - diagonal flow
        React.createElement('div', {
          key: 'main',
          style: {
            flex: 1,
            display: 'grid',
            gridTemplateColumns: '1.2fr 0.8fr',
            gap: '40px',
            alignItems: 'center',
          },
        }, [
          // Left side - main info
          React.createElement('div', { key: 'left' }, [
            // Label with gradient
            React.createElement('div', {
              key: 'label',
              style: {
                display: 'inline-block',
                padding: '6px 14px',
                background: 'linear-gradient(90deg, var(--cert-primary), var(--cert-accent))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.15em',
                textTransform: 'uppercase' as const,
                marginBottom: '16px',
              },
            }, 'Participação'),
            
            // Participant name - large and bold
            React.createElement('h1', {
              key: 'participant',
              style: {
                fontFamily: CreativeTemplate.fonts.title,
                fontSize: '48px',
                fontWeight: 700,
                color: primaryColor,
                margin: '0 0 8px 0',
                lineHeight: 1.05,
                letterSpacing: '-0.02em',
                textShadow: '2px 2px 0 rgba(249, 115, 22, 0.1)',
              },
            }, data.participantName),
            
            // "is certified for" text
            React.createElement('p', {
              key: 'is-certified',
              style: {
                fontSize: '15px',
                color: secondaryColor,
                fontWeight: 500,
                margin: '0 0 16px 0',
              },
            }, 'está certificado por participar de'),
            
            // Event name with gradient underline
            React.createElement('div', { key: 'event-wrapper', style: { position: 'relative', display: 'inline-block' } }, [
              React.createElement('h2', {
                key: 'event',
                style: {
                  fontFamily: CreativeTemplate.fonts.title,
                  fontSize: '28px',
                  fontWeight: 600,
                  color: primaryColor,
                  margin: 0,
                  lineHeight: 1.2,
                },
              }, data.eventName),
              React.createElement('div', {
                key: 'underline',
                style: {
                  position: 'absolute',
                  bottom: '-4px',
                  left: 0,
                  width: '60%',
                  height: '4px',
                  background: 'linear-gradient(90deg, var(--cert-secondary), transparent)',
                  borderRadius: '2px',
                },
              }),
            ]),
            
            // Custom text
            config.customText && React.createElement('p', {
              key: 'custom',
              style: {
                fontSize: '14px',
                color: primaryColor,
                opacity: 0.8,
                margin: '24px 0 0 0',
                maxWidth: '400px',
                lineHeight: 1.6,
              },
            }, config.customText),
          ]),
          
          // Right side - details card
          React.createElement('div', {
            key: 'right',
            style: {
              background: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(10px)',
              borderRadius: '20px',
              padding: '28px',
              boxShadow: '0 8px 32px rgba(88, 28, 135, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.5)',
            },
          }, [
            // Details grid
            React.createElement('div', {
              key: 'details',
              style: { display: 'grid', gap: '16px' },
            }, [
              config.showEventDate && data.eventDate && React.createElement('div', { key: 'date' }, [
                React.createElement('p', {
                  key: 'label',
                  style: { fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: secondaryColor, margin: '0 0 4px 0' },
                }, '📅 Data'),
                React.createElement('p', {
                  key: 'value',
                  style: { fontSize: '15px', fontWeight: 600, color: primaryColor, margin: 0 },
                }, data.eventDate),
              ]),
              
              config.showEventTime && data.eventTime && React.createElement('div', { key: 'time' }, [
                React.createElement('p', {
                  key: 'label',
                  style: { fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: secondaryColor, margin: '0 0 4px 0' },
                }, '🕐 Horário'),
                React.createElement('p', {
                  key: 'value',
                  style: { fontSize: '15px', fontWeight: 600, color: primaryColor, margin: 0 },
                }, data.eventTime),
              ]),
              
              config.showEventLocation && data.eventLocation && React.createElement('div', { key: 'location' }, [
                React.createElement('p', {
                  key: 'label',
                  style: { fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: secondaryColor, margin: '0 0 4px 0' },
                }, '📍 Local'),
                React.createElement('p', {
                  key: 'value',
                  style: { fontSize: '15px', fontWeight: 600, color: primaryColor, margin: 0, lineHeight: 1.4 },
                }, data.eventLocation),
              ]),
              
              config.showWorkload && config.workloadHours > 0 && React.createElement('div', {
                key: 'workload',
                style: {
                  padding: '12px',
                  background: 'linear-gradient(135deg, rgba(88, 28, 135, 0.08), rgba(249, 115, 22, 0.08))',
                  borderRadius: '12px',
                  marginTop: '8px',
                },
              }, [
                React.createElement('p', {
                  key: 'label',
                  style: { fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: secondaryColor, margin: '0 0 4px 0' },
                }, '⏱ Carga Horária'),
                React.createElement('p', {
                  key: 'value',
                  style: { fontSize: '20px', fontWeight: 700, color: primaryColor, margin: 0 },
                }, `${config.workloadHours}h`),
              ]),
            ].filter(Boolean)),
          ]),
        ]),
        
        // Footer with signature and verification
        React.createElement('div', {
          key: 'footer',
          style: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginTop: 'auto',
            paddingTop: '24px',
          },
        }, [
          // Signature
          config.showProducerSignature && React.createElement('div', {
            key: 'signature',
            style: { flex: 1 },
          }, [
            config.showProducerName && React.createElement('p', {
              key: 'name',
              style: { fontSize: '14px', fontWeight: 600, color: primaryColor, margin: '0 0 8px 0' },
            }, data.producerName),
            React.createElement('div', {
              key: 'line',
              style: {
                width: '140px',
                height: '3px',
                background: 'linear-gradient(90deg, var(--cert-secondary), transparent)',
                borderRadius: '2px',
                marginBottom: '6px',
              },
            }),
            React.createElement('p', {
              key: 'label',
              style: { fontSize: '11px', color: primaryColor, opacity: 0.6, margin: 0 },
            }, 'Organizador'),
          ]),
          
          // Verification code
          React.createElement('div', {
            key: 'verification',
            style: {
              textAlign: 'right',
            },
          }, [
            React.createElement('div', {
              key: 'qr-placeholder',
              style: {
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '60px',
                height: '60px',
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(88, 28, 135, 0.1)',
                marginBottom: '8px',
                fontSize: '24px',
              },
            }, '◻'),
            React.createElement('p', {
              key: 'label',
              style: { fontSize: '9px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: primaryColor, opacity: 0.5, margin: '0 0 4px 0' },
            }, 'Verificação'),
            React.createElement('p', {
              key: 'code',
              style: { fontSize: '11px', fontFamily: 'monospace', fontWeight: 600, color: primaryColor, margin: 0, letterSpacing: '0.05em' },
            }, data.certificateCode),
          ]),
        ]),
      ]),
    ]);
  },
};

// ============================================================
// Export Certificate Templates Array
// ============================================================

export const CERTIFICATE_TEMPLATES: CertificateTemplate[] = [
  ExecutiveTemplate,
  ModernTemplate,
  AcademicTemplate,
  CreativeTemplate,
];

// Helper to get template by ID
export function getCertificateTemplate(id: CertificateTemplateId): CertificateTemplate {
  const template = CERTIFICATE_TEMPLATES.find(t => t.id === id);
  if (!template) {
    throw new Error(`Certificate template "${id}" not found`);
  }
  return template;
}

// Helper to get default colors for a template
export function getTemplateDefaultColors(id: CertificateTemplateId): CertificateColorConfig {
  return getCertificateTemplate(id).defaultColors;
}

// Helper to generate Google Fonts URL for a template
export function getTemplateFontsUrl(id: CertificateTemplateId): string {
  const template = getCertificateTemplate(id);
  const families = template.googleFonts.join('&family=');
  return `https://fonts.googleapis.com/css2?family=${families}&display=swap`;
}

// Helper to render a certificate with the specified template
export function renderCertificate(
  templateId: CertificateTemplateId,
  data: CertificateData,
  config: CertificateConfig
): React.ReactNode {
  const template = getCertificateTemplate(templateId);
  return template.render(data, config);
}

// Default certificate configuration
export const DEFAULT_CERTIFICATE_CONFIG: CertificateConfig = {
  showEventDate: true,
  showEventTime: false,
  showEventLocation: true,
  showWorkload: false,
  workloadHours: 0,
  showProducerName: true,
  showProducerSignature: true,
  customText: null,
  template: 'executive',
  primaryColor: null,
  secondaryColor: null,
  showLogo: true,
};

// Sample certificate data for previews
export const SAMPLE_CERTIFICATE_DATA: CertificateData = {
  participantName: 'Maria Silva Santos',
  eventName: 'Conferência de Inovação e Tecnologia 2024',
  eventDate: '15 de Março de 2024',
  eventTime: '09:00 - 18:00',
  eventLocation: 'São Paulo, SP',
  producerName: 'TechEvents Brasil',
  certificateCode: 'CERT-2024-03-15-78432',
  workloadHours: 8,
  verificationUrl: 'https://tickethall.com.br/verificar',
};

// Color utilities for certificate theming
export const ColorUtils = {
  /**
   * Generate CSS custom properties for certificate theming
   */
  generateCssVariables(primaryColor: string, secondaryColor: string): Record<string, string> {
    return {
      '--cert-primary': primaryColor,
      '--cert-secondary': secondaryColor,
    };
  },

  /**
   * Darken a color by a percentage
   */
  darken(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max((num >> 16) - amt, 0);
    const G = Math.max((num >> 8 & 0x00FF) - amt, 0);
    const B = Math.max((num & 0x0000FF) - amt, 0);
    return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
  },

  /**
   * Lighten a color by a percentage
   */
  lighten(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min((num >> 16) + amt, 255);
    const G = Math.min((num >> 8 & 0x00FF) + amt, 255);
    const B = Math.min((num & 0x0000FF) + amt, 255);
    return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
  },

  /**
   * Convert hex to rgba
   */
  hexToRgba(color: string, alpha: number): string {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  },
};
