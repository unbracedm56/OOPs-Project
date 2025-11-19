import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface CalendarIntegrationProps {
  order: any;
}

export const CalendarIntegration = ({ order }: CalendarIntegrationProps) => {
  const addToGoogleCalendar = () => {
    if (!order.pickup_date) {
      toast({
        title: "Error",
        description: "No pickup date available for this order",
        variant: "destructive",
      });
      return;
    }

    // Parse pickup date
    const pickupDate = new Date(order.pickup_date);
    
    // Create start time (9 AM on pickup date)
    const startTime = new Date(pickupDate);
    startTime.setHours(9, 0, 0, 0);
    
    // Create end time (1 hour later)
    const endTime = new Date(startTime);
    endTime.setHours(10, 0, 0, 0);

    // Format dates for Google Calendar (YYYYMMDDTHHMMSSZ)
    const formatGoogleDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const startFormatted = formatGoogleDate(startTime);
    const endFormatted = formatGoogleDate(endTime);

    // Build event details
    const eventTitle = `Pickup Order #${order.order_number}`;
    const storeName = order.stores?.name || 'Store';
    
    // Format store address
    let storeAddress = '';
    if (order.stores?.address) {
      const addr = order.stores.address;
      storeAddress = [
        addr.line1,
        addr.line2,
        addr.city,
        addr.state,
        addr.pincode
      ].filter(Boolean).join(', ');
    }
    
    const eventDescription = `
Order Number: ${order.order_number}
Store: ${storeName}
Total: ₹${order.total.toFixed(2)}
Items: ${order.order_items?.length || 0}

Please bring your order confirmation when picking up your items.
    `.trim();

    const eventLocation = storeAddress;

    // Create Google Calendar URL
    const googleCalendarUrl = new URL('https://calendar.google.com/calendar/render');
    googleCalendarUrl.searchParams.append('action', 'TEMPLATE');
    googleCalendarUrl.searchParams.append('text', eventTitle);
    googleCalendarUrl.searchParams.append('dates', `${startFormatted}/${endFormatted}`);
    googleCalendarUrl.searchParams.append('details', eventDescription);
    if (eventLocation) {
      googleCalendarUrl.searchParams.append('location', eventLocation);
    }
    googleCalendarUrl.searchParams.append('sf', 'true');
    googleCalendarUrl.searchParams.append('output', 'xml');

    // Open in new window
    window.open(googleCalendarUrl.toString(), '_blank');
    
    toast({
      title: "Opening Google Calendar",
      description: "Your pickup reminder is being added to your calendar",
    });
  };

  // Only show for store pickup orders
  if (!order.is_store_pickup) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={addToGoogleCalendar}
      className="gap-2"
    >
      <Calendar className="h-4 w-4" />
      Add to Calendar
    </Button>
  );
};
