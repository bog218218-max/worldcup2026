"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import type { PlayerCardInfo } from "@/lib/services/cards";
import "./PlayerFantasyCard.css";

export function PlayerFantasyCard({ card }: { card: PlayerCardInfo }) {
  const [flipped, setFlipped] = useState(false);
  const { user, stats } = card;

  // Determine visual tier based on OVR or Archetype
  let tier = "bronze";
  if (stats.ovr >= 85) tier = "legend";
  else if (stats.ovr >= 70) tier = "gold";
  else if (stats.ovr >= 50) tier = "silver";

  const isNovice = stats.archetypeCode === "НОВ";

  const PLACEHOLDER_PHOTOS = [
    "https://images.pexels.com/photos/29563571/pexels-photo-29563571.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    "https://images.pexels.com/photos/17191688/pexels-photo-17191688.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    "https://images.pexels.com/photos/16155640/pexels-photo-16155640.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    "https://images.pexels.com/photos/12174516/pexels-photo-12174516.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    "https://images.pexels.com/photos/36645466/pexels-photo-36645466.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
  ];
  const placeholderIndex = Array.from(user.slug).reduce((acc, char) => acc + char.charCodeAt(0), 0) % PLACEHOLDER_PHOTOS.length;
  const photoUrl = user.avatarUrl || PLACEHOLDER_PHOTOS[placeholderIndex];

  return (
    <div className="flex justify-center w-full">
      <div 
        className={clsx(
          "fantasy-card-wrapper",
          `glow-${tier}`,
          flipped && "flipped"
        )}
        onClick={() => setFlipped(!flipped)}
      >
        <div className="fantasy-card-inner">
          {/* FRONT */}
          <div className={clsx("fantasy-front", `tier-${tier}`)}>
            {/* Background Image / Placeholder */}
            <div className="fantasy-image-wrapper">
              <img 
                src={photoUrl} 
                alt={user.displayName}
                className="w-full h-full object-cover object-top"
              />
            </div>

            <div className="fantasy-image-gradient"></div>
            <div className="fantasy-bottom-gradient"></div>

            {/* Front Content Overlays */}
            <div className="fantasy-front-content">
              
              {/* Top Left Stats */}
              <div className="fantasy-top-left">
                <div className="fantasy-overall">{isNovice ? "??" : stats.ovr}</div>
                <div className="fantasy-pos">{stats.archetypeCode}</div>
                <div className="fantasy-suit">♠</div>
              </div>

              {/* Bottom Info Section */}
              <div className="fantasy-bottom-info">
                <div className="fantasy-name">{user.displayName}</div>
                
                <div className="fantasy-stats-grid">
                  <div className="fantasy-stats-col left-col">
                    <div className="fantasy-stat-row">
                      <span className="fantasy-stat-val">{isNovice ? "-" : stats.acc}</span>
                      <span className="fantasy-stat-lbl">ТОЧ</span>
                    </div>
                    <div className="fantasy-stat-row">
                      <span className="fantasy-stat-val">{isNovice ? "-" : stats.dif}</span>
                      <span className="fantasy-stat-lbl">РАЗ</span>
                    </div>
                    <div className="fantasy-stat-row">
                      <span className="fantasy-stat-val">{isNovice ? "-" : stats.rsk}</span>
                      <span className="fantasy-stat-lbl">РИС</span>
                    </div>
                  </div>
                  
                  <div className="fantasy-stats-col right-col">
                    <div className="fantasy-stat-row">
                      <span className="fantasy-stat-val">{isNovice ? "-" : stats.exa}</span>
                      <span className="fantasy-stat-lbl">СЧТ</span>
                    </div>
                    <div className="fantasy-stat-row">
                      <span className="fantasy-stat-val">{isNovice ? "-" : stats.str}</span>
                      <span className="fantasy-stat-lbl">СЕР</span>
                    </div>
                    <div className="fantasy-stat-row">
                      <span className="fantasy-stat-val">{isNovice ? "-" : stats.frm}</span>
                      <span className="fantasy-stat-lbl">ФОР</span>
                    </div>
                  </div>
                </div>

                <div className="fantasy-pill">
                  {stats.archetype}
                </div>
              </div>
            </div>
          </div>

          {/* BACK */}
          <div className={clsx("fantasy-back", `tier-${tier}`)}>
            <div className="fantasy-back-name">{user.displayName}</div>
            <div className="fantasy-back-nick">{stats.archetype}</div>
            
            <div className="fantasy-back-stats">
              <div className="fbs-row pts-row">
                <span className="fbs-lbl">Очки</span>
                <span className="fbs-val">{stats.totalPoints}</span>
              </div>
              <div className="fbs-row">
                <span className="fbs-lbl">Средний балл</span>
                <span className="fbs-val">{stats.averagePoints.toFixed(2)}</span>
              </div>
              <div className="fbs-row">
                <span className="fbs-lbl">Прогнозов</span>
                <span className="fbs-val">{stats.predictionCount}</span>
              </div>
              <div className="fbs-row">
                <span className="fbs-lbl">Точных счетов</span>
                <span className="fbs-val">{stats.exactCount}</span>
              </div>
              <div className="fbs-row">
                <span className="fbs-lbl">Мимо</span>
                <span className="fbs-val">{stats.missCount}</span>
              </div>
            </div>

            <Link 
              href={`/player/${user.slug}`}
              className="fantasy-back-link"
              onClick={(e) => e.stopPropagation()}
            >
              Профиль
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
