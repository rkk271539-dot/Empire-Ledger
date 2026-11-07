import React from 'react';
import { Card } from '../components/Card';
import { useGameStore } from '../../store/gameStore';
import { Newspaper } from 'lucide-react';

export const NewsTab: React.FC = () => {
  const { state } = useGameStore();

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      <div>
        <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-blue-400" />
          The Financial Wire & Daily Dispatches
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Comprehensive 10-day reports covering markets, rivals, society & rumors · Roadmap: v0.7
        </p>
      </div>

      <div className="space-y-3">
        {state.news.map((newsDay) => (
          <Card
            key={newsDay.day}
            title={`Day ${newsDay.day} Daily Edition`}
            subtitle="Full Dispatches"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {newsDay.articles.map((art) => (
                <div
                  key={art.id}
                  className="p-3 bg-gray-950/60 rounded-lg border border-gray-800 hover:border-gray-700 transition"
                >
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-semibold text-blue-400 uppercase tracking-wider">
                      {art.section}
                    </span>
                    <span className="text-gray-500">{art.sourceName}</span>
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm text-gray-100 mb-1">
                    {art.headline}
                  </h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {art.body}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
