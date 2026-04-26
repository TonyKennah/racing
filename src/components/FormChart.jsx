import React, { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import '../css/FormChart.css';

const CustomDot = (props) => {
  const { cx, cy, stroke, payload, dataKey } = props;
  const isHighest = payload[`${dataKey}_isHighest`];
  const isWin = payload[`${dataKey}_isWin`];
  const isSameDist = payload[`${dataKey}_isSameDist`];

  return (
    <g>
      {isWin ? (
        <text 
          x={cx} 
          y={cy - (isSameDist ? 2 : 1)} // Adjusted Y to visually center symbols
          fill={stroke} 
          textAnchor="middle" 
          dominantBaseline="central" 
          fontSize={isSameDist ? 24 : 16}
        >★</text>
      ) : (
        <circle cx={cx} cy={cy} r={3} fill={stroke} stroke={stroke} strokeWidth={1} />
      )}
      {isHighest && (
        <text x={cx} y={cy - 15} fill={stroke} textAnchor="middle" dominantBaseline="central" fontSize={14} fontWeight="bold">
          {`${dataKey} ${payload[`${dataKey}_latestOdds`]}`}
        </text>
      )}
    </g>
  );
};

const FormChart = ({ horses, onNext, onPrev, hasNext, hasPrev, todayDistance }) => {
  const parseDistanceToFurlongs = (distStr) => {
    if (!distStr || typeof distStr !== 'string') return 0;
    let totalFurlongs = 0;
    
    const mMatch = distStr.match(/(\d+)m/);
    const fMatch = distStr.match(/(\d+)f/);
    const yMatch = distStr.match(/(\d+)y/);

    if (mMatch) totalFurlongs += parseInt(mMatch[1], 10) * 8;
    if (fMatch) totalFurlongs += parseInt(fMatch[1], 10);


    if (yMatch) {
      const yards = parseInt(yMatch[1], 10);
      totalFurlongs += Math.round(yards / 220); // Round to nearest furlong
    }
    return totalFurlongs;
  };

  const formatFurlongsToMiles = (furlongsStr) => {
    if (!furlongsStr || typeof furlongsStr !== 'string' || !furlongsStr.endsWith('f')) {
      return furlongsStr;
    }
    const furlongs = parseInt(furlongsStr.slice(0, -1), 10);
    if (isNaN(furlongs)) return furlongsStr;

    const miles = Math.floor(furlongs / 8);
    const remainingFurlongs = furlongs % 8;

    let result = '';
    if (miles > 0) result += `${miles}m`;
    if (remainingFurlongs > 0) {
      result += (result ? ' ' : '') + `${remainingFurlongs}f`;
    }
    return result || (furlongs === 0 ? '0f' : furlongsStr);
  };

  const [top2Only, setTop2Only] = useState(false);
  const [distOnly, setDistOnly] = useState(false);

  const chartData = useMemo(() => {
    const map = {};
    const horseMaxRatings = {};
    const todayFurlongs = parseDistanceToFurlongs(todayDistance);

    horses.forEach(horse => {
      // Skip non-runners
      const lastOdd = horse.odds?.[horse.odds.length - 1];
      if (lastOdd === "null" || lastOdd === "NR") return;

      // Pre-calculate the career max rating for each horse to avoid redundant calculations
      const ratings = horse.past.map(pr => parseFloat(pr.name)).filter(n => !isNaN(n));
      horseMaxRatings[horse.name] = ratings.length > 0 ? Math.max(...ratings) : -1;

      const displayOdd = lastOdd === "null" ? "NR" : (lastOdd ? (isNaN(lastOdd) ? lastOdd : Number(lastOdd)) : "x");

      horse.past.forEach(race => {
        const posStr = race.position ? race.position.toString().trim() : "";
        const actualPos = posStr.split('/')[0]; // Extract the finishing position from format "3/4"
        const isWinner = actualPos === "1";
        const isSameDist = parseDistanceToFurlongs(race.distance) === todayFurlongs && todayFurlongs > 0;

        // Filter logic: If top2Only is active, include 1st, 2nd, or beaten < 2 lengths
        if (top2Only) {
            const isTop2 = isWinner || actualPos === "2";
            
            let isClose = false;
            if (race.distBeaten) {
                const distStr = race.distBeaten.toLowerCase().trim();
                // Handle common racing abbreviations for small distances (shd, hd, nk, etc.)
                const abbreviations = ['shd', 'hd', 'nk', 'ns', 'dh'];
                if (abbreviations.includes(distStr)) {
                    isClose = true;
                } else {
                    const distNum = parseFloat(distStr);
                    if (!isNaN(distNum) && distNum < 2) isClose = true;
                }
            }
            
            if (!isTop2 && !isClose) return;
        }

        // Filter logic: If distOnly is active, skip races that aren't the same distance
        if (distOnly && !isSameDist) {
            return;
        }

        const [d, m, y] = race.date.split('/');
        const timestamp = new Date(y, m - 1, d).getTime();

        if (!map[timestamp]) map[timestamp] = { timestamp, date: race.date };

        map[timestamp][horse.name] = parseFloat(race.name);
        map[timestamp][`${horse.name}_todayWeight`] = horse.weight;
        map[timestamp][`${horse.name}_latestOdds`] = displayOdd;
        map[timestamp][`${horse.name}_isWin`] = isWinner;
        map[timestamp][`${horse.name}_isSameDist`] = isSameDist;

        const beaten = race.distBeaten ? ` (${race.distBeaten} l)` : '';
        map[timestamp][`${horse.name}_details`] = 
          `${race.time} ${race.course} (Class ${race.raceClass}, ${formatFurlongsToMiles(race.distance)}, ${race.going}) | ` +
          `Pos: ${race.position}${beaten} | Wt: ${race.weight}`;
      });
    });

    const sortedData = Object.values(map).sort((a, b) => a.timestamp - b.timestamp);

    // Single-annotation pass: Mark only the chronologically first occurrence of the max rating
    const annotatedHorses = new Set();
    const horseNames = Object.keys(horseMaxRatings);

    sortedData.forEach(point => {
      horseNames.forEach(horseName => {
        if (point[horseName] === horseMaxRatings[horseName] && !annotatedHorses.has(horseName)) {
          point[`${horseName}_isHighest`] = true;
          annotatedHorses.add(horseName);
        }
      });
    });

    return sortedData;
  }, [horses, top2Only, distOnly, todayDistance]);

  const LINE_COLORS = [
    '#e6194b', '#3cb44b', '#3b7944', '#4363d8', '#f58231', 
    '#911eb4', '#46f0f0', '#f032e6', '#b5d44f', '#fabebe', 
    '#008080', '#e6beff', '#9a6324', '#854779', '#bb6868', 
    '#134b56', '#808000', '#ffd8b1', '#656591', '#808080'
  ];

  return (
    <div className="form-chart-container">
      <div className="chart-controls" style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          {hasPrev && (
            <button className="race-analytics-btn" onClick={onPrev}>
              ← Prev Race
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className={`race-analytics-btn ${top2Only ? 'active' : ''}`}
            onClick={() => setTop2Only(!top2Only)}
          >
            {top2Only ? 'Showing Top 2' : 'Filter Top 2'}
          </button>
          <button 
            className={`race-analytics-btn ${distOnly ? 'active' : ''}`}
            onClick={() => setDistOnly(!distOnly)}
          >
            {distOnly ? 'Showing Same Dist' : 'Filter Same Dist'}
          </button>
        </div>

        <div style={{ flex: 1, textAlign: 'right' }}>
          {hasNext && (
            <button className="race-analytics-btn" onClick={onNext}>
              Next Race →
            </button>
          )}
        </div>
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