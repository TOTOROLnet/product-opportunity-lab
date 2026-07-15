/**
 * 浏览器原生语音封装（window.speechSynthesis）。
 * 这不是外部 API、不需要 key、不上传任何数据——纯客户端能力。
 * 环境不支持时全部降级为 no-op，播放器改用定时器驱动进度条 + 文字高亮。
 */

export function speechAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

function pickZhVoice(): SpeechSynthesisVoice | undefined {
  if (!speechAvailable()) return undefined;
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => /zh|cmn|Chinese/i.test(v.lang)) ??
    voices.find((v) => /zh|cmn|Chinese/i.test(v.name))
  );
}

/** 朗读一段文本。返回一个取消函数。rate 支持倍速。 */
export function speak(text: string, rate = 1): () => void {
  if (!speechAvailable()) return () => {};
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-CN';
    u.rate = rate;
    const v = pickZhVoice();
    if (v) u.voice = v;
    window.speechSynthesis.speak(u);
  } catch {
    return () => {};
  }
  return cancelSpeech;
}

export function cancelSpeech(): void {
  if (!speechAvailable()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    /* ignore */
  }
}
