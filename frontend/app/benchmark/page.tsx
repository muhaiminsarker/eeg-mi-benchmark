export default function BenchmarkPage() {
  return (
    <main style={{ padding: '48px 0 64px', minHeight: 'calc(100vh - 80px)' }}>
      {/* Week tag */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
        <div style={{ width: 32, height: 1, background: 'var(--accent)' }} />
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.25em' }}>
          Week 03
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
          Pipeline
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
          Benchmark
        </h1>
        <p style={{ fontFamily: 'var(--mono)', color: 'var(--text-muted)', marginTop: 16, fontSize: 13, letterSpacing: '0.04em' }}>
          CSP+LDA vs Riemannian geometry across 3 MI datasets
        </p>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'var(--border)', marginBottom: 40 }} />

      {/* Pipelines table */}
      <div style={{ marginBottom: 48 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.2em', display: 'block', marginBottom: 16 }}>
          Pipelines
        </span>
        <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
          {[
            { name: 'CSP + LDA', type: 'Classical', status: 'Week 2' },
            { name: 'Covariances → Tangent Space → LDA', type: 'Riemannian', status: 'Week 3' },
            { name: 'EEGNet (shallow ConvNet)', type: 'Deep learning', status: 'Week 4+' },
          ].map(({ name, type, status }, i) => (
            <div key={name} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 18px',
              borderTop: i > 0 ? '1px solid var(--border)' : 'none',
              background: 'var(--card)',
              fontFamily: 'var(--mono)',
            }}>
              <span style={{ fontSize: 13, color: 'var(--text)' }}>{name}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                <span style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.05em' }}>{type}</span>
                <span style={{
                  fontSize: 10,
                  color: 'var(--text-muted)',
                  letterSpacing: '0.1em',
                  padding: '3px 10px',
                  border: '1px solid var(--border-hi)',
                  borderRadius: 6,
                }}>
                  {status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Datasets */}
      <div style={{ marginBottom: 48 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.2em', display: 'block', marginBottom: 16 }}>
          Datasets
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { id: 'BNCI2014001', desc: 'BCI Competition IV 2a', subjects: 9, classes: '4-class MI', active: true },
            { id: 'PhysioNet MI', desc: 'EEG Motor Movement', subjects: 109, classes: '4-class MI', active: false },
            { id: 'Schirrmeister2017', desc: 'High Gamma Dataset', subjects: 14, classes: '4-class MI', active: false },
          ].map(({ id, desc, subjects, classes, active }) => (
            <div key={id} style={{
              padding: '14px 16px',
              border: `1px solid ${active ? 'rgba(167,139,250,0.4)' : 'var(--border)'}`,
              borderRadius: 8,
              background: active ? 'rgba(167,139,250,0.05)' : 'var(--card)',
            }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: active ? 'var(--accent)' : 'var(--text-dim)', letterSpacing: '0.04em', marginBottom: 4 }}>
                {id}
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 8 }}>{desc}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-dim)', padding: '2px 7px', border: '1px solid var(--border-hi)', borderRadius: 4 }}>
                  {subjects} subj
                </span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-dim)', padding: '2px 7px', border: '1px solid var(--border-hi)', borderRadius: 4 }}>
                  {classes}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'var(--border)', marginBottom: 32 }} />

      {/* References */}
      <div>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.2em', display: 'block', marginBottom: 16 }}>
          References
        </span>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', borderLeft: '1px solid var(--border)', paddingLeft: 16 }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)', flexShrink: 0, marginTop: 2, letterSpacing: '0.05em' }}>
            §5.2
          </span>
          <div>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-dim)', fontStyle: 'italic', lineHeight: 1.65, margin: '0 0 2px' }}>
              Lotte et al. (2018). A Review of Classification Algorithms for EEG-Based BCI: A 10-Year Update.
            </p>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)', margin: 0, letterSpacing: '0.03em' }}>
              Journal of Neural Engineering, 15(3), 031005.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
