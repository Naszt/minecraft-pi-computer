import { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import principleMarkdown from '../content/algorithm-principle.md?raw';

export default function PrinciplePage() {
  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const typeset = () => {
      if (cancelled) return;
      const mathJax = (window as Window & { MathJax?: { startup?: { promise?: Promise<unknown> }; typesetPromise?: () => Promise<unknown> } }).MathJax;
      if (mathJax?.startup?.promise && mathJax.typesetPromise) {
        void mathJax.startup.promise.then(() => mathJax.typesetPromise?.());
        return;
      }
      attempts += 1;
      if (attempts < 40) window.setTimeout(typeset, 100);
    };
    typeset();
    return () => { cancelled = true; };
  }, []);

  return (
    <>
      <article className="markdown-page">
        <ReactMarkdown>{principleMarkdown}</ReactMarkdown>
      </article>

      <section className="video-section principle-video">
        <div>
          <p className="kicker">Video walkthrough</p>
          <h2>配套讲解视频</h2>
          <p>视频与上面的推导配套；看完后可以进入“实体电路”，逐步观察同一算法如何在模块间运行。</p>
          <a href="https://www.bilibili.com/video/BV1HvhdzdEKy" target="_blank" rel="noreferrer">在哔哩哔哩打开 ↗</a>
        </div>
        <div className="video-frame">
          <iframe
            src="https://player.bilibili.com/player.html?bvid=BV1HvhdzdEKy&page=1&high_quality=1&danmaku=0"
            title="π 算法原理配套视频"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        </div>
      </section>
    </>
  );
}
