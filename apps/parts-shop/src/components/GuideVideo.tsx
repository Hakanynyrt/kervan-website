import { FOCUS } from './Layout';
import type { Dict } from '../lib/dict';
import { GUIDE_STEPS } from '../lib/guide-steps';
import { GUIDE_VIDEOS, videoFiles } from '../lib/guide-videos';
import { GUIDES, type GuideKey } from '../lib/guides';
import type { Lang } from '../types';

/**
 * A guide's narrated video (guide-videos.ts), or nothing when it has none. Shown in the
 * prerendered page and under reduced motion too (design.md "Motion", exception for videos the
 * visitor starts): native controls, `preload="none"`, a poster, never autoplay / loop / muted;
 * TR and EN captions (the page language's track is the default); the synthetic voice is stated
 * under the player; an optional plain YouTube link (no embed); the narration as text below.
 */
export function GuideVideo({ k, lang, t }: { k: GuideKey; lang: Lang; t: Dict }) {
  const v = GUIDE_VIDEOS[k];
  if (!v) return null;
  const f = videoFiles(v);
  const m = t.guideMedia;
  const d = GUIDE_STEPS[k];
  return (
    <section aria-labelledby="guide-video" className="mt-10">
      <h2 id="guide-video" className="m-0 text-xl font-bold text-ink">
        {m.videoTitle}
      </h2>
      <video
        controls
        preload="none"
        playsInline
        width={v.w}
        height={v.h}
        poster={f.jpg}
        className="mt-4 block h-auto w-full rounded-sm border border-hair bg-stage"
      >
        <source src={f.mp4} type="video/mp4" />
        <track
          kind="captions"
          srcLang="tr"
          label={m.captionsTr}
          src={f.tr}
          default={lang === 'tr'}
        />
        <track
          kind="captions"
          srcLang="en"
          label={m.captionsEn}
          src={f.en}
          default={lang === 'en'}
        />
        <a href={f.mp4}>{m.videoFallback}</a>
      </video>
      {/* Only a voiced video says its voice is synthetic. */}
      {(v.voice !== 'none' || v.youtubeUrl) && (
        <p className="m-0 mt-2 text-sm leading-6 text-ink-mid">
          {v.voice !== 'none' && m.videoVoice}
          {v.youtubeUrl && (
            <>
              {v.voice !== 'none' && ' '}
              <a
                href={v.youtubeUrl}
                rel="noopener noreferrer"
                target="_blank"
                className={`text-ink underline max-lg:py-[14px] ${FOCUS}`}
              >
                {m.youtube}
                <span className="sr-only"> {m.newTab}</span>
              </a>
            </>
          )}
        </p>
      )}
      <details className="mt-3 text-[15px] leading-7 text-ink-mid">
        <summary className={`min-h-11 cursor-pointer py-2 font-medium text-ink ${FOCUS}`}>
          {m.videoTranscript}
        </summary>
        {/* Word for word what is spoken (scripts/guide-video/narration.ts): the article's title,
            then each step. */}
        <p className="m-0 mt-2">{GUIDES[lang].items[k].title}</p>
        {d.steps.map((s) => (
          <p key={s.id} className="m-0 mt-2">
            <strong className="font-semibold text-ink">{s.h[lang]}.</strong> {s.s[lang]}
          </p>
        ))}
      </details>
    </section>
  );
}
