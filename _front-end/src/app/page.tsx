// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Scatter, ScatterChart, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart, Bar } from 'recharts';
import { PieChart, Pie, Cell } from 'recharts';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { Twitter, Building2 } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';

interface Tweet {
  Tweet_ID: string;
  Entity: string;
  Tweet_Content: string;
  Predicted_Sentiment: 'Positive' | 'Negative' | 'Neutral' | 'Irrelevant';
  Accuracy: number;
}

interface SentimentCount {
  name: string;
  value: number;
}

const COLORS = {
  Positive: '#10B981',
  Negative: '#EF4444',
  Neutral: '#F59E0B',
  Irrelevant: '#6B7280'
};

export default function Dashboard() {
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [sentimentCounts, setSentimentCounts] = useState<SentimentCount[]>([]);
  const [uniqueEntities, setUniqueEntities] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:5000/data');
        const data = await response.json();
        setTweets(data);
        
        // Calculate sentiment counts
        const counts = data.reduce((acc: any, tweet: Tweet) => {
          acc[tweet.Predicted_Sentiment] = (acc[tweet.Predicted_Sentiment] || 0) + 1;
          return acc;
        }, {});
        
        const entities = new Set(data.map((tweet: Tweet) => tweet.Entity));
        setUniqueEntities(entities);

        setSentimentCounts(Object.entries(counts).map(([name, value]) => ({ name, value })));
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const totalTweets = tweets.length;

  return (
    <div className="flex">
      <Sidebar />
      <div className="max-w-7xl mx-auto">
            {/* Top section */}
            <div id="dashboard-top" className="relative overflow-hidden mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 transform skew-y-[-3deg] origin-top-left"></div>
              <div className="relative z-10 py-12">
                <h1 className="text-5xl font-extrabold text-center text-white mb-4 animate-fade-in">
                  <span className="inline-flex items-center">
                    <Twitter className="h-12 w-12 mr-4 animate-bounce" />
                    Twitter Sentiment Dashboard
                  </span>
                </h1>
                <p className="text-lg text-center text-gray-200 animate-fade-in-up">
                  Real-time sentiment analysis of tweets
                </p>
              </div>
            </div> 

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        
        {/* Total Tweets Card */}
        <Card className="bg-blue-50">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl flex items-center justify-center gap-2">
              <Twitter className="h-6 w-6 text-blue-500" />
              Total Tweets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-center text-blue-600">
              {totalTweets}
            </div>
            <p className="text-sm text-center text-gray-600 mt-2">
              Real-time tweet count
            </p>
          </CardContent>
        </Card>

        {/* Unique Entities Card */}
        <Card className="bg-purple-50">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl flex items-center justify-center gap-2">
              <Building2 className="h-6 w-6 text-purple-500" />
              Unique Entities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-center text-purple-600">
              {uniqueEntities.size}
            </div>
            <p className="text-sm text-center text-gray-600 mt-2">
              Distinct accounts (organizations) tracked
            </p>
          </CardContent>
        </Card>
      </div>

            {/* Sentiment Count Cards */}
            <div id="sentiment-cards">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                {Object.entries(COLORS).map(([sentiment, color]) => {
                  const count = sentimentCounts.find(s => s.name === sentiment)?.value || 0;
                  const percentage = totalTweets ? ((count / totalTweets) * 100).toFixed(1) : '0';
                  return (
                    <Card key={sentiment} style={{ backgroundColor: color, color: '#ffffff' }}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">{sentiment}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {count} <span className="text-sm text-gray-200">({percentage}%)</span>
                        </div>
                      </CardContent>
                    </Card>
                    );
                  })}
              </div>
            </div>
        {/* Charts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">    
          {/* Pie Chart */}
          <Card className="p-4">
            <CardHeader className="text-center">
              <CardTitle className="text-center">Sentiment Proportions</CardTitle>
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
                    innerRadius={60}
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
          {/* Radar Chart */}
          <Card className="p-4">
            <CardHeader className="text-center">
              <CardTitle className="text-center">Sentiment Pattern</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%">
                  <PolarGrid />
                  <PolarAngleAxis dataKey="name" />
                  <PolarRadiusAxis />
                  <Radar
                    name="Sentiments"
                    dataKey="value"
                    data={sentimentCounts}
                    fill="#2563EB"
                    fillOpacity={0.6}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
        <div id="sentiment-distribution">
        <div className="max-w-7xl mx-auto gap-8 mb-8">
            {/* Bar Chart */}
          <Card className="p-4">
            <CardHeader className="text-center">
              <CardTitle className="text-center">Sentiment Distribution</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sentimentCounts}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value">
                    {sentimentCounts.map((entry, index) => (
                      <Cell key={index} fill={COLORS[entry.name as keyof typeof COLORS]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          </div>
        <div className="max-w-7xl mx-auto">
         {/* Scatter Plot of Accuracy vs. Sentiment */}
          <Card className="p-4 mb-8">
            <CardHeader className="text-center">
              <CardTitle className="text-center">Accuracy vs. Sentiment</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="Predicted_Sentiment" />
                  <YAxis dataKey="Accuracy" domain={[0, 1]} />
                  <Tooltip />
                  <Scatter data={tweets} fill="#8884d8">
                    {tweets.map((tweet, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[tweet.Predicted_Sentiment as keyof typeof COLORS]}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
        </div>
        <div id="tweets-table">
        {/* Tweets Table */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-center">Recent Tweets</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="p-4 text-left">Tweet ID</th>
                  <th className="p-4 text-left">Entity</th>
                  <th className="p-4 text-left">Content</th>
                  <th className="p-4 text-left">Sentiment</th>
                  <th className="p-4 text-left">Accuracy</th>
                </tr>
              </thead>
              <tbody>
                {tweets.slice(-10).map((tweet) => (
                  <tr key={tweet.Tweet_ID} className="border-b hover:bg-gray-50 transition-all">
                    <td className="p-4">{tweet.Tweet_ID}</td>
                    <td className="p-4">{tweet.Entity}</td>
                    <td className="p-4 truncate max-w-md">{tweet.Tweet_Content}</td>
                    <td
                      className="p-4 font-medium"
                      style={{
                        backgroundColor: COLORS[tweet.Predicted_Sentiment as keyof typeof COLORS],
                        color: '#ffffff', // White text for better contrast
                      }}
                    >
                      {tweet.Predicted_Sentiment}
                    </td>
                    <td className="p-4">{tweet.Accuracy.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        </div>
      </div>
    </div>
  );
}