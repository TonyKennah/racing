import React, { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import '../css/FormChart.css';

const CustomDot = (props) => {
  const { cx, cy, stroke, payload, dataKey } = props;
  if (payload[`${dataKey}_isHighest`]) {
    const odds = payload[`${dataKey}_latestOdds`];
    return (
      <g>
        <circle cx={cx} cy={cy} r={3} fill={stroke} stroke={stroke} strokeWidth={1} />
        <text x={cx} y={cy - 15} fill={stroke} textAnchor="middle" dominantBaseline="central" fontSize={14} fontWeight="bold">
          {`${dataKey} ${odds}`}
        </text>
      </g>
    );
  }
  return <circle cx={cx} cy={cy} r={3} fill={stroke} stroke={stroke} strokeWidth={1} />;
};

const FormChart = ({ horses }) => {
  const [top2Only, setTop2Only] = useState(false);

  const chartData = useMemo(() => {
    const map = {};

    horses.forEach(horse => {
      const lastOdd = horse.odds?.[horse.odds.length - 1];
      const displayOdd = lastOdd === "null" ? "NR" : (lastOdd ? (isNaN(lastOdd) ? lastOdd : Number(lastOdd)) : "x");

      horse.past.forEach(race => {
        // Filter logic: If top2Only is active, include 1st, 2nd, or beaten < 2 lengths
        if (top2Only) {
            const posStr = race.position ? race.position.toString().trim() : "";
            const actualPos = posStr.split('/')[0]; // Extract the finishing position from format "3/4"
            const isTop2 = actualPos === "1" || actualPos === "2";
            
            let isClose = false;
            if (race.distBeaten) {
                const distStr = race.distBeaten.toLowerCase().trim();
                // Handle common racing abbreviations for small distances (shd, hd, nk, etc.)
                const abbreviations = ['shd', 'hd', 'nk', 'snk', 'dht'];
                if (abbreviations.includes(distStr)) {
                    isClose = true;
                } else {
                    const distNum = parseFloat(distStr);
                    if (!isNaN(distNum) && distNum < 2) isClose = true;
                }
            }
            
            if (!isTop2 && !isClose) return;
        }

        const [d, m, y] = race.date.split('/');
        const timestamp = new Date(y, m - 1, d).getTime();

        if (!map[timestamp]) map[timestamp] = { timestamp, date: race.date };

        map[timestamp][horse.name] = parseFloat(race.name);
        map[timestamp][`${horse.name}_todayWeight`] = horse.weight;
        map[timestamp][`${horse.name}_latestOdds`] = displayOdd;

        const maxRatingForHorse = Math.max(...horse.past.map(pr => parseFloat(pr.name)));

        if (parseFloat(race.name) === maxRatingForHorse) {
          map[timestamp][`${horse.name}_isHighest`] = true;
        }

        const beaten = race.distBeaten ? ` (${race.distBeaten} l)` : '';
        map[timestamp][`${horse.name}_details`] = 
          `${race.time} ${race.course} (Class ${race.raceClass}, ${race.distance}, ${race.going}) | ` +
          `Pos: ${race.position}${beaten} | Wt: ${race.weight}`;
      });
    });

    return Object.values(map).sort((a, b) => a.timestamp - b.timestamp);
  }, [horses, top2Only]);

  const LINE_COLORS = [
    '#e6194b', '#3cb44b', '#3b7944', '#4363d8', '#f58231', 
    '#911eb4', '#46f0f0', '#f032e6', '#b5d44f', '#fabebe', 
    '#008080', '#e6beff', '#9a6324', '#854779', '#bb6868', 
    '#134b56', '#808000', '#ffd8b1', '#656591', '#808080'
  ];

  return (
    <div className="form-chart-container">
      <div className="chart-controls" style={{ marginBottom: '10px', textAlign: 'right' }}>
        <button 
          className={`race-analytics-btn ${top2Only ? 'active' : ''}`}
          onClick={() => setTop2Only(!top2Only)}
        >
          {top2Only ? 'Showing Top 2 or < 2l' : 'Filter Top 2 or < 2l'}
        </button>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <XAxis 
            dataKey="timestamp" 
            type="number"
            domain={['dataMin', 'dataMax']}
            tickFormatter={(unixTime) => {
              const date = new Date(unixTime);
              const d = date.getDate();
              const m = date.toLocaleString('default', { month: 'short' });
              return `${d} ${m}`;
            }}
            tick={{ fill: 'var(--text)', fontSize: 12 }} 
          />
          <YAxis 
            domain={['auto', dataMax => Math.round(dataMax * 1.05)]} 
            tick={{ fill: 'var(--text)', fontSize: 12 }}
            label={{ value: 'Rating', angle: -90, position: 'insideLeft', fill: 'var(--text)' }} 
          />
          <Tooltip 
            itemSorter={(item) => -item.value}
            separator=""
            labelFormatter={(label) => {
              if (isNaN(label)) return label;
              const date = new Date(label);
              return date.toLocaleDateString('en-GB', {
                day: '2-digit', month: '2-digit', year: 'numeric'
              });
            }}
            formatter={(value, name, entry) => {
              const details = entry.payload[`${name}_details`];
              const todayWeight = entry.payload[`${name}_todayWeight`];
              const latestOdds = entry.payload[`${name}_latestOdds`];
              if (!details) return [value, name];
              const [raceInfo, ...performance] = details.split(' | ');
              return [
                <span key={name} style={{ display: 'block' }}>
                  <span style={{ fontWeight: 'bold', display: 'block' }}>
                    <span style={{ color: entry.color }}>{name} {latestOdds}</span>
                    <span style={{ color: 'var(--text-h)' }}>{` (${todayWeight}) ${value}`}</span>
                  </span>
                  <span style={{ display: 'block' }}>{raceInfo}</span>
                  <span style={{ display: 'block', fontSize: '14px', color: 'var(--text-h)', marginTop: '2px' }}>{performance.join(' • ')}</span>
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