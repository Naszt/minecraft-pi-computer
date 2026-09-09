'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

type Phase = 'que' | 'alu' | 'mdf' | 'print';

type TraceFrame = {
  phase: Phase;
  round: number;
  block: number;
  cell: number;
  items: number;
  i: number;
  q: number;
  t: number;
  divisor: number;
  nextValue: number;
  dBefore: number;
  dAfter: number;
  e: number;
  output?: number;
  memory: number[];
};

const PHASES: Array<{ id: Phase; call: string; title: string; description: string }> = [
  { id: 'que', call: 'que()', title: '读内存', description: '请求递归穿过前面的块，q 逆向返回 ALU。' },
  { id: 'alu', call: 'cal()', title: '执行计算', description: 'ALU 用当前 i、q 和进位 d 计算 T 与新 d。' },
  { id: 'mdf', call: 'mdf(v)', title: '写回余数', description: '写回同一地址，并将本块 step 左移、补 1。' },
  { id: 'print', call: 'print(v)', title: '封存四位', description: '结果写入第一个未 death 块，该块之后被整轮跳过。' },
];

function buildTrace(blockCount: number) {
  const memory = Array(blockCount * 14).fill(2000) as number[];
  const frames: TraceFrame[] = [];
  const outputs: number[] = [];
  let items = blockCount * 14;
  let d = 0;
  let e = 0;

  for (let round = 0; round < blockCount; round += 1) {
    for (let offset = 0; offset < items; offset += 1) {
      const i = items - offset;
      const index = round * 14 + offset;
      const block = Math.floor(index / 14);
      const cell = index % 14;
      const q = memory[index];
      const t = d * i + q * 10000;
      const divisor = 2 * i - 1;
      const nextValue = t % divisor;
      const dAfter = Math.floor(t / divisor);
      const common = { round, block, cell, items, i, q, t, divisor, nextValue, dBefore: d, dAfter, e };

      frames.push({ ...common, phase: 'que', memory: [...memory] });
      frames.push({ ...common, phase: 'alu', memory: [...memory] });
      memory[index] = nextValue;
      frames.push({ ...common, phase: 'mdf', memory: [...memory] });
      d = dAfter;
    }

    const output = e + Math.floor(d / 10000);
    outputs.push(output);
    frames.push({
      phase: 'print', round, block: round, cell: -1, items, i: 0, q: 0, t: 0,
      divisor: 0, nextValue: 0, dBefore: d, dAfter: d, e, output, memory: [...memory],
    });
    d %= 10000;
    e = d;
    items -= 14;
  }

  return { frames, outputs };
}

function sliderNumber(value: number | readonly number[]) {
  return Array.isArray(value) ? Number(value[0]) : Number(value);
}

function bitsLowToHigh(processed: number, activeCell: number, showLock: boolean) {
  return Array.from({ length: 14 }, (_, index) => {
    if (showLock) return index === activeCell ? '0' : '1';
    return index < processed ? '1' : '0';
  }).join('');
}

function formatPi(groups: number[]) {
  if (groups.length === 0) return '—';
  const joined = groups.map((value) => String(value).padStart(4, '0')).join('');
  return `${joined[0]}.${joined.slice(1)}`;
}

