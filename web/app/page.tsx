'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';

const WORDS = 14;

type AluStep = {
  round: number;
  block: number;
  cell: number;
  items: number;
  i: number;
  q: number;
  t: number;
  v: number;
  remainder: number;
  dBefore: number;
  dAfter: number;
  dNext: number;
  e: number;
  output?: number;
  memoryBefore: number[];
  memoryAfter: number[];
  outputsAfter: number[];
};

function buildTrace(blockCount: number) {
  const memory = Array(blockCount * WORDS).fill(2000) as number[];
  const outputs: number[] = [];
  const steps: AluStep[] = [];
  let items = blockCount * WORDS;
  let d = 0;
  let e = 0;

  for (let round = 0; round < blockCount; round += 1) {
    for (let offset = 0; offset < items; offset += 1) {
      const i = items - offset;
      const address = round * WORDS + offset;
      const block = Math.floor(address / WORDS);
      const cell = address % WORDS;
      const q = memory[address];
      const t = d * i + q * 10000;
      const v = 2 * i - 1;
      const remainder = t % v;
      const dAfter = Math.floor(t / v);
      const memoryBefore = [...memory];
      memory[address] = remainder;

      const isRoundEnd = offset === items - 1;
      const output = isRoundEnd ? e + Math.floor(dAfter / 10000) : undefined;
      if (output !== undefined) outputs.push(output);
      const dNext = isRoundEnd ? dAfter % 10000 : dAfter;

      steps.push({
        round, block, cell, items, i, q, t, v, remainder, dBefore: d,
        dAfter, dNext, e, output, memoryBefore, memoryAfter: [...memory],
        outputsAfter: [...outputs],
      });
      d = dNext;
      if (isRoundEnd) e = dNext;
    }
    items -= WORDS;
  }

  return { steps, outputs };
}

function sliderNumber(value: number | readonly number[]) {
  return Array.isArray(value) ? Number(value[0]) : Number(value);
}

function bitArray(processed: number, lockCell?: number) {
  return Array.from({ length: WORDS }, (_, index) => lockCell === undefined
    ? (index < processed ? 1 : 0)
    : (index === lockCell ? 0 : 1));
}

function BitRegister({ label, bits }: { label: string; bits: number[] }) {
  return (
    <div className="bit-register">
      <span>{label}</span>
      <div aria-label={`${label}: ${bits.join('')}`}>
        {bits.map((bit, index) => <i className={bit ? 'one' : 'zero'} key={index} />)}
      </div>
    </div>
  );
}

function WireBundle({
  index,
  selectedBlock,
  printBlock,
  isPrint,
}: {
  index: number;
  selectedBlock: number;
  printBlock: number;
  isPrint: boolean;
}) {
  const reachesSelected = index <= selectedBlock;
  const reachesPrint = isPrint && index <= printBlock;
  const labels = index === 0;
  return (
    <div className="wire-bundle" aria-label={`导线段 ${index + 1}`}>
      <span className={`wire que ${reachesSelected ? 'active' : ''}`}><em>{labels ? 'que' : ''}</em><b>→</b><i /></span>
      <span className={`wire value ${reachesSelected ? 'active' : ''}`}><em>{labels ? 'q' : ''}</em><b>←</b><i /></span>
      <span className={`wire mdf ${reachesSelected ? 'active' : ''}`}><em>{labels ? 'mdf' : ''}</em><b>→</b><i /></span>
      <span className={`wire step ${reachesPrint ? 'active' : ''}`}><em>{labels ? 'step' : ''}</em><b>→</b><i /></span>
      <span className={`wire print ${reachesPrint ? 'active' : ''}`}><em>{labels ? 'print' : ''}</em><b>→</b><i /></span>
    </div>
  );
}

