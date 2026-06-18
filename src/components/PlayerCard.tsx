"use client";

import React, { useState } from "react";
import Image from "next/image";

export type PlayerTier = "legend" | "gold" | "silver";

export interface PlayerStats {
  ovr: number;
  pts: number;
  acc: number;
  exc: number;
  avg: number;
  tier: PlayerTier;
  playstyle: string;
  playstyleDesc: string;
}

export interface PlayerCardProps {
  user: {
    displayName: string;
    avatarUrl?: string | null;
    avatarEmoji?: string;
  };
  stats: PlayerStats;
}

export function PlayerCard({ user, stats }: PlayerCardProps) {
  const [flipped, setFlipped] = useState(false);

  const tierClass = `fifa-tier-${stats.tier}`;
  const glowClass = `glow-${stats.tier}`;

  // Use the first letter if no avatar is present
  const firstLetter = user.displayName.charAt(0).toUpperCase();

  return (
    <div className="flex justify-center w-full">
      <div 
        className={`fifa-flip-wrapper hot-glow ${glowClass} ${flipped ? "flipped" : ""}`}
        onClick={() => setFlipped(!flipped)}
      >
        <div className="fifa-flip-inner">
          {/* FRONT */}
          <div className={`fifa-front ${tierClass}`}>
            <div className="fifa-frame"></div>
            <div className="fifa-glare"></div>
            <div className="fifa-photo-section">
              <div className="fifa-avatar">
                {user.avatarUrl ? (
                  <Image 
                    src={user.avatarUrl} 
                    alt={user.displayName}
                    fill
                    className="object-cover"
                  />
                ) : user.avatarEmoji ? (
                  <span className="text-[calc(var(--cw)*0.35)] leading-none">{user.avatarEmoji}</span>
                ) : (
                  <span>{firstLetter}</span>
                )}
              </div>
              <div className="fifa-top-left">
                <div className="fifa-overall">{stats.ovr}</div>
                <div className="fifa-pos">OVR</div>
                <div className="fifa-suit">⚽</div>
              </div>
            </div>
            
            <div className="fifa-divider"></div>
            <div className="fifa-name">{user.displayName}</div>
            
            <div className="fifa-attrs">
              <div className="fifa-attr">
                <span className="fifa-attr-val">{stats.pts}</span>
                <span className="fifa-attr-lbl">PTS</span>
              </div>
              <div className="fifa-attr">
                <span className="fifa-attr-val">{stats.acc}%</span>
                <span className="fifa-attr-lbl">ACC</span>
              </div>
              <div className="fifa-attr">
                <span className="fifa-attr-val">{stats.exc}</span>
                <span className="fifa-attr-lbl">EXC</span>
              </div>
              <div className="fifa-attr">
                <span className="fifa-attr-val">{stats.avg.toFixed(1)}</span>
                <span className="fifa-attr-lbl">AVG</span>
              </div>
            </div>
            <div className="fifa-playstyle mt-2">{stats.playstyle}</div>
          </div>

          {/* BACK */}
          <div className={`fifa-back ${tierClass}`}>
            <div className="fifa-frame"></div>
            <div className="fifa-glare"></div>
            
            <div className="fifa-back-name">{user.displayName}</div>
            <div className="fifa-back-nick">{stats.playstyle}</div>
            <div className="fifa-back-desc mt-3 text-sm opacity-80 leading-snug px-2">
              {stats.playstyleDesc}
            </div>
            
            <div className="fifa-back-stats">
              <div className="fbs-row">
                <span className="fbs-lbl">Очки</span>
                <span className="fbs-val">{stats.pts}</span>
              </div>
              <div className="fbs-row">
                <span className="fbs-lbl">Точность</span>
                <span className="fbs-val">{stats.acc}%</span>
              </div>
              <div className="fbs-row">
                <span className="fbs-lbl">Точный счет</span>
                <span className="fbs-val">{stats.exc}</span>
              </div>
              <div className="fbs-row">
                <span className="fbs-lbl">Средний балл</span>
                <span className="fbs-val">{stats.avg.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
