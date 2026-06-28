import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer } from 'recharts';

const CAT_COLOR = {
  guidance: '#c9a84c',
  risk:     '#ff4d4d',
  revenue:  '#00c48c',
};

export default function KeywordChart({ keywords }) {
  if (!keywords?.length) return null;
  const data = keywords.slice(0, 10).map(k => ({
    name: k.word,
    count: k.count,
    category: k.category,
  }));

  return (
    <div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
        {Object.entries(CAT_COLOR).map(([cat, color]) => (
          <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
            <span style={{ color: '#8892a4', fontSize: 11, textTransform: 'capitalize', fontFamily: "'IBM Plex Mono', monospace" }}>{cat}</span>
          </div>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16 }}>
          <XAxis type="number" tick={{ fill: '#8892a4', fontSize: 10, fontFamily: 'IBM Plex Mono' }} />
          <YAxis type="category" dataKey="name" width={110}
            tick={{ fill: '#f0f2f5', fontSize: 10, fontFamily: 'IBM Plex Mono' }} />
          <Tooltip
            contentStyle={{ background: '#0d1f3c', border: '1px solid #1e3a5f', borderRadius: 6 }}
            labelStyle={{ color: '#f0f2f5', fontFamily: 'IBM Plex Mono', fontSize: 12 }}
            itemStyle={{ color: '#8892a4' }}
          />
          <Bar dataKey="count" radius={[0, 3, 3, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={CAT_COLOR[entry.category] || '#8892a4'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}