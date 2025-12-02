import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface Props {
    range: string;
    setRange: (range: string) => void;
}

export function DateRangeFilter({ range, setRange }: Props) {
    return (
        <Select value={range} onValueChange={setRange}>
            <SelectTrigger className='h-8 w-32'>
                <SelectValue placeholder='Select range' />
            </SelectTrigger>
            <SelectContent side='top'>
                {['today', 'week', 'month', 'year', 'all'].map((r) => (
                    <SelectItem key={r} value={r}>
                        {r}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
