import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import '../css/FormChart.css';

const CustomDot = (props) => {
  const { cx, cy, stroke, payload, dataKey } = props;
  if (payload[`${dataKey}_isLowest`]) {
    return (
      <g>
        <circle cx={cx} cy={cy} r={3} fill={stroke} stroke={stroke} strokeWidth={1} />
        <text x={cx} y={cy - 10} fill={stroke} textAnchor="middle" fontSize={12} fontWeight="bold">
          {dataKey}
        </text>
      </g>
    );
  }
  return <circle cx={cx} cy={cy} r={3} fill={stroke} stroke={stroke} strokeWidth={1} />;
};

const OddsChart = ({ horses }) => {
  const LINE_COLORS = [
    '#e6194b', '#3cb44b', '#3b7944', '#4363d8', '#f58231', 
    '#911eb4', '#46f0f0', '#f032e6', '#b5d44f', '#fabebe', 
    '#008080', '#e6beff', '#9a6324', '#854779', '#bb6868', 
    '#134b56', '#808000', '#ffd8b1', '#656591', '#808080'
  ];

  const chartData = useMemo(() => {
    // Find the maximum number of odds updates across all horses to define our X-axis range
    const maxLength = Math.max(...horses.map(h => (h.odds ? h.odds.length : 0)));
    
    // Pre-calculate the minimum odds for each horse to flag the "isLowest" point
    const horseMinOdds = {};
    horses.forEach(horse => {
      const numericOdds = horse.odds
        ?.filter(o => o && o !== "null" && o !== "NR" && !isNaN(o))
        .map(o => parseFloat(o)) || [];
      horseMinOdds[horse.name] = numericOdds.length > 0 ? Math.min(...numericOdds) : null;
    });

    const data = [];
    for (let i = 0; i < maxLength; i++) {
      const point = { updateIndex: `Update ${i + 1}` };
      horses.forEach(horse => {
        const oddVal = horse.odds?.[i];
        // Parse numeric odds, ignore "null" or "NR" for the chart line
        if (oddVal && oddVal !== "null" && oddVal !== "NR" && !isNaN(oddVal)) {
          const val = parseFloat(oddVal);
          point[horse.name] = val;
          if (val === horseMinOdds[horse.name]) {
            point[`${horse.name}_isLowest`] = true;
          }
        }
      });
      data.push(point);
    }
    return data;
  }, [horses]);

  // If no odds data exists yet
  if (chartData.length === 0) {
    return <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text)' }}>No odds history available.</div>;
  }

  return (
    <div className="form-chart-container">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis 
            dataKey="updateIndex" 
            tick={{ fill: 'var(--text)', fontSize: 12 }} 
          />
          <YAxis 
            reversed // Odds are usually better when lower, but often charts show them normally. 
            // Removing 'reversed' if you prefer high numbers at the top.
            domain={['auto', 'auto']}
            tick={{ fill: 'var(--text)', fontSize: 12 }}
            label={{ value: 'Decimal Odds', angle: -90, position: 'insideLeft', fill: 'var(--text)' }}
          />
          <Tooltip 
            shared={false}
            trigger="hover"
            itemSorter={(item) => item.value}
            contentStyle={{ backgroundColor: '#2a2a2a', border: '1px solid #444' }}
            itemStyle={{ fontSize: '13px' }}
            formatter={(value, name) => [Number(value), name]}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '10px' }}
            inactiveColor="#666"
          />
          {horses.map((horse, index) => {
            // Only draw a line if the horse actually has numeric odds
            const hasData = horse.odds?.some(o => o && o !== "null" && o !== "NR");
            if (!hasData) return null;

            return (
              <Line 
                key={horse.name}
                type="monotone" 
                dataKey={horse.name} 
                stroke={LINE_COLORS[index % LINE_COLORS.length]} 
                strokeWidth={2}
                dot={<CustomDot />}
                connectNulls // Connects line if a horse misses an update
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default OddsChart;
