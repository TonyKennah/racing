import React, { useMemo } from 'react';
import shallow from 'zustand/shallow';
import { HOT_TRAINERS, HOT_JOCKEYS, HOT_FOALED, HOT_OWNERS } from '../../utils/racingLogic';
import { useStore } from '../../store/alarmStore';

const TrainerSelections = ({ races, onClose }) => {
  // Pull all selected values and setters from the store using a tuple selector + shallow equality
  const [
    selectedTrainers,
    setSelectedTrainers,
    selectedJockeys,
    setSelectedJockeys,
    selectedOwners,
    setSelectedOwners,
    selectedFoaled,
    setSelectedFoaled
  ] = useStore(
    (state) => [
      state.selectedTrainers,
      state.setSelectedTrainers,
      state.selectedJockeys,
      state.setSelectedJockeys,
      state.selectedOwners,
      state.setSelectedOwners,
      state.selectedFoaled,
      state.setSelectedFoaled
    ],
    shallow
  );

  // Extract distinct values for the four fields in one pass
  const todays = useMemo(() => {
    const trainers = new Set();
    const jockeys = new Set();
    const owners = new Set();
    const foaled = new Set();

    if (races) {
      races.forEach((race) => {
        if (race.horses) {
          race.horses.forEach((horse) => {
            if (horse.trainer) {
              const t = horse.trainer.trim();
              if (t) trainers.add(t);
            }
            if (horse.jockey) {
              const j = horse.jockey.trim();
              if (j) jockeys.add(j);
            }
            if (horse.owner) {
              const o = horse.owner.trim();
              if (o) owners.add(o);
            }
            if (horse.foaled) {
              const f = horse.foaled.trim();
              if (f) foaled.add(f);
            }
          });
        }
      });
    }

    const sortArray = (arr) => Array.from(arr).sort((a, b) => a.localeCompare(b));

    return {
      trainers: sortArray(trainers),
      jockeys: sortArray(jockeys),
      owners: sortArray(owners),
      foaled: sortArray(foaled)
    };
  }, [races]);

  // Generic helpers to preserve existing behaviour when selectedX === null (use HOT_* defaults)
  const isCheckedGeneric = (value, selected, hotList) => {
    if (selected === null) {
      return hotList.some((hot) => value.includes(hot));
    }
    return selected.includes(value);
  };

  const handleToggleGeneric = (value, selected, setSelected, hotList, items) => {
    let currentCheckedList;
    if (selected === null) {
      currentCheckedList = items.filter((i) => hotList.some((hot) => i.includes(hot)));
    } else {
      currentCheckedList = [...selected];
    }

    if (currentCheckedList.includes(value)) {
      setSelected(currentCheckedList.filter((i) => i !== value));
    } else {
      setSelected([...currentCheckedList, value]);
    }
  };

  const sections = [
    {
      key: 'trainers',
      title: 'Trainers Today',
      items: todays.trainers,
      selected: selectedTrainers,
      setSelected: setSelectedTrainers,
      hot: HOT_TRAINERS
    },
    {
      key: 'jockeys',
      title: 'Jockeys Today',
      items: todays.jockeys,
      selected: selectedJockeys,
      setSelected: setSelectedJockeys,
      hot: HOT_JOCKEYS
    },
    {
      key: 'owners',
      title: 'Owners Today',
      items: todays.owners,
      selected: selectedOwners,
      setSelected: setSelectedOwners,
      hot: HOT_OWNERS
    },
    {
      key: 'foaled',
      title: 'Parents Today',
      items: todays.foaled,
      selected: selectedFoaled,
      setSelected: setSelectedFoaled,
      hot: HOT_FOALED
    }
  ];

  const sectionGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '12px',
    marginTop: '15px',
    paddingRight: '5px'
  };

  const optionStyle = (checked) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
    fontSize: '0.95rem',
    padding: '8px 12px',
    borderRadius: '6px',
    backgroundColor: checked ? 'var(--accent-bg, var(--bg-card))' : 'var(--bg-card)',
    border: checked ? '1px solid #10B981' : '1px solid var(--border)',
    transition: 'all 0.2s ease',
    userSelect: 'none',
    boxShadow: checked ? '0 0 4px rgba(16, 185, 129, 0.2)' : 'none'
  });

  return (
    <div className="trainer-selections-container" style={{ padding: '10px 5px', maxHeight: '550px', overflowY: 'auto' }}>
      {sections.map((sec) => (
        <details key={sec.key} style={{ marginBottom: '24px' }}>
          <summary style={{
            color: 'var(--text-h)',
            fontSize: '1.1rem',
            fontWeight: '600',
            cursor: 'pointer',
            paddingBottom: '6px',
            borderBottom: '1px solid var(--border)',
            userSelect: 'none',
            listStylePosition: 'inside'
          }}>
            {sec.title}
          </summary>

          <div style={sectionGridStyle}>
            {sec.items.map((item) => {
              const checked = isCheckedGeneric(item, sec.selected, sec.hot);
              return (
                <label key={item} style={optionStyle(checked)}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleToggleGeneric(item, sec.selected, sec.setSelected, sec.hot, sec.items)}
                    style={{
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer',
                      accentColor: '#10B981'
                    }}
                  />
                  <span style={{
                    color: checked ? 'var(--text-h)' : 'var(--text)',
                    fontWeight: checked ? '600' : 'normal',
                    opacity: checked ? 1 : 0.7
                  }}>{item}</span>
                </label>
              );
            })}
          </div>
        </details>
      ))}
    </div>
  );
};

export default TrainerSelections;
