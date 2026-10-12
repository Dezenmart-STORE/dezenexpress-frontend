import RiderGuard from "@/components/express/rider/RiderGuard";
import RiderRequests from "@/components/express/rider/RiderRequests";
export default function Page() {
  return (
    <RiderGuard>
      <RiderRequests />
    </RiderGuard>
  );
}
