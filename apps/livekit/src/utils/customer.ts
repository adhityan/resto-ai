import { CustomerModel } from "@repo/contracts/customer/models/customer.model";

/**
 * Constructs a description of the available knowledge about a customer
 * based on the fields that are not empty.
 *
 * @param customer - The customer object containing available information
 * @returns A string description of what is known about the customer
 */
export function describeCustomerKnowledge(customer: CustomerModel): string {
    const hasName = !!customer.name;
    const hasEmail = !!customer.email;
    const hasAddress = !!customer.address;

    // Check if only phone and numberOfCalls are set (no other optional fields)
    const hasOnlyBasicInfo = !hasName && !hasEmail && !hasAddress;

    if (hasOnlyBasicInfo) {
        if (customer.numberOfCalls === 1) {
            return `This is the customer's very first call. His phone number is ${customer.phone}. No previous reservation history or personal details are available yet.`;
        } else {
            return `The customer has called ${customer.numberOfCalls} times before but has never made a reservation. His phone number is ${customer.phone}. No personal details are available yet.`;
        }
    }

    // Build description based on available fields
    const details: string[] = [];

    // Always include phone number
    details.push(
        `Here are some details about the customer. Phone: ${customer.phone}`
    );

    if (hasName) {
        details.push(`Name: ${customer.name}`);
    }

    if (hasEmail) {
        details.push(`Email: ${customer.email}`);
    }

    if (hasAddress) {
        details.push(`Address: ${customer.address}`);
    }

    // Add information about missing fields
    const missingFields: string[] = [];
    if (!hasName) missingFields.push("name");
    if (!hasEmail) missingFields.push("email");
    if (!hasAddress) missingFields.push("address");

    if (missingFields.length > 0) {
        details.push(`Missing information: ${missingFields.join(", ")}.`);
    }

    // Add call count at the end
    details.push(
        `The customer has called ${customer.numberOfCalls} time${customer.numberOfCalls === 1 ? "" : "s"}.`
    );

    return details.join(" ");
}
