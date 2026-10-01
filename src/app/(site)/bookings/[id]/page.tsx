import { BookingDetail } from "./view";
export default async function BookingDetailPage({ params }: PageProps<"/bookings/[id]">) { const { id } = await params; return <BookingDetail id={Number(id)} />; }
