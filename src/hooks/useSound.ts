'use client';

import { useCallback, useRef } from 'react';

export type SoundType =
  | 'correct'   // 퀴즈 정답
  | 'wrong'     // 퀴즈 오답
  | 'levelup'   // 레벨업
  | 'complete'  // 스테이지 클리어
  | 'tap'       // 일반 버튼 탭
  | 'navigate'  // 탭바 화면 이동
  | 'swipe'     // 플래시카드 스와이프
  | 'ding'      // 퀘스트 수령 / 소확행 보상
  | 'chime';    // 출석보너스 / 특별 보상

export function useSound() {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback((): AudioContext | null => {
    if (typeof window === 'undefined') return null;
    if (!audioCtxRef.current) {
      try { audioCtxRef.current = new AudioContext(); }
      catch { return null; }
    }
    return audioCtxRef.current;
  }, []);

  const play = useCallback((type: SoundType) => {
    const ctx = getCtx();
    if (!ctx) return;

    const now = ctx.currentTime;

    // ── 헬퍼: 단일 사인파 노트 ─────────────────────────────────
    const note = (freq: number, startTime: number, duration: number, gain: number, type: OscillatorType = 'sine') => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.connect(g);
      g.connect(ctx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);
      g.gain.setValueAtTime(0, startTime);
      g.gain.linearRampToValueAtTime(gain, startTime + 0.005); // 부드러운 어택
      g.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
      osc.start(startTime);
      osc.stop(startTime + duration + 0.01);
    };

    // ── 헬퍼: 주파수 글라이드 ──────────────────────────────────
    const glide = (freqFrom: number, freqTo: number, startTime: number, duration: number, gain: number) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.connect(g);
      g.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freqFrom, startTime);
      osc.frequency.exponentialRampToValueAtTime(freqTo, startTime + duration);
      g.gain.setValueAtTime(0, startTime);
      g.gain.linearRampToValueAtTime(gain, startTime + 0.003);
      g.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
      osc.start(startTime);
      osc.stop(startTime + duration + 0.01);
    };

    switch (type) {

      // ── 일반 버튼 탭: 부드럽고 짧은 "틱" ──────────────────────
      case 'tap':
        note(900, now, 0.06, 0.08);
        break;

      // ── 탭바 이동: 살짝 올라가는 2음 ─────────────────────────
      case 'navigate':
        note(600, now,        0.07, 0.07);
        note(800, now + 0.04, 0.07, 0.07);
        break;

      // ── 플래시카드 스와이프: 부드러운 글라이드 ────────────────
      case 'swipe':
        glide(500, 900, now, 0.1, 0.1);
        break;

      // ── 퀘스트 수령 / 소보상: 청량한 "딩" ────────────────────
      case 'ding':
        note(1047, now,        0.3, 0.15); // C6
        note(1319, now + 0.05, 0.25, 0.08); // E6 (화음)
        break;

      // ── 출석보너스 / 특별보상: 밝은 "딩동" ───────────────────
      case 'chime':
        note(784,  now,        0.35, 0.13); // G5
        note(1047, now + 0.07, 0.35, 0.13); // C6
        note(1319, now + 0.14, 0.4,  0.1);  // E6
        break;

      // ── 퀴즈 정답: 상승 3화음 ────────────────────────────────
      case 'correct':
        note(523, now,        0.18, 0.18); // C5
        note(659, now + 0.09, 0.18, 0.18); // E5
        note(784, now + 0.18, 0.22, 0.18); // G5
        break;

      // ── 퀴즈 오답: 낮고 짧은 2음 ─────────────────────────────
      case 'wrong':
        note(320, now,        0.15, 0.18, 'sawtooth');
        note(260, now + 0.12, 0.18, 0.15, 'sawtooth');
        break;

      // ── 레벨업: 화려한 상승 4음 ──────────────────────────────
      case 'levelup':
        note(523,  now,        0.15, 0.2);
        note(659,  now + 0.1,  0.15, 0.2);
        note(784,  now + 0.2,  0.15, 0.2);
        note(1047, now + 0.3,  0.4,  0.22);
        break;

      // ── 스테이지 클리어: 4음 화음 ────────────────────────────
      case 'complete':
        note(784,  now,        0.2,  0.18);
        note(880,  now + 0.08, 0.2,  0.18);
        note(988,  now + 0.16, 0.2,  0.18);
        note(1047, now + 0.24, 0.35, 0.2);
        break;
    }
  }, [getCtx]);

  return { play };
}
