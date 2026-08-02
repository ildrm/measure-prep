import { Results } from "@/components/results";
export default async function ResultsPage({ params }: { params: Promise<{ sessionId: string }> }) { const { sessionId } = await params; return <Results sessionId={sessionId}/>; }
