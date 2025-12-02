import { FilterFn } from "@tanstack/react-table";

export const inArray =
    <T>(): FilterFn<T> =>
    (row, columnId, value: string[]) => {
        if (!value || value.length === 0) return true;
        const rowValue = row.getValue(columnId);
        return value.includes(rowValue as string);
    };
