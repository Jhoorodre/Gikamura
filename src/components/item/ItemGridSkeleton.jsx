const SkeletonCard = () => (
    <div className="media-card">
        <div className="bg-slate-700 aspect-[3/4] w-full"></div>
        <div className="p-4">
            <div className="h-4 bg-slate-700 rounded w-3/4"></div>
        </div>
    </div>
);

const ItemGridSkeleton = ({ count = 8 }) => (
    <div className="grid grid-auto-fill gap-8">
        {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
);

export default ItemGridSkeleton;
