import { TestRunner } from "@/components/test-runner";
export default async function TestPage({ params }: { params: Promise<{ sessionId: string }> }) { const { sessionId } = await params; return <TestRunner sessionId={sessionId}/>; }
