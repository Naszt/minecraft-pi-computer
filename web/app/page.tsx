'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  BookOpen,
  Box,
  Braces,
  ChevronRight,
  CirclePause,
  CirclePlay,
  Cpu,
  Gauge,
  MemoryStick,
  RotateCcw,
  StepForward,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';

const PI_GROUPS = ['3141', '5926', '5358', '9793', '2384', '6264', '3383', '2795'];
const BUS = [
  { key: 'que', label: 'QUE', note: '读取', color: 'cyan' },
  { key: 'mdf', label: 'MDF', note: '写入', color: 'pink' },
  { key: 'step', label: 'STEP', note: '调度', color: 'amber' },
  { key: 'print', label: 'PRINT', note: '输出', color: 'green' },
] as const;

function getValue(value: number | readonly number[]) {
  return Array.isArray(value) ? Number(value[0]) : Number(value);
}

export default function Home() {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
  const [blocks, setBlocks] = useState(4);
  const [rate, setRate] = useState(5);
  const [auto, setAuto] = useState(false);
  const [tick, setTick] = useState(0);
  const [showSketch, setShowSketch] = useState(false);

  const totalTicks = blocks * 14 * 4;
  const phase = tick % 4;
  const wordIndex = Math.floor(tick / 4);
  const activeBlock = Math.min(blocks - 1, Math.floor(wordIndex / 14));
  const activeCell = wordIndex % 14;
  const completedBlocks = Math.min(blocks, Math.floor(tick / (14 * 4)));
  const progress = Math.min(100, Math.round((tick / totalTicks) * 100));

  useEffect(() => {
    if (!auto || tick >= totalTicks) return;
    const timer = window.setInterval(
      () => setTick((value) => Math.min(totalTicks, value + 1)),
      Math.max(45, 520 - rate * 46),
    );
    return () => window.clearInterval(timer);
  }, [auto, rate, tick, totalTicks]);

  useEffect(() => {
    setTick((value) => Math.min(value, blocks * 14 * 4));
  }, [blocks]);

  const output = useMemo(() => {
    const visible = Math.max(completedBlocks, tick > 0 ? 1 : 0);
    return PI_GROUPS.slice(0, Math.min(blocks, visible));
  }, [blocks, completedBlocks, tick]);

  const stepOnce = () => {
    setAuto(false);
    setTick((value) => (value >= totalTicks ? 0 : value + 1));
  };

  const reset = () => {
    setAuto(false);
    setTick(0);
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">π</span>
          <span>
            <strong>PI · REDSTONE</strong>
            <small>模块化水龙头计算机</small>
          </span>
        </div>
        <div className="top-status">
          <span className="live-dot" />
          架构演示模式
          <span className="version">SPEC / 01</span>
        </div>
      </header>

      <section className="workspace" aria-label="π 计算机可视化工作区">
        <aside className="control-rail">
          <div className="rail-heading">
            <span>CONTROL</span>
            <span>01</span>
          </div>

          <section className="control-section">
            <label className="control-label" htmlFor="block-slider">
              <span>内存模块</span>
              <strong>{String(blocks).padStart(2, '0')}</strong>
            </label>
            <Slider
              id="block-slider"
              aria-label="内存模块数量"
              min={1}
              max={8}
              step={1}
              value={[blocks]}
              onValueChange={(value) => setBlocks(getValue(value))}
            />
            <div className="range-labels"><span>1</span><span>8 BLOCKS</span></div>
          </section>

          <section className="control-section">
            <label className="control-label" htmlFor="rate-slider">
              <span>时钟倍率</span>
              <strong>{rate}×</strong>
            </label>
            <Slider
              id="rate-slider"
              aria-label="演示速度"
              min={1}
              max={10}
              step={1}
              value={[rate]}
              onValueChange={(value) => setRate(getValue(value))}
            />
            <div className="range-labels"><span>SLOW</span><span>FAST</span></div>
          </section>

          <section className="control-section mode-row">
            <span>
              <b>自动时钟</b>
              <small>按速率连续扫描</small>
            </span>
            <Switch
              aria-label="切换自动时钟"
              checked={auto}
              onCheckedChange={setAuto}
            />
          </section>

          <div className="button-grid">
            <Button className="run-button" onClick={() => setAuto((value) => !value)}>
              {auto ? <CirclePause /> : <CirclePlay />}
              {auto ? '暂停' : '运行'}
            </Button>
            <Button variant="outline" className="step-button" onClick={stepOnce}>
              <StepForward />
              单步
            </Button>
            <Button variant="ghost" className="reset-button" onClick={reset}>
              <RotateCcw />
              重置演示
            </Button>
          </div>

          <div className="formula-card">
            <span>SPIGOT FORM</span>
            <p>π = 2 + <i>⅓</i>(2 + <i>⅖</i>(2 + <i>⅗</i>(2 + …)))</p>
            <small>将计算改写为特殊进制转换，每轮流出 4 位十进制数字。</small>
          </div>
        </aside>

        <div className="main-stage">
          <div className="stage-heading">
            <div>
              <span className="eyebrow">SYSTEM MAP / 整体结构</span>
              <h1>一块模块，多四位精度</h1>
            </div>
            <div className="precision-readout">
              <small>当前理论精度</small>
              <strong>{blocks * 4}</strong>
              <span>DIGITS</span>
            </div>
          </div>

          <section className="diagram-card" aria-label="ALU 与内存模块数据流">
            <div className="diagram-grid">
              <div className={`alu-unit phase-${phase}`}>
                <div className="unit-topline"><Cpu /><span>ALU / 00</span></div>
                <div className="alu-core">
                  <span>16 BIT</span>
                  <strong>{['QUE', 'MUL', 'MDF', 'OUT'][phase]}</strong>
                  <small>{['读取寄存器', '乘 10000 · 除基数', '写回余数', '输出 4 位'][phase]}</small>
                </div>
                <div className="alu-footer">
                  <Activity /> CLOCK {String(tick).padStart(4, '0')}
                </div>
              </div>

              <div className="bus-column" aria-label="模块通信总线">
                {BUS.map((bus, index) => (
                  <div className={`bus bus-${bus.color} ${phase === index ? 'is-active' : ''}`} key={bus.key}>
                    <span className="bus-name">{bus.label}</span>
                    <span className="bus-line"><i /><ChevronRight /></span>
                    <small>{bus.note}</small>
                  </div>
                ))}
              </div>

              <div className="memory-strip">
                {Array.from({ length: blocks }, (_, blockIndex) => {
                  const isActive = blockIndex === activeBlock && tick < totalTicks;
                  const isDone = blockIndex < completedBlocks;
                  return (
                    <article
                      className={`memory-block ${isActive && tick > 0 ? 'is-active' : ''} ${isDone ? 'is-done' : ''}`}
                      key={blockIndex}
                    >
                      <div className="memory-head">
                        <span><MemoryStick /> MEM / {String(blockIndex + 1).padStart(2, '0')}</span>
                        <i>{isDone ? 'DONE' : isActive && tick > 0 ? 'SCAN' : 'IDLE'}</i>
                      </div>
                      <div className="cell-bank">
                        {Array.from({ length: 14 }, (_, cellIndex) => (
                          <span
                            className={`${isActive && cellIndex === activeCell && tick > 0 ? 'cell-active' : ''} ${isDone ? 'cell-done' : ''}`}
                            key={cellIndex}
                          >
                            <small>{String(cellIndex).padStart(2, '0')}</small>
                            <b>{isDone ? String((2000 + blockIndex * 137 + cellIndex * 29) % 9999).padStart(4, '0') : '2000'}</b>
                          </span>
                        ))}
                      </div>
                      <div className="block-progress">
                        <span style={{ width: `${isDone ? 100 : isActive ? ((activeCell + 1) / 14) * 100 : 0}%` }} />
                      </div>
                      <div className="digit-port">
                        <span>DISPLAY</span>
                        <strong>{isDone ? PI_GROUPS[blockIndex] : '····'}</strong>
                      </div>
                    </article>
                  );
                })}
                <button className="add-block" onClick={() => setBlocks((value) => Math.min(8, value + 1))} disabled={blocks === 8}>
                  <Box />
                  <span>+ MODULE</span>
                  <small>14 × 16 BIT</small>
                </button>
              </div>
            </div>

            <div className="signal-legend">
              <span><i className="legend-cyan" /> QUE 读取</span>
              <span><i className="legend-pink" /> MDF 写入</span>
              <span><i className="legend-amber" /> STEP 调度</span>
              <span><i className="legend-green" /> PRINT 输出</span>
              <span className="scroll-hint">横向滚动查看全部模块 <ChevronRight /></span>
            </div>
          </section>

          <section className="output-panel">
            <div className="output-title">
              <span><Gauge /> DECIMAL STREAM</span>
              <small>{progress}% COMPLETE</small>
            </div>
            <div className="digit-stream" aria-live="polite">
              <span className="pi-symbol">π</span>
              <span className="equals">=</span>
              {output.length === 0 ? (
                <span className="waiting">WAITING FOR CLOCK…</span>
              ) : (
                <span className="digits">
                  <b>{output[0]?.[0] ?? '3'}.</b>
                  {output.map((group, index) => (
                    <i key={index}>{index === 0 ? group.slice(1) : group}</i>
                  ))}
                  {completedBlocks < blocks && <em>_</em>}
                </span>
              )}
            </div>
            <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
          </section>

          <section className="explain-grid">
            <article>
              <span className="card-index">01 / 模块规则</span>
              <h2>14 个存储字 → 4 位精度</h2>
              <p>每块包含 14 个 16 位内存单元、本地扫描调度与一个 4 位显示端口。增加模块即线性增加容量。</p>
            </article>
            <article>
              <span className="card-index">02 / 通信代价</span>
              <h2>算法 O(n²)，实体约 O(n³)</h2>
              <p>ALU 要通过级联总线逐块读写。规模增长时，通信距离与时序也在增长，把原本的二次计算拖慢至约三次。</p>
            </article>
            <article>
              <span className="card-index">03 / 红石约束</span>
              <h2>内存两层错位，防止串扰</h2>
              <p>中继器相邻会串信号，所以正确版内存需要拉开间距、双层错位。体积约翻倍，但读写边界更可靠。</p>
            </article>
          </section>

          <button className="sketch-toggle" onClick={() => setShowSketch((value) => !value)} aria-expanded={showSketch}>
            <span><BookOpen /> 查看原始手稿与图例对照</span>
            <span>{showSketch ? '收起' : '展开'} <ChevronRight /></span>
          </button>
          {showSketch && (
            <figure className="sketch-panel">
              <img src={`${basePath}/architecture-sketch.png`} alt="原始手绘的 ALU、四个内存模块和通信总线架构图" />
              <figcaption>原始设计草图 · 网页中的 QUE / MDF / STEP / PRINT 四组信号与此处一一对应。</figcaption>
            </figure>
          )}
        </div>

        <aside className="metrics-rail">
          <div className="rail-heading"><span>TELEMETRY</span><span>02</span></div>
          <div className="metric-card accent-cyan">
            <MemoryStick />
            <span>存储字</span>
            <strong>{blocks * 14}</strong>
            <small>{blocks} 块 × 14</small>
          </div>
          <div className="metric-card accent-pink">
            <Braces />
            <span>总位宽</span>
            <strong>{blocks * 14 * 16}</strong>
            <small>BIT CAPACITY</small>
          </div>
          <div className="metric-card accent-amber">
            <Activity />
            <span>通信成本</span>
            <strong>{Math.pow(blocks, 3)}</strong>
            <small>RELATIVE n³</small>
          </div>
          <div className="cycle-card">
            <span>CURRENT CYCLE</span>
            <div className="cycle-ring" style={{ '--cycle': `${progress * 3.6}deg` } as React.CSSProperties}>
              <b>{progress}</b><small>%</small>
            </div>
            <dl>
              <div><dt>BLOCK</dt><dd>{String(activeBlock + 1).padStart(2, '0')}</dd></div>
              <div><dt>ADDRESS</dt><dd>{String(activeCell).padStart(2, '0')}</dd></div>
              <div><dt>PHASE</dt><dd>{['QUE', 'MUL', 'MDF', 'PRINT'][phase]}</dd></div>
            </dl>
          </div>
          <div className="architecture-note">
            <span>DESIGN NOTE</span>
            <p>内存是可复制的，ALU 只需一个。协作时可把每块内存分配给不同建造者，再用相同四线总线验收。</p>
          </div>
        </aside>
      </section>

      <footer>
        <span>MODULAR PI COMPUTER</span>
        <span>14 WORDS / BLOCK · 4 DIGITS / BLOCK · 16 BIT / WORD</span>
      </footer>
    </main>
  );
}
