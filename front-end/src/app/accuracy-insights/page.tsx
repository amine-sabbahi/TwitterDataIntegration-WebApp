'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, PieChart, Pie, Cell } from 'recharts';

interface Tweet {
  Tweet_ID: string;
  Entity: string;
  Tweet_Content: string;
  Predicted_Sentiment: 'Positive' | 'Negative' | 'Neutral' | 'Irrelevant';
  Accuracy: number;
}

const COLORS = {
  Positive: '#10B981',
  Negative: '#EF4444',
  Neutral: '#F59E0B',
  Irrelevant: '#6B7280',
};

export default function AccuracyInsights() {
  const [tweets, setTweets] = useState<Tweet[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:5000/data');
        const data = await response.json();
        setTweets(data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  // Data preparation
  const accuracyBins = Array.from({ length: 10 }, (_, i) => ({
    range: `${(i * 0.1).toFixed(1)}-${((i + 1) * 0.1).toFixed(1)}`,
    count: tweets.filter(tweet => tweet.Accuracy >= i * 0.1 && tweet.Accuracy < (i + 1) * 0.1).length,
  }));

  const accuracyBySentiment = Object.entries(COLORS).map(([sentiment]) => {
    const accuracies = tweets
      .filter(tweet => tweet.Predicted_Sentiment === sentiment)
      .map(tweet => tweet.Accuracy)
      .sort((a, b) => a - b);

    const q1 = accuracies[Math.floor(accuracies.length * 0.25)];
    const median = accuracies[Math.floor(accuracies.length * 0.5)];
    const q3 = accuracies[Math.floor(accuracies.length * 0.75)];

    return {
      sentiment,
      min: accuracies[0],
      q1,
      median,
      q3,
      max: accuracies[accuracies.length - 1],
    };
  });

  const accuracyCategories = Object.entries(COLORS).map(([sentiment]) => {
    const accuracies = tweets.filter(tweet => tweet.Predicted_Sentiment === sentiment).map(tweet => tweet.Accuracy);
    return {
      sentiment,
      low: accuracies.filter(acc => acc <= 0.3).length,
      medium: accuracies.filter(acc => acc > 0.3 && acc <= 0.7).length,
      high: accuracies.filter(acc => acc > 0.7).length,
    };
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Accuracy Insights</h1>

        {/* Histogram of Accuracy Distribution */}
        <Card className="p-4 mb-8">
          <CardHeader>
            <CardTitle>Accuracy Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={accuracyBins}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#2563EB" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Box Plot of Accuracy by Sentiment */}
        <Card className="p-4 mb-8">
          <CardHeader>
            <CardTitle>Accuracy by Sentiment</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={accuracyBySentiment}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="sentiment" />
                <YAxis domain={[0, 1]} />
                <Tooltip />
                <Bar dataKey="min" fill="#6B7280" stackId="a" />
                <Bar dataKey="q1" fill="#2563EB" stackId="a" />
                <Bar dataKey="median" fill="#10B981" stackId="a" />
                <Bar dataKey="q3" fill="#EF4444" stackId="a" />
                <Bar dataKey="max" fill="#F59E0B" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Stacked Bar Chart of Accuracy by Sentiment */}
        <Card className="p-4 mb-8">
          <CardHeader>
            <CardTitle>Accuracy Categories by Sentiment</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={accuracyCategories}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="sentiment" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="low" stackId="a" fill="#EF4444" />
                <Bar dataKey="medium" stackId="a" fill="#F59E0B" />
                <Bar dataKey="high" stackId="a" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Scatter Plot of Accuracy vs. Sentiment */}
        <Card className="p-4 mb-8">
          <CardHeader>
            <CardTitle>Accuracy vs. Sentiment</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="Predicted_Sentiment" />
                <YAxis dataKey="Accuracy" domain={[0, 1]} />
                <Tooltip />
                <Scatter data={tweets} fill="#2563EB" />
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}