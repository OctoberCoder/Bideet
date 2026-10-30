import { useEffect, useRef, useState } from 'react';
import { fetchBids } from '../api/bids';
import type { Bid } from '../api/bids';
import { getSocket } from '../realtime/socket';

interface BidAcceptedEvent {
  auctionId: string;
  bidId: string;
  amountMinor: number;
  bidderId: string;
  createdAt: string;
  currentEndTime: string;
}

interface AuctionStatusEvent {
  auctionId: string;
  status: string;
}

interface AuctionCompletedEvent {
  auctionId: string;
  hasWinner: boolean;
  winningBidderId?: string;
  winningAmountMinor?: number;
  orderId?: string;
}

/**
 * Joins the auction's live room over WebSocket and keeps a rolling bid feed.
 * `liveCurrentBid`/`liveEndTime`/`liveStatus` are null until the first event
 * arrives — callers should fall back to the REST-fetched auction until then.
 */
export function useLiveAuctionRoom(auctionId: string) {
  const [bids, setBids] = useState<Bid[]>([]);
  const [liveCurrentBid, setLiveCurrentBid] = useState<number | null>(null);
  const [liveEndTime, setLiveEndTime] = useState<string | null>(null);
  const [liveStatus, setLiveStatus] = useState<string | null>(null);
  const [completedEvent, setCompletedEvent] = useState<AuctionCompletedEvent | null>(null);
  const bidsLoaded = useRef(false);

  useEffect(() => {
    if (!auctionId) return;

    let cancelled = false;
    fetchBids(auctionId)
      .then((data) => {
        if (!cancelled) {
          setBids(data);
          bidsLoaded.current = true;
        }
      })
      .catch(() => undefined);

    const socket = getSocket();
    socket.emit('auction:join', auctionId);

    const onBidAccepted = (event: BidAcceptedEvent) => {
      if (event.auctionId !== auctionId) return;
      setLiveCurrentBid(event.amountMinor);
      setLiveEndTime(event.currentEndTime);
      setBids((prev) => [
        { id: event.bidId, auctionId: event.auctionId, bidderId: event.bidderId, amountMinor: event.amountMinor, createdAt: event.createdAt },
        ...prev,
      ]);
    };

    const onStatusChanged = (event: AuctionStatusEvent) => {
      if (event.auctionId !== auctionId) return;
      setLiveStatus(event.status);
    };

    const onCompleted = (event: AuctionCompletedEvent) => {
      if (event.auctionId !== auctionId) return;
      setCompletedEvent(event);
      setLiveStatus('completed');
    };

    socket.on('bid:accepted', onBidAccepted);
    socket.on('auction:status', onStatusChanged);
    socket.on('auction:completed', onCompleted);

    return () => {
      cancelled = true;
      socket.emit('auction:leave', auctionId);
      socket.off('bid:accepted', onBidAccepted);
      socket.off('auction:status', onStatusChanged);
      socket.off('auction:completed', onCompleted);
    };
  }, [auctionId]);

  return { bids, liveCurrentBid, liveEndTime, liveStatus, completedEvent };
}
