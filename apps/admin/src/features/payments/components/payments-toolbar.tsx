import { useMemo } from "react";
import { usePaymentsStore } from "@/stores/paymentsStore";
import { DateRangeFilter } from "@/components/date-range-filter";
import { StatusFilter } from "./payment-status-filter";
import { PaymentTypeFilter } from "./payment-type-filter";
import { MultiSelectFilter } from "./multi-select-filter";

export default function PaymentsToolbar() {
    const filters = usePaymentsStore((s) => s.filters);
    const payments = usePaymentsStore((s) => s.payments);
    const setRange = usePaymentsStore((s) => s.setRange);
    const setFilterValue = usePaymentsStore((s) => s.setFilterValue);
    const setFilters = usePaymentsStore((s) => s.setFilters);

    // Extract unique values from payments data
    const applicationOptions = useMemo(() => {
        return Array.from(new Set(payments.map((p) => p.applicationName)));
    }, [payments]);

    const productOptions = useMemo(() => {
        return Array.from(new Set(payments.map((p) => p.productName)));
    }, [payments]);

    const currencyOptions = useMemo(() => {
        return Array.from(new Set(payments.map((p) => p.currency)));
    }, [payments]);

    return (
        <div className="flex items-center justify-between">
            <div className="flex flex-1 items-center space-x-2">
                <DateRangeFilter range={filters.range} setRange={setRange} />
                <MultiSelectFilter
                    title="Application"
                    options={applicationOptions}
                    selected={filters.applications}
                    onChange={(values) => setFilterValue("applications", values)}
                />
                <MultiSelectFilter
                    title="Product"
                    options={productOptions}
                    selected={filters.products}
                    onChange={(values) => setFilterValue("products", values)}
                />
                <MultiSelectFilter
                    title="Currency"
                    options={currencyOptions}
                    selected={filters.currencies}
                    onChange={(values) => setFilterValue("currencies", values)}
                />
                <PaymentTypeFilter type={filters.type} setType={(type) => setFilters({ type })} />
                <StatusFilter status={filters.status} setStatus={(status) => setFilterValue("status", status)} />
            </div>
        </div>
    );
}