export default function Home() {
  const [blockCount, setBlockCount] = useState(4);
  const [speed, setSpeed] = useState(5);
  const [cursor, setCursor] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [details, setDetails] = useState(false);
  const trace = useMemo(() => buildTrace(blockCount), [blockCount]);
  const totalSteps = trace.steps.length;
  const executed = Math.min(cursor, totalSteps);
  const selectedStep = trace.steps[Math.max(0, executed - 1)];
  const hasExecuted = executed > 0;
  const finished = executed === totalSteps;
  const memory = hasExecuted ? selectedStep.memoryAfter : trace.steps[0].memoryBefore;
  const outputs = hasExecuted ? selectedStep.outputsAfter : [];
  const retiredCount = outputs.length;

  useEffect(() => {
    if (!playing || finished) return;
    const timer = window.setInterval(() => {
      setCursor((current) => {
        const next = Math.min(totalSteps, current + 1);
        if (next === totalSteps) setPlaying(false);
        return next;
      });
    }, Math.max(45, 560 - speed * 50));
    return () => window.clearInterval(timer);
  }, [playing, finished, speed, totalSteps]);

  const setStep = (value: number) => {
    setPlaying(false);
    setCursor(Math.max(0, Math.min(totalSteps, Math.round(value))));
  };

  const changeBlocks = (value: number) => {
    setPlaying(false);
    setCursor(0);
    setBlockCount(value);
  };

  const play = () => {
    if (finished) setCursor(0);
    setPlaying((current) => !current || finished);
  };

  const currentRound = selectedStep.round;
  const currentBlock = selectedStep.block;
  const currentCell = selectedStep.cell;

  return (
    <div className="site-shell">
      <header className="topbar">
        <span className="brand">π Computer</span>
        <span className="header-note">Spigot · 14 × 16-bit / block</span>
      </header>

      <main>
        <section className="title-row">
          <div>
            <p className="kicker">Physical architecture simulator</p>
            <h1>模块化 π 计算机</h1>
          </div>
          <p>每一步完成一次内存字的 QUE → ALU → MDF。每轮末同步 PRINT，封存一个模块。</p>
        </section>

        <section className="controls" aria-label="模拟控制">
          <label className="small-range">
            <span>内存块 <output>{blockCount}</output></span>
            <Slider min={1} max={8} step={1} value={[blockCount]} onValueChange={(value) => changeBlocks(sliderNumber(value))} />
          </label>
          <label className="small-range">
            <span>播放速度 <output>{speed}×</output></span>
            <Slider min={1} max={10} step={1} value={[speed]} onValueChange={(value) => setSpeed(sliderNumber(value))} />
          </label>
          <div className="buttons">
            <Button variant="outline" onClick={() => setStep(executed - 1)}>上一步</Button>
            <Button onClick={play}>{playing ? '暂停' : finished ? '重播' : '播放'}</Button>
            <Button variant="outline" onClick={() => setStep(executed + 1)}>下一步</Button>
            <button className="quiet-button" onClick={() => setStep(0)}>复位</button>
          </div>
          <div className="details-toggle">
            <Switch checked={details} onCheckedChange={setDetails} />
            <span>详细步骤</span>
          </div>
        </section>

        <section className="seek-panel" aria-label="计算进度">
          <div className="seek-heading">
            <label htmlFor="step-input">步数</label>
            <div>
              <Input
                id="step-input"
                type="number"
                min={0}
                max={totalSteps}
                value={executed}
                onChange={(event) => setStep(Number(event.target.value))}
              />
              <span>/ {totalSteps}</span>
            </div>
          </div>
          <Slider
            aria-label="可拖动的计算进度"
            min={0}
            max={totalSteps}
            step={1}
            value={[executed]}
            onValueChange={(value) => setStep(sliderNumber(value))}
          />
          <div className="seek-meta">
            <span>参与计算：B{currentRound}–B{blockCount - 1}</span>
            <span>活动内存：{selectedStep.items}</span>
            <span>{hasExecuted ? `B${currentBlock} · M${currentCell}` : '尚未执行'}</span>
            <span>{Math.round((executed / totalSteps) * 100)}%</span>
          </div>
        </section>

        <section className="machine-viewport" aria-label="ALU 和内存模块级联图">
          <div className="machine-chain">
            <div className="alu-column">
              <div className="alu-box">
                <span>ALU</span>
                <small>{hasExecuted ? `step ${executed}` : 'ready'}</small>
              </div>
              <dl className="alu-values">
                <div><dt>i</dt><dd>{hasExecuted ? selectedStep.i : 0}</dd></div>
                <div><dt>d</dt><dd>{hasExecuted ? selectedStep.dBefore : 0}</dd></div>
                <div><dt>e</dt><dd>{hasExecuted ? selectedStep.e : 0}</dd></div>
                <div><dt>q</dt><dd>{hasExecuted ? selectedStep.q : 0}</dd></div>
                <div><dt>T</dt><dd>{hasExecuted ? selectedStep.t : 0}</dd></div>
                <div><dt>v</dt><dd>{hasExecuted ? selectedStep.v : 0}</dd></div>
              </dl>
            </div>

            {Array.from({ length: blockCount }, (_, blockIndex) => {
              const dead = blockIndex < retiredCount;
              const target = hasExecuted && blockIndex === currentBlock;
              const roundFinished = hasExecuted && selectedStep.output !== undefined;
              let processed = 0;
              if (!roundFinished && blockIndex >= currentRound) {
                if (blockIndex < currentBlock) processed = WORDS;
                if (blockIndex === currentBlock) processed = currentCell + 1;
              }
              if (dead) processed = WORDS;
              const priorAccess = hasExecuted && (dead || blockIndex < currentBlock || currentRound > 0);
              const lockCell = target ? currentCell : priorAccess ? WORDS - 1 : undefined;
              const lock = lockCell === undefined
                ? Array.from({ length: WORDS }, () => 1)
                : bitArray(0, lockCell);
              const stepBits = bitArray(processed);
              const digit = outputs[blockIndex];

              return (
                <div className="chain-pair" key={blockIndex}>
                  <WireBundle
                    index={blockIndex}
                    selectedBlock={hasExecuted ? currentBlock : -1}
                    printBlock={currentRound}
                    isPrint={Boolean(hasExecuted && selectedStep.output !== undefined)}
                  />
                  <div className={`module-column ${dead ? 'dead' : ''} ${target ? 'target' : ''}`}>
                    <div className="module-box">
                      <header><span>B{blockIndex}</span><small>{dead ? 'death' : target ? '访问中' : '等待'}</small></header>
                      <div className="block-name">block</div>
                      <div className="module-progress"><i style={{ width: `${(processed / WORDS) * 100}%` }} /></div>
                      <div className="digit"><span>digit</span><strong>{digit === undefined ? '0000' : String(digit).padStart(4, '0')}</strong></div>
                    </div>

                    <div className="memory-values" aria-label={`B${blockIndex} 的 14 个内存值`}>
                      {Array.from({ length: WORDS }, (_, cellIndex) => (
                        <span className={target && cellIndex === currentCell ? 'active' : ''} key={cellIndex}>
                          <i>M{cellIndex}</i>
                          <b>{String(memory[blockIndex * WORDS + cellIndex]).padStart(4, '0')}</b>
                        </span>
                      ))}
                    </div>
                    <div className="registers">
                      <BitRegister label="lock" bits={lock} />
                      <BitRegister label="step" bits={stepBits} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="wire-legend" aria-label="导线图例">
          <span><i className="line que" /> QUE 请求 →</span>
          <span><i className="line value" /> ← q 返回</span>
          <span><i className="line mdf" /> MDF 写回 →</span>
          <span><i className="line step" /> STEP 重置 →</span>
          <span><i className="line print" /> PRINT →</span>
          <span><i className="bit zero" /> 0</span>
          <span><i className="bit one" /> 1</span>
        </div>

        {details && (
          <section className="detail-panel" aria-live="polite">
            <div className="detail-heading">
              <div><p className="kicker">Exact ALU step</p><h2>第 {Math.max(1, executed)} 步计算</h2></div>
              <p>{hasExecuted ? `B${currentBlock} · M${currentCell}` : '下一步：B0 · M0'}</p>
            </div>

            <div className="signal-path">
              <span className="path-alu">ALU</span>
              {Array.from({ length: currentBlock + 1 }, (_, blockIndex) => (
                <span className={blockIndex === currentBlock ? 'path-target' : 'path-pass'} key={blockIndex}>
                  <i>→</i>
                  <b>B{blockIndex}</b>
                  <small>{blockIndex < currentRound ? 'death → next' : blockIndex < currentBlock ? 'step[13] = 1 → next' : `lock 选中 M${currentCell}`}</small>
                </span>
              ))}
              <span className="return-path">q = {selectedStep.q} 沿原路返回 ALU ←</span>
            </div>

            <div className="calculation-grid">
              <article><span>01 · QUE</span><code>q = B{currentBlock}.M{currentCell} = <b>{selectedStep.q}</b></code><p>递归请求穿过 {currentBlock} 个前置块。</p></article>
              <article><span>02 · T</span><code>T = {selectedStep.dBefore} × {selectedStep.i} + {selectedStep.q} × 10000 = <b>{selectedStep.t}</b></code><p>d 是上一个存储字留下的商。</p></article>
              <article><span>03 · v</span><code>v = 2 × {selectedStep.i} − 1 = <b>{selectedStep.v}</b></code><p>i 从 items = {selectedStep.items} 逐步减到 1。</p></article>
              <article><span>04 · MDF</span><code>B{currentBlock}.M{currentCell} ← {selectedStep.t} mod {selectedStep.v} = <b>{selectedStep.remainder}</b></code><p>step 左移并在低位补 1。</p></article>
              <article><span>05 · d</span><code>d ← ⌊{selectedStep.t} / {selectedStep.v}⌋ = <b>{selectedStep.dAfter}</b></code><p>{selectedStep.output === undefined ? `下一步携带 d = ${selectedStep.dNext}。` : `轮末保留 d = e = ${selectedStep.dNext}。`}</p></article>
              {selectedStep.output !== undefined && (
                <article className="print-calculation"><span>06 · PRINT</span><code>e + ⌊d / 10000⌋ = {selectedStep.e} + ⌊{selectedStep.dAfter} / 10000⌋ = <b>{String(selectedStep.output).padStart(4, '0')}</b></code><p>写入 B{currentRound}.digit，然后 B{currentRound}.death = 1，items 减少 14。</p></article>
              )}
            </div>
          </section>
        )}
      </main>

      <footer><span>π Computer</span><span>{totalSteps} ALU steps · {blockCount * 4} output digits</span></footer>
    </div>
  );
}
