import { ConcertAvailabilityView } from "./view";
export default async function AdminConcertAvailabilityPage({ params }: PageProps<"/admin/concerts/[id]">) { const { id } = await params; return <ConcertAvailabilityView id={Number(id)} />; }
