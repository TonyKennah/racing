import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import '../css/FormChart.css';

const FormChart = ({ horses }) => {
  // 1. Transform data: Create a map of Date -> { [horseName]: rating }
  const dataMap = {};

  horses.forEach(horse => {
    horse.past.forEach(race => {
      // Use date as key. Format: "27/12/2025"
      const date = race.date; 
      if (!dataMap[date]) dataMap[date] = { date };
      
      // Convert the 'name' string (rating) to a number
      dataMap[date][horse.name] = parseFloat(race.name);

      // Store race metadata for the tooltip
      const beaten = race.distBeaten ? ` (btn ${race.distBeaten} l)` : '';
      dataMap[date][`${horse.name}_details`] = 
        `${race.time} ${race.course} (${race.distance}, ${race.going}) | ` +
        `Pos: ${race.position}${beaten} | Wt: ${race.weight}`;
    });
  });

  // 2. Convert map to a sorted array for the chart
  const chartData = Object.values(dataMap).sort((a, b) => {
    // Basic date sort (assuming DD/MM/YYYY format)
    const [da, ma, ya] = a.date.split('/');
    const [db, mb, yb] = b.date.split('/');
    return new Date(ya, ma-1, da) - new Date(yb, mb-1, db);
  });

  const LINE_COLORS = [
  '#e6194b', '#3cb44b', '#0a4313', '#4363d8', '#f58231', 
  '#911eb4', '#46f0f0', '#f032e6', '#3f2e7a', '#fabebe', 
  '#008080', '#e6beff', '#9a6324', '#892e78', '#800000', 
  '#134b56', '#808000', '#ffd8b1', '#000075', '#808080'
];

  return (
    <div className="form-chart-container">
      <ResponsiveContainer width="100%" height={500}>
        <LineChart data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis domain={['auto', 'auto']} label={{ value: 'Rating', angle: -90, position: 'insideLeft' }} />
          <Tooltip 
            formatter={(value, name, entry) => {
              const details = entry.payload[`${name}_details`];
              if (!details) return [value, name];
              const [raceInfo, ...performance] = details.split(' | ');
              return [
                <span key={name} style={{ display: 'block' }}>{value}
                  <span style={{ display: 'block' }}>{raceInfo}</span>
                  <span style={{ display: 'block', fontSize: '12px', opacity: 0.7, marginTop: '2px' }}>{performance.join(' • ')}</span>
                </span>,
                name
              ];
            }}
          />
          <Legend />
          {/* 3. Create a line for each horse */}
          {horses.map((horse, index) => (
            <Line 
              key={horse.name}
              type="linear" 
              dataKey={horse.name} 
              stroke={LINE_COLORS[index % LINE_COLORS.length]} 
              strokeWidth={2}
              dot={{ r: 2 }} 
              connectNulls // Essential! Connects dots even if a horse didn't race on a specific date
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default FormChart;
