import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface ContentSectionProps {
    title: string;
    desc: string;
    children: React.JSX.Element;
    wide?: boolean;
}

export default function ContentSection({
    title,
    desc,
    children,
    wide,
}: ContentSectionProps) {
    return (
        <div className='flex flex-1 flex-col'>
            <div className='mb-2'>
                <h2 className='text-2xl font-bold tracking-tight'>{title}</h2>
                <p className='text-muted-foreground'>{desc}</p>
            </div>
            <Separator className='my-4' />
            <ScrollArea className='faded-bottom h-full w-full scroll-smooth pb-28'>
                <div className={wide ? 'w-full' : 'lg:max-w-2xl'}>
                    {children}
                </div>
            </ScrollArea>
        </div>
    );
}
