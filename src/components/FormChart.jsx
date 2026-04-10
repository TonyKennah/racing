import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import '../css/FormChart.css';

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
  return <circle cx={cx} cy={cy} r={3} fill={stroke} stroke={stroke} strokeWidth={1} />;
};

const FormChart = ({ horses }) => {
  const dataMap = useMemo(() => {
    const map = {};

    horses.forEach(horse => {
      horse.past.forEach(race => {
        const date = race.date;
        if (!map[date]) map[date] = { date };

        map[date][horse.name] = parseFloat(race.name);
        map[date][`${horse.name}_todayWeight`] = horse.weight;

        const maxRatingForHorse = Math.max(...horse.past.map(pr => parseFloat(pr.name)));

        if (parseFloat(race.name) === maxRatingForHorse) {
          map[date][`${horse.name}_isHighest`] = true;
        }

        const beaten = race.distBeaten ? ` (${race.distBeaten} l)` : '';
        map[date][`${horse.name}_details`] = 
          `${race.time} ${race.course} (${race.distance}, ${race.going}) | ` +
          `Pos: ${race.position}${beaten} | Wt: ${race.weight}`;
      });
    });

    return map;
  }, [horses]);

  const chartData = useMemo(() => {
    const data = Object.values(dataMap).sort((a, b) => {
      const [da, ma, ya] = a.date.split('/');
      const [db, mb, yb] = b.date.split('/');
      return new Date(ya, ma-1, da) - new Date(yb, mb-1, db);
    });
    return data;
  }, [dataMap]);

  const LINE_COLORS = [
    '#e6194b', '#3cb44b', '#3b7944', '#4363d8', '#f58231', 
    '#911eb4', '#46f0f0', '#f032e6', '#b5d44f', '#fabebe', 
    '#008080', '#e6beff', '#9a6324', '#892e78', '#800000', 
    '#134b56', '#808000', '#ffd8b1', '#656591', '#808080'
  ];

  return (
    <div className="form-chart-container">
      <ResponsiveContainer width="100%" height={500}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
          {horses.map((horse, index) => (
            <Line 
              key={horse.name}
              type="linear" 
              dataKey={horse.name} 
              stroke={LINE_COLORS[index % LINE_COLORS.length]} 
              strokeWidth={2}
              dot={<CustomDot />}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default FormChart;