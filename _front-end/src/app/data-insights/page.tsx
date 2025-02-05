'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, ScatterChart, Scatter, AreaChart, Area } from 'recharts';

interface Tweet {
  Tweet_ID: string;
  Entity: string;
  Tweet_Content: string;
  Predicted_Sentiment: 'Positive' | 'Negative' | 'Neutral' | 'Irrelevant';
  Accuracy: number;
  Timestamp: string; // Add a timestamp for real-time data
}

const COLORS = {
  Positive: '#10B981',
  Negative: '#EF4444',
  Neutral: '#F59E0B',
  Irrelevant: '#6B7280',
};

export default function DataInsights() {
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [sentimentCounts, setSentimentCounts] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:5000/data');
        const data = await response.json();
        setTweets((prev) => [...prev, ...data].slice(-100)); // Keep only the last 100 tweets
        updateSentimentCounts(data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    const updateSentimentCounts = (newTweets: Tweet[]) => {
      const counts = newTweets.reduce((acc, tweet) => {
        acc[tweet.Predicted_Sentiment] = (acc[tweet.Predicted_Sentiment] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      setSentimentCounts(Object.entries(counts).map(([name, value]) => ({ name, value })));
    };

    fetchData();
    const interval = setInterval(fetchData, 3000); // Fetch new data every 3 seconds
    return () => clearInterval(interval);
  }, []);

  // Prepare data for real-time charts
  const sentimentData = Object.entries(COLORS).map(([sentiment, color]) => ({
    sentiment,
    count: sentimentCounts.find((s) => s.name === sentiment)?.value || 0,
    color,
  }));

  const accuracyData = tweets.map((tweet, index) => ({
    id: index,
    accuracy: tweet.Accuracy,
    sentiment: tweet.Predicted_Sentiment,
  }));

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Real-Time Data Insights</h1>

        {/* Real-Time Line Chart */}
        <Card className="p-4 mb-8">
          <CardHeader>
            <CardTitle>Real-Time Sentiment Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={tweets}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="Timestamp" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="Accuracy" stroke="#2563EB" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Real-Time Bar Chart */}
        <Card className="p-4 mb-8">
          <CardHeader>
            <CardTitle>Real-Time Sentiment Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sentimentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="sentiment" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count">
                  {sentimentData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Real-Time Pie Chart */}
        <Card className="p-4 mb-8">
          <CardHeader>
            <CardTitle>Real-Time Sentiment Proportions</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sentimentCounts}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {sentimentCounts.map((entry, index) => (
                    <Cell key={index} fill={COLORS[entry.name as keyof typeof COLORS]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Real-Time Scatter Plot */}
        <Card className="p-4 mb-8">
          <CardHeader>
            <CardTitle>Real-Time Accuracy vs. Sentiment</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="sentiment" />
                <YAxis dataKey="accuracy" domain={[0, 1]} />
                <Tooltip />
                <Scatter data={accuracyData} fill="#2563EB" />
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}