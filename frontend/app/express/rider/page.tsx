import RiderGuard from "@/components/express/rider/RiderGuard";
import RiderDashboard from "@/components/express/rider/RiderDashboard";
export default function Page() {
  return (
    <RiderGuard>
      <RiderDashboard />
    </RiderGuard>
  );
}
