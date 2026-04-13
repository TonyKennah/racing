import React from 'react';
import { Chart } from 'react-google-charts';
import '../css/RaceTimeline.css';

const RaceTimeline = ({ races }) => {
  const columns = [
    { type: 'string', id: 'Venue' },
    { type: 'string', id: 'Race' },
    { type: 'string', role: 'tooltip', p: { html: true } },
    { type: 'date', id: 'Start' },
    { type: 'date', id: 'End' },
  ];

  const rows = races.map((race) => {
    const [hours, minutes] = race.time.split(':').map(Number);
    // We create a date object for today at the specific race time
    const start = new Date(0, 0, 0, hours, minutes);
    // We add 10 minutes to represent the "duration" of the race event on the timeline
    const end = new Date(0, 0, 0, hours, minutes + 10);

    // Create an HTML string for the tooltip to force single-line display and match the theme
    const tooltipHtml = `<div style="white-space: nowrap; padding: 10px; background-color: #595656; color: #ffffff; border: 1px solid #444; font-family: sans-serif; font-size: 13px;">${race.detail || ''}</div>`;

    return [race.place, race.time, tooltipHtml, start, end];
  });

  const data = [columns, ...rows];

  const chartEvents = [
    {
      eventName: 'select',
      callback: ({ chartWrapper }) => {
        const chart = chartWrapper.getChart();
        const selection = chart.getSelection();
        if (selection.length > 0) {
          const row = selection[0].row;
          const race = races[row];
          const raceId = `${race.time}${race.place.replace(/\s+/g, '')}`;
          window.location.hash = raceId;
        }
      },
    },
  ];

  const options = {
    timeline: {
      showRowLabels: true,
      groupByRowLabel: true,
      colorByRowLabel: true,
      rowLabelStyle: { fontSize: 12 },
      barLabelStyle: { fontSize: 10 },
    },
    tooltip: { isHtml: true },
    // 1st venue = Blue, 2nd venue = Red, others follow...
    colors: ['#4285F4', '#DB4437', '#F4B400', '#0F9D58', '#AB47BC', '#00ACC1', '#FF7043'],
    backgroundColor: '#2a2a2a', // Matches your dark theme
    height: rows.length * 30 + 50, // Dynamic height based on number of venues
  };

  if (!races.length) return null;

  return (
    <div className="race-timeline-container">
      <Chart
        chartType="Timeline"
        data={data}
        height="175px"
        width="100%"
        options={options}
        chartEvents={chartEvents}
      />
    </div>
  );
};

export default RaceTimeline;