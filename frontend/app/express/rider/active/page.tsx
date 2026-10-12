import RiderGuard from "@/components/express/rider/RiderGuard";
import ActiveService from "@/components/express/rider/ActiveService";
export default function Page() {
  return (
    <RiderGuard>
      <ActiveService />
    </RiderGuard>
  );
}
