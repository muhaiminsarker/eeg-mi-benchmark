export default function ClassifyPage() {
  const pipelineSteps = [
    {
      step: '01',
      name: 'Epoching',
      desc: 'Segment continuous EEG into trials around cue onset',
      detail: '[−0.5, 2.5] s · 22 channels · 288 trials',
    },
    {
      step: '02',
      name: 'Bandpass',
      desc: 'Isolate motor-relevant oscillatory content',
      detail: '8–30 Hz · 4th-order Butterworth',
    },
    {
      step: '03',
      name: 'CSP',
      desc: 'Learn spatial filters that maximize class variance ratio',
      detail: '6 components (3 per class) · supervised',
    },
    {
      step: '04',
      name: 'Log-Variance',
      desc: 'Extract ERD features from filtered signals',
      detail: 'log(var(Xw)) · one scalar per component',
    },
    {
      step: '05',
      name: 'LDA',
      desc: 'Linear classifier in feature space',
      detail: 'Shrinkage regularization · 5-fold CV',
    },
  ]

  return (
    <main style={{ padding: '48px 0 64px', minHeight: 'calc(100vh - 80px)' }}>
      {/* Week tag */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
        <div style={{ width: 32, height: 1, background: 'var(--accent)' }} />
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.25em' }}>
          Week 02
        </span>
      </div>

      {/* Hero heading */}
      <div style={{ marginBottom: 48 }}>
        <h1 style={{
          fontFamily: 'var(--mono)',
          fontWeight: 700,
          color: 'var(--text)',
          lineHeight: 1,
          margin: 0,
          fontSize: 'clamp(48px, 8vw, 88px)',
          letterSpacing: '-0.02em',
        }}>
          CSP +
        </h1>
        <h1 style={{
          fontFamily: 'var(--mono)',
          fontWeight: 700,
          lineHeight: 1,
          margin: 0,
          fontSize: 'clamp(48px, 8vw, 88px)',
          letterSpacing: '-0.02em',
          color: 'var(--accent)',
        }}>
          LDA
        </h1>
        <p style={{ fontFamily: 'var(--mono)', color: 'var(--text-muted)', marginTop: 16, fontSize: 13, letterSpacing: '0.04em' }}>
          Common Spatial Patterns + Linear Discriminant Analysis
        </p>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'var(--border)', marginBottom: 40 }} />

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 48 }}>
        {[
          { label: 'Method', value: 'Supervised' },
          { label: 'Input', value: 'Covariance matrices' },
          { label: 'Output', value: 'Class probabilities' },
          { label: 'Status', value: 'Week 2 · Active' },
        ].map(({ label, value }) => (
          <div key={label}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 6 }}>
              {label}
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--text)', letterSpacing: '0.02em' }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Classes */}
      <div style={{ marginBottom: 48 }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 12 }}>
          Motor Imagery Classes
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { label: 'Left hand', color: 'var(--c3)', border: 'rgba(100,149,237,0.35)' },
            { label: 'Right hand', color: 'var(--c4)', border: 'rgba(237,100,100,0.35)' },
            { label: 'Feet', color: 'var(--cz)', border: 'rgba(100,200,150,0.35)' },
            { label: 'Tongue', color: 'var(--text-dim)', border: 'var(--border-hi)' },
          ].map(({ label, color, border }) => (
            <div key={label} style={{
              padding: '8px 14px',
              border: `1px solid ${border}`,
              borderRadius: 8,
              fontFamily: 'var(--mono)',
              fontSize: 12,
              color,
              background: 'var(--bg-2)',
            }}>
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Pipeline diagram */}
      <div style={{ marginBottom: 48 }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 16 }}>
          Pipeline
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {pipelineSteps.map(({ step, name, desc, detail }, i) => (
            <div key={step} style={{ display: 'flex', gap: 0 }}>
              {/* Left rail */}
              <div style={{ width: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  border: '1px solid var(--border-hi)',
                  background: 'var(--card)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--mono)',
                  fontSize: 9,
                  color: 'var(--accent)',
                  letterSpacing: '0.05em',
                  flexShrink: 0,
                  zIndex: 1,
                }}>
                  {step}
                </div>
                {i < pipelineSteps.length - 1 && (
                  <div style={{ flex: 1, width: 1, background: 'var(--border)', minHeight: 32 }} />
                )}
              </div>
              {/* Content */}
              <div style={{ paddingLeft: 16, paddingBottom: i < pipelineSteps.length - 1 ? 28 : 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{name}</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>{detail}</span>
                </div>
                <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-dim)', margin: 0, lineHeight: 1.6 }}>
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CSP intuition */}
      <div style={{ marginBottom: 48, border: '1px solid var(--border)', borderRadius: 8, padding: '20px 24px', background: 'var(--card)' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 12 }}>
          Intuition
        </div>
        <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-dim)', margin: 0, lineHeight: 1.8, maxWidth: 680 }}>
          CSP finds spatial filters <span style={{ color: 'var(--text)', fontWeight: 600 }}>W</span> such that the variance of{' '}
          <span style={{ color: 'var(--accent)' }}>W<sup>T</sup>X</span> is maximized for one class and minimized for the other.
          For left-hand MI, the optimal filter activates contralateral motor cortex (C4) and suppresses ipsilateral (C3) —
          exploiting the lateralized ERD signature. LDA then draws a hyperplane through the resulting 6D log-variance feature space.
        </p>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'var(--border)', marginBottom: 32 }} />

      {/* References */}
      <div>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.2em', display: 'block', marginBottom: 16 }}>
          References
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            {
              tag: '3.1',
              cite: 'Blankertz et al. (2008). Optimizing Spatial Filters for Robust EEG Single-Trial Analysis.',
              journal: 'IEEE Signal Processing Magazine, 25(1), 41–56.',
            },
            {
              tag: '3.2',
              cite: 'Ang et al. (2008). Filter Bank Common Spatial Pattern.',
              journal: 'IEEE IJCNN, 2390–2397.',
            },
          ].map(({ tag, cite, journal }) => (
            <div key={tag} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', borderLeft: '1px solid var(--border)', paddingLeft: 16 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)', flexShrink: 0, marginTop: 2, letterSpacing: '0.05em' }}>
                §{tag}
              </span>
              <div>
                <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-dim)', fontStyle: 'italic', lineHeight: 1.65, margin: '0 0 2px' }}>
                  {cite}
                </p>
                <p style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)', margin: 0, letterSpacing: '0.03em' }}>
                  {journal}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
