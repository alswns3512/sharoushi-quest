'use client';

import { LevelUpModal } from './LevelUpModal';
import { AttendanceBonusModal } from './AttendanceBonusModal';
import { BadgeUnlockToast } from './BadgeUnlockToast';

export function GameOverlays() {
  return (
    <>
      <BadgeUnlockToast />
      <AttendanceBonusModal />
      <LevelUpModal />
    </>
  );
}
