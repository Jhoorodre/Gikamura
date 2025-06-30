import React, { Suspense } from 'react';
import Spinner from '../components/common/Spinner';
const ItemViewer = React.lazy(() => import('../components/item/ItemViewer.jsx'));

const ReaderView = ({ itemData, entry, page, setPage, onBack, readingMode, setReadingMode, isFirstEntry, isLastEntry, onNextEntry, onPrevEntry }) => (
  <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Spinner /></div>}>
    <ItemViewer
      itemData={itemData}
      entry={entry}
      page={page}
      setPage={setPage}
      onBack={onBack}
      readingMode={readingMode}
      setReadingMode={setReadingMode}
      isFirstEntry={isFirstEntry}
      isLastEntry={isLastEntry}
      onNextEntry={onNextEntry}
      onPrevEntry={onPrevEntry}
    />
  </Suspense>
);

export default ReaderView;
