import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import '../css/FormChart.css';

// Custom Dot Component for annotations
const CustomDot = (props) => {
  const { cx, cy, stroke, payload, dataKey } = props;
  if (payload[`${dataKey}_isHighest`]) {
    return (
      <g>
        <circle cx={cx} cy={cy} r={3} fill={stroke} stroke={stroke} strokeWidth={1} />
        <text x={cx} y={cy - 15} fill={stroke} textAnchor="middle" dominantBaseline="central" fontSize={14} fontWeight="bold">
          {dataKey}
        </text>
      </g>
    );
  }
  return <circle cx={cx} cy={cy} r={3} fill={stroke} stroke={stroke} strokeWidth={1} />; // Default dot
};

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

      // Store today's weight to display in the header line of the tooltip
      dataMap[date][`${horse.name}_todayWeight`] = horse.weight;

      // Determine if this is the highest rating for this horse
      let maxRatingForHorse = -1;
      horse.past.forEach(pr => {
        const prRating = parseFloat(pr.name);
        if (prRating > maxRatingForHorse) {
          maxRatingForHorse = prRating;
        }
      });
      if (parseFloat(race.name) === maxRatingForHorse) {
        dataMap[date][`${horse.name}_isHighest`] = true;
      }

      // Store race metadata for the tooltip
      const beaten = race.distBeaten ? ` (${race.distBeaten} l)` : '';
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
  '#e6194b', '#3cb44b', '#3b7944', '#4363d8', '#f58231', 
  '#911eb4', '#46f0f0', '#f032e6', '#b5d44f', '#fabebe', 
  '#008080', '#e6beff', '#9a6324', '#892e78', '#800000', 
  '#134b56', '#808000', '#ffd8b1', '#656591', '#808080'
];

  return (
    <div className="form-chart-container">
      <ResponsiveContainer width="100%" height={500}>
        <LineChart data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis domain={['auto', 'dataMax + 100']} label={{ value: 'Rating', angle: -90, position: 'insideLeft' }} />
          <Tooltip 
            itemSorter={(item) => -item.value}
            separator=""
            formatter={(value, name, entry) => {
              const details = entry.payload[`${name}_details`];
              const todayWeight = entry.payload[`${name}_todayWeight`];
              if (!details) return [value, name];
              const [raceInfo, ...performance] = details.split(' | ');
              return [
                <span key={name} style={{ display: 'block' }}>
                  <span style={{ color: entry.color, fontWeight: 'bold', display: 'block' }}>{`${name} (${todayWeight}) ${value}`}</span>
                  <span style={{ display: 'block' }}>{raceInfo}</span>
                  <span style={{ display: 'block', fontSize: '12px', opacity: 0.7, marginTop: '2px' }}>{performance.join(' • ')}</span>
                </span>,
                ''
              ];
            }}
          />
          {/* 3. Create a line for each horse */}
          {horses.map((horse, index) => (
            <Line 
              key={horse.name}
              type="linear" 
              dataKey={horse.name} 
              stroke={LINE_COLORS[index % LINE_COLORS.length]} 
              strokeWidth={2}
              dot={<CustomDot />}
              connectNulls // Essential! Connects dots even if a horse didn't race on a specific date
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default FormChart;
