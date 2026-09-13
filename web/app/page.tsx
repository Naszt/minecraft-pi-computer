'use client';

import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';

const WORDS = 14;
const BASE_URL = import.meta.env.BASE_URL;
const PrinciplePage = lazy(() => import('./principle'));

export type SitePageName = 'principle' | 'circuit' | 'design';

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

export default function Home({ page = 'principle' }: { page?: SitePageName }) {
  const [blockCount, setBlockCount] = useState(4);
  const [speed, setSpeed] = useState(5);
  const [cursor, setCursor] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [details, setDetails] = useState(false);
  const [designTarget, setDesignTarget] = useState<'alu' | 'block'>(() => {
    if (typeof window === 'undefined') return 'alu';
    return new URLSearchParams(window.location.search).get('target') === 'block' ? 'block' : 'alu';
  });
  const [designBlock] = useState(() => {
    if (typeof window === 'undefined') return 0;
    const block = Number(new URLSearchParams(window.location.search).get('block'));
    return Number.isFinite(block) ? Math.max(0, Math.min(7, Math.round(block))) : 0;
  });
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

  const openDesign = (target: 'alu' | 'block', blockIndex = 0) => {
    window.location.href = `${BASE_URL}design/?target=${target}&block=${blockIndex}`;
  };

  return (
    <div className="site-shell">
      <header className="topbar">
        <span className="brand">π Computer</span>
        <nav aria-label="页面章节">
          <a href={BASE_URL} aria-current={page === 'principle' ? 'page' : undefined}>数学原理</a>
          <a href={`${BASE_URL}circuit/`} aria-current={page === 'circuit' ? 'page' : undefined}>实体电路</a>
          <a href={`${BASE_URL}design/`} aria-current={page === 'design' ? 'page' : undefined}>详细设计</a>
        </nav>
        <span className="header-note">Spigot · 14 × 16-bit / block</span>
      </header>

      <main>
        {page === 'principle' && (
          <Suspense fallback={<p className="markdown-loading">正在排版公式…</p>}><PrinciplePage /></Suspense>
        )}

        {page === 'circuit' && (
          <>
        <section className="circuit-section page-section" id="machine">
          <div className="section-heading">
            <div><span>02</span><p className="kicker">Physical architecture simulator</p><h2>实体电路</h2></div>
            <p>每一步完成一次内存字的 QUE → ALU → MDF。扫描结束后同步 PRINT，并封存一个模块。</p>
          </div>
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
              <div className="alu-box inspectable">
                <button className="inspect-button" type="button" onClick={() => openDesign('alu')} aria-label="查看 ALU 详细设计" />
                <span>ALU</span>
                <small>{hasExecuted ? `step ${executed}` : 'ready'}</small>
                <em>点击查看设计</em>
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
                    <div className="module-box inspectable">
                      <button className="inspect-button" type="button" onClick={() => openDesign('block', blockIndex)} aria-label={`查看 B${blockIndex} 内存模块详细设计`} />
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
          </>
        )}

        {page === 'design' && (
        <section className="design-section page-section" id="design">
          <div className="section-heading">
            <div><span>03</span><p className="kicker">Module specification</p><h2>详细设计</h2></div>
            <p>点击上方 ALU 或任意 block，会切换到对应的功能、状态与信号说明。</p>
          </div>

          <div className="design-tabs" role="tablist" aria-label="设计对象">
            <button id="design-tab-alu" type="button" role="tab" aria-controls="design-panel" aria-selected={designTarget === 'alu'} className={designTarget === 'alu' ? 'active' : ''} onClick={() => setDesignTarget('alu')}>ALU</button>
            <button id="design-tab-block" type="button" role="tab" aria-controls="design-panel" aria-selected={designTarget === 'block'} className={designTarget === 'block' ? 'active' : ''} onClick={() => setDesignTarget('block')}>block {designTarget === 'block' ? `· B${designBlock}` : ''}</button>
          </div>

          {designTarget === 'alu' ? (
            <div className="design-content" id="design-panel" role="tabpanel" aria-labelledby="design-tab-alu" aria-live="polite">
              <aside className="design-summary">
                <span>ALU</span>
                <h3>扫描、运算与输出调度</h3>
                <p>ALU 不保存 14 字内存；它只保存当前计算状态，并通过五组导线调用模块链。</p>
                <dl>
                  <div><dt>i</dt><dd>当前混合进位位号，逐次减 1</dd></div>
                  <div><dt>items</dt><dd>仍参与计算的内存字数</dd></div>
                  <div><dt>d</dt><dd>沿扫描方向传播的商 / 进位</dd></div>
                  <div><dt>e</dt><dd>跨扫描保留的 4 位缓冲</dd></div>
                </dl>
              </aside>
              <div className="function-list">
                <article><code>init()</code><p>从 B0 开始递归初始化整条链：内存写入 2000，death=0，step=0，lock 的 14 位全部置 1。</p></article>
                <article><code>cal() · 读取</code><p>令 i=items，发送 QUE。目标 block 返回 q；已经走满 14 字的 block 会把请求交给 next。</p></article>
                <article><code>cal() · 运算</code><p>计算 T=d×i+q×10000 与 v=2i−1；余数 T mod v 写回原地址，商 ⌊T/v⌋ 成为下一步 d。</p></article>
                <article><code>cal() · 输出</code><p>i 降到 0 后发送 PRINT(e+⌊d/10000⌋)，再发送 STEP 清零；d=e=d mod 10000，items 减少 14。</p></article>
              </div>
              <div className="timing-strip" aria-label="ALU 时序">
                <span><b>1</b> QUE →</span><span><b>2</b> ← q</span><span><b>3</b> T / v</span><span><b>4</b> MDF →</span><span><b>5</b> i−−</span><span><b>6</b> PRINT / STEP</span>
              </div>
            </div>
          ) : (
            <div className="design-content" id="design-panel" role="tabpanel" aria-labelledby="design-tab-block" aria-live="polite">
              <aside className="design-summary">
                <span>B{designBlock}</span>
                <h3>14 字内存、寻址与级联路由</h3>
                <p>所有 block 使用同一设计。next 连接下一块，因此增减模块不需要修改 ALU。</p>
                <dl>
                  <div><dt>M0–M13</dt><dd>14 × 16-bit 余数存储</dd></div>
                  <div><dt>digit</dt><dd>稳定后显示 4 位十进制结果</dd></div>
                  <div><dt>lock</dt><dd>唯一的 0 指向当前读写地址</dd></div>
                  <div><dt>step</dt><dd>连续的 1 表示本块已处理进度</dd></div>
                  <div><dt>death</dt><dd>结果写入后封存本块</dd></div>
                </dl>
              </aside>
              <div className="function-list">
                <article><code>que()</code><p>若 step[13]=1，QUE 转交 next；否则 lock 左移并补入 step[0]，通过唯一的 0 选中 M0–M13，返回 q。</p></article>
                <article><code>mdf(value)</code><p>使用与 QUE 相同的路由。目标块令 step 左移补 1，并把 value 写回 lock 当前选中的同一内存字。</p></article>
                <article><code>print(value)</code><p>death=1 的 block 将 PRINT 转交 next；第一个存活块把 value 写入 digit，然后令 death=1。</p></article>
                <article><code>init_step()</code><p>存活块把 step 清零，准备下一次扫描；death 块保持全 1，使后续 QUE / MDF 直接越过。</p></article>
              </div>
              <div className="block-schematic" aria-label="block 内部信号关系">
                <span>QUE</span><i>→</i><b>step[13] 路由</b><i>→</i><b>lock 移位 / 14 选 1</b><i>→</i><b>M0–M13</b><i>→</i><span>q</span>
                <small>MDF 沿同一路径写回；PRINT 由 death 选择“显示”或“转发”。</small>
              </div>
            </div>
          )}
        </section>
        )}
      </main>

      <footer>
        <span>π Computer</span>
        <span>{page === 'circuit' ? `${totalSteps} ALU steps · ${blockCount * 4} output digits` : page === 'design' ? 'ALU / block module specification' : 'Euler transform · mixed radix · Spigot'}</span>
      </footer>
    </div>
  );
}
