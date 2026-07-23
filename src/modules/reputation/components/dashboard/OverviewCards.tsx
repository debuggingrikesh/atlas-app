 

import React from 'react';
import { Card } from '@/components/ui/card';
import { Send, Eye, CheckCircle2, ThumbsUp, AlertCircle } from 'lucide-react';

interface OverviewCardsProps {
  stats: {
    totalRequests: number;
    openedRequests: number;
    completedRequests: number;
    positiveFeedback: number;
    privateFeedbackCount: number;
  };
}

export function OverviewCards({ stats }: OverviewCardsProps) {
  const openRate = stats.totalRequests > 0 
    ? Math.round((stats.openedRequests / stats.totalRequests) * 100) 
    : 0;

  const completionRate = stats.totalRequests > 0 
    ? Math.round((stats.completedRequests / stats.totalRequests) * 100) 
    : 0;

  const cards = [
    {
      title: 'Review Requests',
      value: stats.totalRequests,
      description: 'Total review requests sent',
      icon: Send,
      color: 'text-blue-500 bg-blue-50',
    },
    {
      title: 'Open Rate',
      value: `${openRate}%`,
      description: `${stats.openedRequests} requests opened`,
      icon: Eye,
      color: 'text-indigo-500 bg-indigo-50',
    },
    {
      title: 'Completion Rate',
      value: `${completionRate}%`,
      description: `${stats.completedRequests} reviews completed`,
      icon: CheckCircle2,
      color: 'text-green-500 bg-green-50',
    },
    {
      title: 'Positive Experiences',
      value: stats.positiveFeedback,
      description: 'Ratings above threshold',
      icon: ThumbsUp,
      color: 'text-amber-500 bg-amber-50',
    },
    {
      title: 'Private Feedback',
      value: stats.privateFeedbackCount,
      description: 'Unread internal feedback',
      icon: AlertCircle,
      color: stats.privateFeedbackCount > 0 ? 'text-destructive bg-destructive/10' : 'text-muted-foreground bg-muted',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className="p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">{card.title}</span>
              <div className={`p-2 rounded-lg ${card.color}`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold tracking-tight">{card.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
