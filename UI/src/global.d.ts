export {};

declare global {
    interface Array<T> {
        map<U>(callback: (value: T, index: number, array: T[]) => U): U[];
        filter(callback: (value: T, index: number, array: T[]) => boolean): T[];
        sort(compareFn?: (a: T, b: T) => number): this;
        forEach(callback: (value: T, index: number, array: T[]) => void): void;
        find(
            predicate: (value: T, index: number, obj: T[]) => boolean
        ): T | undefined;
        reduce<U>(
            callback: (
                previousValue: U,
                currentValue: T,
                index: number,
                array: T[]
            ) => U,
            initialValue: U
        ): U;
    }
}