export default function Home() {
  const [blockCount, setBlockCount] = useState(4);
  const [speed, setSpeed] = useState(5);
  const [cursor, setCursor] = useState(0);
  const [playing, setPlaying] = useState(false);
  const trace = useMemo(() => buildTrace(blockCount), [blockCount]);
  const finished = cursor >= trace.frames.length;
  const frame = trace.frames[Math.min(cursor, trace.frames.length - 1)];

  useEffect(() => {
    if (!playing || finished) return;
    const timer = window.setInterval(() => {
      setCursor((value) => {
        const next = Math.min(trace.frames.length, value + Math.max(1, speed * 2 - 2));
        if (next >= trace.frames.length) setPlaying(false);
        return next;
      });
    }, 110);
    return () => window.clearInterval(timer);
  }, [playing, finished, speed, trace.frames.length]);

  const phase = finished ? 'print' : frame.phase;
  const currentRound = finished ? blockCount - 1 : frame.round;
  const currentBlock = finished ? blockCount - 1 : frame.block;
  const currentCell = finished ? -1 : frame.cell;
  const currentMemory = frame.memory;
  const shownOutputs = finished
    ? trace.outputs
    : trace.outputs.slice(0, frame.round + (frame.phase === 'print' ? 1 : 0));
  const overall = Math.round((cursor / trace.frames.length) * 100);
  const processedInBlock = phase === 'mdf' && frame.cell >= 0 ? frame.cell + 1 : Math.max(frame.cell, 0);

  const goToNextOutput = () => {
    const next = trace.frames.findIndex((item, index) => index > cursor && item.phase === 'print');
    setPlaying(false);
    setCursor(next === -1 ? trace.frames.length : next);
  };

  return (
    <div className="site-shell">
      <header className="topbar">
        <a className="brand" href="#top">π Computer</a>
        <nav aria-label="页面导航">
          <a className="active" href="#machine">计算机</a>
          <a href="#rounds">轮次</a>
          <a href="#mapping">代码映射</a>
        </nav>
      </header>

      <main id="top">
        <section className="intro">
          <div>
            <p className="kicker">Spigot algorithm · physical architecture</p>
            <h1>模块化 π 计算机</h1>
            <p className="lede">一个 ALU 通过递归链读写内存。每轮扫描所有未完成块，输出四位后封存最前面的块。</p>
          </div>
          <dl className="summary">
            <div><dt>块数</dt><dd>{blockCount}</dd></div>
            <div><dt>16 位存储字</dt><dd>{blockCount * 14}</dd></div>
            <div><dt>输出位数</dt><dd>{blockCount * 4}</dd></div>
          </dl>
        </section>

        <section className="toolbar" aria-label="模拟控制">
          <label className="range-control">
            <span>内存块 <output>{blockCount}</output></span>
            <Slider min={1} max={8} step={1} value={[blockCount]} onValueChange={(value) => {
              setPlaying(false);
              setCursor(0);
              setBlockCount(sliderNumber(value));
            }} />
          </label>
          <label className="range-control">
            <span>播放速度 <output>{speed}×</output></span>
            <Slider min={1} max={10} step={1} value={[speed]} onValueChange={(value) => setSpeed(sliderNumber(value))} />
          </label>
          <div className="playback">
            <Button variant="outline" onClick={() => { setPlaying(false); setCursor(Math.max(0, cursor - 1)); }}>上一步</Button>
            <Button onClick={() => {
              if (finished) {
                setCursor(0);
                setPlaying(true);
              } else {
                setPlaying((value) => !value);
              }
            }}>{playing ? '暂停' : finished ? '重播' : '播放'}</Button>
            <Button variant="outline" onClick={() => { setPlaying(false); setCursor(Math.min(trace.frames.length, cursor + 1)); }}>下一步</Button>
            <Button variant="outline" onClick={goToNextOutput}>到下一组</Button>
            <button className="quiet-button" onClick={() => { setPlaying(false); setCursor(0); }}>复位</button>
          </div>
        </section>

        <section className="status-strip" aria-label="当前运行状态">
          <div><span>轮次</span><strong>{String(Math.min(blockCount, currentRound + 1)).padStart(2, '0')} / {String(blockCount).padStart(2, '0')}</strong></div>
          <div><span>items</span><strong>{finished ? 0 : frame.items}</strong></div>
          <div><span>i</span><strong>{finished ? 0 : frame.i}</strong></div>
          <div><span>访问</span><strong>{finished ? '完成' : `a[${currentBlock}].a[${Math.max(0, currentCell)}]`}</strong></div>
          <div><span>输出</span><strong>{shownOutputs.length ? String(shownOutputs.at(-1)).padStart(4, '0') : '—'}</strong></div>
        </section>

        <section id="machine" className="machine-section">
          <div className="section-heading">
            <div><p className="kicker">Live machine</p><h2>递归读写链</h2></div>
            <p>QUE 与 MDF 都从 a[0] 进入。前面的块仍需传递请求，即实体通信的额外距离。</p>
          </div>

          <div className="machine-viewport">
            <div className="machine-row">
              <article className={`alu-card ${phase === 'alu' ? 'current' : ''}`}>
                <header><span>ALU</span><small>cal()</small></header>
                <div className="alu-formula">
                  <span>T = d × i + q × 10000</span>
                  <strong>{finished ? '完成' : frame.t.toLocaleString()}</strong>
                  <code>d: {finished ? '—' : frame.dBefore} → {finished ? '—' : frame.dAfter}</code>
                </div>
                <footer>1 × 计算模块</footer>
              </article>

              <div className="signal-bridge" aria-label="ALU 与内存信号">
                <span className={phase === 'que' ? 'active' : ''}><i>←</i> q / QUE</span>
                <span className={phase === 'mdf' ? 'active' : ''}>v / MDF <i>→</i></span>
                <span className={phase === 'print' ? 'active output' : ''}>PRINT <i>→</i></span>
              </div>

              <div className="memory-chain">
                {Array.from({ length: blockCount }, (_, blockIndex) => {
                  const isDead = finished || blockIndex < currentRound;
                  const isCurrent = !finished && blockIndex === currentBlock;
                  const isPrintTarget = !finished && phase === 'print' && blockIndex === currentRound;
                  const digit = trace.outputs[blockIndex];
                  return (
                    <article className={`memory-card ${isDead ? 'dead' : ''} ${isCurrent ? 'current' : ''} ${isPrintTarget ? 'print-target' : ''}`} key={blockIndex}>
                      <header>
                        <span>a[{blockIndex}]</span>
                        <small>{isDead ? 'death = 1' : isCurrent ? phase.toUpperCase() : 'waiting'}</small>
                      </header>
                      <div className="memory-cells" aria-label={`内存块 ${blockIndex + 1} 的 14 个存储字`}>
                        {Array.from({ length: 14 }, (_, cellIndex) => {
                          const address = blockIndex * 14 + cellIndex;
                          const selected = isCurrent && phase !== 'print' && cellIndex === currentCell;
                          return (
                            <span className={selected ? 'selected' : ''} key={cellIndex}>
                              <i>{cellIndex}</i>
                              <b>{String(currentMemory[address] ?? 2000).padStart(4, '0')}</b>
                            </span>
                          );
                        })}
                      </div>
                      <dl className="registers">
                        <div><dt>lock</dt><dd>{isCurrent && phase !== 'print' ? bitsLowToHigh(0, currentCell, true) : '11111111111111'}</dd></div>
                        <div><dt>step</dt><dd>{isDead ? '11111111111111' : isCurrent && phase !== 'print' ? bitsLowToHigh(processedInBlock, currentCell, false) : '00000000000000'}</dd></div>
                      </dl>
                      <footer>
                        <span>digit</span>
                        <strong>{isDead || isPrintTarget ? String(digit).padStart(4, '0') : '—'}</strong>
                      </footer>
                      {blockIndex < blockCount - 1 && <span className="next-link">next →</span>}
                    </article>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="phase-row">
            {PHASES.map((item, index) => (
              <article className={phase === item.id ? 'active' : ''} key={item.id}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <div><code>{item.call}</code><strong>{item.title}</strong><p>{item.description}</p></div>
              </article>
            ))}
          </div>
        </section>

        <section className="decimal-output" aria-live="polite">
          <div><p className="kicker">Printed stream</p><h2>π = {formatPi(shownOutputs)}</h2></div>
          <span>{overall}%</span>
          <div className="thin-progress"><i style={{ width: `${overall}%` }} /></div>
        </section>

        <section id="rounds" className="round-section">
          <div className="section-heading">
            <div><p className="kicker">Shrinking workload</p><h2>每轮封存一块</h2></div>
            <p>items 每次减 14。已输出块的 step[13] 保持为 1，que() / mdf() 直接进入 next。</p>
          </div>
          <div className="round-table">
            {Array.from({ length: blockCount }, (_, round) => (
              <div className={round === currentRound ? 'active' : ''} key={round}>
                <span>round {round + 1}</span>
                <div className="round-blocks">
                  {Array.from({ length: blockCount }, (_, block) => <i className={block < round ? 'skipped' : block === round ? 'output' : ''} key={block}>{block + 1}</i>)}
                </div>
                <code>items = {(blockCount - round) * 14}</code>
                <strong>→ digit[{round}]</strong>
              </div>
            ))}
          </div>
          <p className="complexity-note"><b>O(n²)</b> 次内存读写 × <b>O(n)</b> 级联传递距离 ≈ <b>O(n³)</b> 实体时间</p>
        </section>

        <section id="mapping" className="mapping-section">
          <div className="section-heading"><div><p className="kicker">Source map</p><h2>代码与电路的对应</h2></div></div>
          <div className="mapping-grid">
            <article><code>a[14]</code><h3>14 个 16 位存储字</h3><p>初值 2000。两层错位是物理布局，用于避免中继器串扰。</p></article>
            <article><code>lock + step</code><h3>地址选择与轮内进度</h3><p>lock 中最低的 0 定位当前地址；mdf() 后 step 补 1，14 位全满便转向 next。</p></article>
            <article><code>death</code><h3>块级退役标志</h3><p>print() 只写入第一个 death = 0 的块。该块之后不再参与数值计算。</p></article>
            <article><code>next</code><h3>可复制的级联接口</h3><p>增加一块就增加 14 个存储字，并让外层循环再输出一组四位数字。</p></article>
          </div>
        </section>

        <details className="source-sketch">
          <summary>原始手稿</summary>
          <img src="architecture-sketch.png" alt="ALU 和多个内存块级联的原始手绘结构图" />
        </details>
      </main>

      <footer><span>π Computer</span><span>14 words / block · 4 digits / round</span></footer>
    </div>
  );
}
