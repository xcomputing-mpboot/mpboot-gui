import { useCallback, useMemo, useState } from 'react';
import { loadPhylipMatrix } from './heavy-task';
import { CellPosition, MatrixTable } from './Table';

export type PhyRenderedContentProps = {
  content: string;
  className?: string;
};

export const PhyRenderedContent = (props: PhyRenderedContentProps) => {
  const { content } = props;
  const phylipMatrix = useMemo(() => loadPhylipMatrix(content), [content]);
  const [highlightCell, setHighlightCell] = useState({ col: 0, row: 0 });

  const onCellClick = useCallback((e: any) => {
    const { col, row } = e.target.dataset;
    if (col && row) {
      const cell = { col: parseInt(col), row: parseInt(row) };
      setHighlightCell(cell);
    }
  }, []);

  const onCellSubmit = useCallback((e: any) => {
    setHighlightCell(e);
  }, []);

  return (
    <div style={{ height: '95%', paddingLeft: '10px', paddingBottom: '5px' }}>
      <MatrixTable
        phylipMatrix={phylipMatrix}
        onCellClick={onCellClick}
        highlightCell={highlightCell}
      />
      <CellPosition
        maxColumns={phylipMatrix.dimension.columns}
        maxRows={phylipMatrix.dimension.rows}
        currentCell={highlightCell}
        onCellSubmit={onCellSubmit}
      />
    </div>
  );
};
