import type { AuctionStatus } from '../types/auction';

/** Mirrors the backend's AUCTION_STATUS_TRANSITIONS state machine, for UI purposes only — the server is the source of truth and re-validates every transition. */
export const ALLOWED_TRANSITIONS: Record<AuctionStatus, AuctionStatus[]> = {
  draft: ['scheduled', 'cancelled'],
  scheduled: ['live', 'cancelled'],
  live: ['paused', 'completed', 'cancelled'],
  paused: ['live', 'cancelled'],
  completed: [],
  cancelled: [],
};

export const TRANSITION_LABEL: Record<AuctionStatus, string> = {
  draft: 'Revert to draft',
  scheduled: 'Publish',
  live: 'Go live',
  paused: 'Pause',
  completed: 'Mark completed',
  cancelled: 'Cancel',
};
