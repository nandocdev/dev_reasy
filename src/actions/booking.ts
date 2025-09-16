"use server"

import { calculateAvailabilityWithAI } from "@/ai/flows/availability-calculation-ai"
import type { CalculateAvailabilityOutput } from "@/ai/flows/availability-calculation-ai"
import { services } from "@/lib/data"

const staffSchedules = {
    'Jane Doe': 'Works Mon-Fri 9am-5pm. Lunch at 1pm-2pm. Already booked 2pm-3pm on the selected date.',
    'John Smith': 'Works Mon, Tue, Thu, Fri 10am-6pm. Off on Wednesdays. Available all day.',
    'Emily White': 'Works Sat-Sun 10am-7pm. Weekdays off. Has a personal appointment 1pm-2pm.',
    'Michael Brown': 'Works Mon-Sat 9am-6pm. Lunch break 12pm-1pm. Fully booked until 4pm on the selected date.',
};

const resourceAvailability = 'We have 3 styling chairs, 2 massage rooms, and 3 manicure stations. All are available unless booked. Massage Room 1 is undergoing maintenance from 10am to 11am.';

export async function getAvailableSlots(
    serviceId: string,
    date: Date
): Promise<CalculateAvailabilityOutput> {
    const service = services.find(s => s.id === serviceId);
    if (!service) {
        throw new Error("Service not found");
    }

    const startTime = new Date(date);
    startTime.setHours(8, 0, 0, 0); // Check from 8 AM

    const endTime = new Date(date);
    endTime.setHours(21, 0, 0, 0); // Check until 9 PM

    try {
        const availability = await calculateAvailabilityWithAI({
            serviceName: service.name,
            serviceDuration: service.duration,
            staffSchedules: JSON.stringify(staffSchedules),
            resourceAvailability: resourceAvailability,
            customerPreferences: "Prefers an afternoon slot but is flexible.",
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
        });
        return availability;
    } catch (error) {
        console.error("AI availability calculation failed:", error);
        
        const mockStartTime1 = new Date(date);
        mockStartTime1.setHours(14, 0, 0, 0);
        const mockEndTime1 = new Date(mockStartTime1.getTime() + service.duration * 60000);

        const mockStartTime2 = new Date(date);
        mockStartTime2.setHours(15, 30, 0, 0);
        const mockEndTime2 = new Date(mockStartTime2.getTime() + service.duration * 60000);

        return {
            availableSlots: [
                { startTime: mockStartTime1.toISOString(), endTime: mockEndTime1.toISOString() },
                { startTime: mockStartTime2.toISOString(), endTime: mockEndTime2.toISOString() },
            ],
            summary: "AI service is currently unavailable. Showing mock availability based on a standard afternoon schedule.",
        };
    }
}
