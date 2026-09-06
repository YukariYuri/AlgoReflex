import React from 'react';

export const App: React.FC = () => {
  const loopSteps = [
    'Understand Problem',
    'Read Constraints',
    'Plan',
    'Recognize Pattern',
    'Choose Tool',
    'Implement C++',
    'Test & Reflect',
    'Transfer',
  ];

  return (
    <div className="container">
      <header>
        <span className="badge">Milestone M0 — Foundation</span>
        <h1>AlgoReflex</h1>
        <p className="subtitle">
          Competitive C++ Learning &amp; Training System.
          <br />
          <strong>From Problem &rarr; Pattern &rarr; Tool &rarr; Code</strong>
        </p>
      </header>

      <main>
        <div className="flow-container">
          <div className="flow-title">Mental Training Loop</div>
          <div className="flow-steps">
            {loopSteps.map((step, index) => (
              <React.Fragment key={step}>
                <div className="flow-step">{step}</div>
                {index < loopSteps.length - 1 && (
                  <span className="flow-arrow">&rarr;</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="grid">
          <div className="card">
            <h3>Beyond Syntax</h3>
            <p>
              Teaches not just how a feature works, but when to use it, when NOT to use
              it, and safe contest fallbacks under pressure.
            </p>
          </div>

          <div className="card">
            <h3>Multi-Dimensional Mastery</h3>
            <p>
              Measures concept understanding, syntax recall, tool selection,
              implementation, debugging, and recall under time pressure separately.
            </p>
          </div>

          <div className="card">
            <h3>Strict Sandboxed Isolation</h3>
            <p>
              Untrusted code runs strictly in isolated runner boundaries with cgroups and
              no outbound network access. Main API remains fully protected.
            </p>
          </div>

          <div className="card">
            <h3>AI-Independent Core</h3>
            <p>
              Compilers, judging, test cases, and curriculum mechanics are fully
              deterministic and run without reliance on external LLM APIs.
            </p>
          </div>
        </div>
      </main>

      <footer>
        <div>AlgoReflex Foundation Architecture</div>
        <div>M0 Bootstrap Active</div>
      </footer>
    </div>
  );
};

export default App;
