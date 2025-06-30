import React from 'react';
import ItemInfo from '../components/item/ItemInfo';
import EntryList from '../components/item/EntryList';
import Button from '../components/common/Button';

const ItemDetailView = ({ item, onBack, onSelectEntry, readChapters }) => {
    return (
        <>
            <div className="mb-4">
                <Button onClick={onBack} className="btn-secondary">
                    &larr; Voltar para a lista
                </Button>
            </div>
            <ItemInfo itemData={item} />
            <EntryList
                itemData={item}
                onSelectEntry={onSelectEntry}
                readChapters={readChapters}
            />
        </>
    );
};

export default ItemDetailView;
