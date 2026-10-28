/** sessionStorage key set once the intro curtain (IntroOverlay) has played in this visit; the
 *  prerender's head script reads it too, to hide the static page only while the curtain is due. */
export const INTRO_SESSION_KEY = 'kv_v2_intro_seen';
