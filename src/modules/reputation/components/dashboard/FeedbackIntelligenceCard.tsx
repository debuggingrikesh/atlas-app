'use client';

import React from 'react';
import { Bot, ThumbsDown, ThumbsUp, Activity, MessageSquare, Lightbulb, Copy, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FeedbackAnalysisOutput } from '@/modules/ai/types/ai-types';

interface FeedbackIntelligenceCardProps {
  analysis: FeedbackAnalysisOutput;
}

export function FeedbackIntelligenceCard({ analysis }: FeedbackIntelligenceCardProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(analysis.suggestedResponse);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'Positive': return 'bg-emerald-500/15 text-emerald-600 border-emerald-200';
      case 'Neutral': return 'bg-blue-500/15 text-blue-600 border-blue-200';
      case 'Negative': return 'bg-amber-500/15 text-amber-600 border-amber-200';
      case 'Very Negative': return 'bg-red-500/15 text-red-600 border-red-200';
      default: return 'bg-gray-500/15 text-gray-600 border-gray-200';
    }
  };

  const SentimentIcon = analysis.sentiment.includes('Negative') ? ThumbsDown : ThumbsUp;

  return (
    <Card className="mt-4 border-muted-foreground/20 bg-muted/30 shadow-none">
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b">
        <div className="flex items-center space-x-2">
          <Bot className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm font-semibold">Reputation Intelligence</CardTitle>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className={`flex items-center gap-1 ${getSentimentColor(analysis.sentiment)}`}>
            <SentimentIcon className="h-3 w-3" />
            {analysis.sentiment}
          </Badge>
          {analysis.confidenceScore && (
            <Badge variant="secondary" className="text-xs">
              {Math.round(analysis.confidenceScore * 100)}% Confidence
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-4 space-y-4">
        {/* Intelligence Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center text-xs font-medium text-muted-foreground">
              <Activity className="mr-1.5 h-3.5 w-3.5" />
              Customer Emotion
            </div>
            <p className="text-sm font-medium">{analysis.customerEmotion || 'Unknown'}</p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center text-xs font-medium text-muted-foreground">
              <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
              Main Issue / Driver
            </div>
            <p className="text-sm">{analysis.mainIssue || 'N/A'}</p>
          </div>
          
          <div className="space-y-1 md:col-span-2">
            <div className="flex items-center text-xs font-medium text-muted-foreground">
              <Lightbulb className="mr-1.5 h-3.5 w-3.5" />
              Recommended Action
            </div>
            <p className="text-sm text-primary font-medium">{analysis.recommendedAction || 'Respond professionally.'}</p>
          </div>
        </div>

        {/* Suggested Response */}
        {analysis.suggestedResponse && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-medium text-muted-foreground">Suggested Reply Draft</div>
              <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={handleCopy}>
                {copied ? <CheckCircle className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <div className="text-sm italic border-l-2 border-primary/40 pl-3 py-1 text-foreground/90">
              &quot;{analysis.suggestedResponse}&quot;
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
