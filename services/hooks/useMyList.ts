import { useState, useCallback, useEffect } from 'react';
import { myListService } from '../myListService';
import { MyListItem } from '../../types/myList';

export function useMyList() {
    const [myListItems, setMyListItems] = useState<MyListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadMyList = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const items = await myListService.getMyList();
            setMyListItems(items);
        } catch (err) {
            setError('Failed to load My List');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Optionally initial load on mount
    useEffect(() => {
        loadMyList();
    }, [loadMyList]);

    return {
        myListItems,
        isLoading,
        error,
        loadMyList,
    };
}
